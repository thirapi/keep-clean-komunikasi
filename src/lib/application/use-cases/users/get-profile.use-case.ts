import { IUserRepository } from "../../repositories/user.repository.interface";
import { IFollowerRepository } from "../../repositories/follower.repository.interface";
import { IRemoteActorRepository } from "../../repositories/remote-actor.repository.interface";
import { WebFingerService } from "@/lib/infrastructure/services/webfinger.service";
import { IPostRepository } from "../../repositories/post.repository.interface";
import { createId } from "@paralleldrive/cuid2";
import { ActivityPubFetchService } from "@/lib/infrastructure/services/activitypub-fetch.service";

export class GetProfileUseCase {
    constructor(
        private userRepository: IUserRepository,
        private followerRepository: IFollowerRepository,
        private remoteActorRepository: IRemoteActorRepository,
        private postRepository: IPostRepository
    ) { }

    private extractEmojis(tag: any[] | undefined) {
        if (!tag || !Array.isArray(tag)) return null;
        const emojis = tag
            .filter((t: any) => t.type === "Emoji")
            .map((t: any) => ({
                name: t.name,
                url: t.icon?.url
            }));
        return emojis.length > 0 ? emojis : null;
    }

    async execute(username: string, currentUserId?: string) {
        // Decode username just in case it's double-encoded
        const decodedUsername = decodeURIComponent(username);
        
        console.log(`[GetProfile] Fetching profile for: ${decodedUsername}`);

        // 0. Normalize identifier: if it contains our local domain, treat as local user
        let normalizedUsername = decodedUsername;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komunikasi.qzz.io";
        const appDomain = new URL(appUrl).hostname.toLowerCase();

        if (decodedUsername.includes("@")) {
            const handle = decodedUsername.startsWith("@") ? decodedUsername : `@${decodedUsername}`;
            const parts = handle.slice(1).split("@");
            const localPart = parts[0];
            const domain = parts[1]?.toLowerCase();

            if (domain === appDomain || domain === "localhost") {
                normalizedUsername = localPart;
            }
        }

        // 1. Try local user first (using normalized name)
        const user = await this.userRepository.findByUsernameWithRoles(normalizedUsername);
        
        if (user) {
            const followerCount = await this.followerRepository.getFollowerCount(user.id);
            const followingCount = await this.followerRepository.getFollowingCount(user.id);
            const isFollowing = currentUserId ? await this.followerRepository.isFollowing(currentUserId, user.id) : false;

            return {
                id: user.id,
                username: user.username,
                displayName: user.name,
                avatar: user.avatar,
                bio: user.bio,
                banner: user.banner,
                customStatus: user.customStatus,
                roles: user.roles,
                createdAt: user.createdAt,
                stats: {
                    followers: followerCount,
                    following: followingCount,
                },
                isFollowing,
                isRemote: false
            };
        }

        // 2. Try remote actor if handle looks like Fediverse (@user@domain or user@domain)
        const isRemoteHandle = decodedUsername.includes("@");
        if (isRemoteHandle) {
            const handle = decodedUsername.startsWith("@") ? decodedUsername : `@${decodedUsername}`;
            const parts = handle.slice(1).split("@");
            const localPart = parts[0];
            const domain = parts[1];
            
            if (localPart && domain) {
                // Check if we already have this remote actor
                let remoteActor = await this.remoteActorRepository.findByUsernameAndDomain(localPart, domain);
                
                // Fetch/Refresh remote actor data
                const actorUrl = await WebFingerService.resolveHandle(handle, currentUserId);
                if (actorUrl) {
                    try {
                        console.log(`[GetProfile] Fetching remote actor data from ${actorUrl} (signed)`);
                        const response = await ActivityPubFetchService.fetch(actorUrl, {}, currentUserId);

                        if (response.ok) {
                            const actorData = await response.json();
                            
                            // Map bio (ActivityPub summary is often HTML)
                            const bio = actorData.summary || `User from ${domain}`;
                            const emojis = this.extractEmojis(actorData.tag);
                            
                            // Try to get follower/following counts (Mastodon extensions or collection totalItems)
                            let followersCount = actorData.followersCount || 0;
                            let followingsCount = actorData.followingCount || 0;

                            // Fallback to fetching collections only if Mastodon counts aren't present
                            if (followersCount === 0 && actorData.followers) {
                                try {
                                    const fRes = await ActivityPubFetchService.fetch(actorData.followers, {}, currentUserId);
                                    if (fRes.ok) {
                                        const fData = await fRes.json();
                                        followersCount = fData.totalItems || 0;
                                    }
                                } catch (e) {
                                    console.warn(`[GetProfile] Could not fetch followers for ${handle}`, e);
                                }
                            }

                            if (followingsCount === 0 && actorData.following) {
                                try {
                                    const fRes = await ActivityPubFetchService.fetch(actorData.following, {}, currentUserId);
                                    if (fRes.ok) {
                                        const fData = await fRes.json();
                                        followingsCount = fData.totalItems || 0;
                                    }
                                } catch (e) {
                                    console.warn(`[GetProfile] Could not fetch following for ${handle}`, e);
                                }
                            }
                            
                            remoteActor = {
                                id: actorUrl,
                                username: localPart,
                                domain: domain,
                                name: actorData.name || localPart,
                                bio: bio,
                                banner: actorData.image?.url || null,
                                avatar: actorData.icon?.url || actorData.image?.url,
                                inbox: actorData.inbox,
                                sharedInbox: actorData.endpoints?.sharedInbox,
                                publicKey: actorData.publicKey?.publicKeyPem,
                                followerCount: followersCount,
                                followingCount: followingsCount,
                                published: actorData.published ? new Date(actorData.published) : (remoteActor?.published || new Date()),
                                emojis: emojis as any,
                                createdAt: remoteActor?.createdAt || new Date(),
                                updatedAt: new Date()
                            };
                            await this.remoteActorRepository.upsert(remoteActor);

                            // Bonus: Try to fetch their outbox to populate initial posts
                            if (actorData.outbox) {
                                // Background execution
                                this.fetchRemoteOutbox(actorData.outbox, actorUrl, currentUserId).catch(err => 
                                    console.error(`[GetProfile] Failed to fetch outbox for ${handle}:`, err)
                                );
                            }
                        } else {
                            console.error(`[GetProfile] Failed to fetch actor data: ${response.status}`);
                        }
                    } catch (err) {
                        console.error(`[GetProfile] Error fetching remote actor:`, err);
                    }
                }

                if (remoteActor) {
                    const isFollowing = currentUserId ? await this.followerRepository.isFollowing(currentUserId, remoteActor.id) : false;
                    
                    return {
                        id: remoteActor.id,
                        username: handle,
                        displayName: remoteActor.name,
                        avatar: remoteActor.avatar || "/avatars/avatar1.png",
                        bio: remoteActor.bio,
                        banner: remoteActor.banner,
                        customStatus: null,
                        roles: [{ id: "remote", name: "Remote User" }],
                        createdAt: remoteActor.published || remoteActor.createdAt,
                        stats: {
                            followers: remoteActor.followerCount, 
                            following: remoteActor.followingCount,
                        },
                        emojis: remoteActor.emojis,
                        isFollowing,
                        isRemote: true,
                        domain: remoteActor.domain,
                        handle: handle
                    };
                }
            }
        }

        console.error(`[GetProfile] User not found: ${decodedUsername}`);
        throw new Error("User not found");
    }

    private fetchRemoteOutbox = async (outboxUrl: string, remoteActorId: string, currentUserId?: string) => {
        try {
            console.log(`[GetProfile] Fetching outbox items from ${outboxUrl} (signed)`);
            const response = await ActivityPubFetchService.fetch(outboxUrl, {}, currentUserId);

            if (!response.ok) return;
            let data = await response.json();

            // If it's a collection, get the first page
            let items = data.orderedItems || data.items || [];
            
            if (items.length === 0 && data.first) {
                const pageUrl = typeof data.first === 'string' ? data.first : data.first.id;
                const pageResponse = await ActivityPubFetchService.fetch(pageUrl, {}, currentUserId);
                if (pageResponse.ok) {
                    const pageData = await pageResponse.json();
                    items = pageData.orderedItems || pageData.items || [];
                }
            }

            console.log(`[GetProfile] Found ${items.length} items in outbox for ${remoteActorId}`);

            for (const item of items.slice(0, 20)) {
                const activity = typeof item === 'string' ? null : item;
                if (!activity) continue;

                // ActivityPub items in outbox are usually 'Create' activities
                let object = activity.object;
                
                // If it's just the object (some outboxes return Note objects directly)
                if (activity.type === "Note") {
                    object = activity;
                }

                if (!object || object.type !== "Note") continue;

                const existing = await this.postRepository.findByUri(object.id);
                if (existing) continue;

                const emojis = this.extractEmojis(object.tag);

                await this.postRepository.create({
                    id: createId(),
                    content: object.content || "",
                    userId: null as any,
                    remoteActorId: remoteActorId,
                    uri: object.id,
                    url: object.url || object.id,
                    replyToId: null as any,
                    visibility: "public",
                    emojis: emojis as any,
                    isDeleted: false,
                    createdAt: new Date(object.published || activity.published || Date.now()),
                    updatedAt: new Date(),
                });
            }
        } catch (err) {
            console.error(`[GetProfile] Error in fetchRemoteOutbox:`, err);
        }
    }
}
