import { IActivityPubService } from "@/lib/application/services/activitypub.service.interface";
import { IUserRepository } from "@/lib/application/repositories/user.repository.interface";
import { IFollowerRepository } from "@/lib/application/repositories/follower.repository.interface";
import { IPostRepository } from "@/lib/application/repositories/post.repository.interface";
import { IRemoteActorRepository } from "@/lib/application/repositories/remote-actor.repository.interface";
import { HttpSignatureService } from "./http-signature.service";
import { createId } from "@paralleldrive/cuid2";

export class ActivityPubService implements IActivityPubService {
    constructor(
        private userRepository: IUserRepository,
        private followerRepository: IFollowerRepository,
        private postRepository: IPostRepository,
        private remoteActorRepository: IRemoteActorRepository
    ) { }

    async createNoteActivity(userId: string, post: any, attachments?: any[]): Promise<any> {
        const user = await this.userRepository.findById(userId);
        if (!user) throw new Error("User not found");

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komunikasi.qzz.io";
        const actorUri = `${baseUrl}/api/users/${user.username}`;

        const apAttachments = attachments?.map((a) => ({
            type: "Document",
            mediaType: a.fileType,
            url: a.url,
            name: "Attachment"
        })) || [];

        // Handle inReplyTo
        let inReplyTo: string | null = null;
        let cc: string[] = [`${actorUri}/followers`];

        if (post.replyToId) {
            const parentPost = await this.postRepository.findById(post.replyToId);
            if (parentPost && parentPost.uri) {
                inReplyTo = parentPost.uri;
                
                // Add parent author to cc if they are remote
                if (parentPost.remoteActorId) {
                    cc.push(parentPost.remoteActorId);
                } else if (parentPost.userId) {
                    const parentUser = await this.userRepository.findById(parentPost.userId);
                    if (parentUser) {
                        cc.push(`${baseUrl}/api/users/${parentUser.username}`);
                    }
                }
            }
        }

        // Handle Quote
        let quoteUrl: string | null = null;
        if (post.quoteOfId) {
            const quotedPost = await this.postRepository.findById(post.quoteOfId);
            if (quotedPost && quotedPost.uri) {
                quoteUrl = quotedPost.uri;
                
                // Add quoted author to cc
                if (quotedPost.remoteActorId) {
                    cc.push(quotedPost.remoteActorId);
                } else if (quotedPost.userId) {
                    const quotedUser = await this.userRepository.findById(quotedPost.userId);
                    if (quotedUser) {
                        cc.push(`${baseUrl}/api/users/${quotedUser.username}`);
                    }
                }
            }
        }

        const uniqueCc = Array.from(new Set(cc));

        const note: any = {
            "id": post.uri,
            "type": "Note",
            "published": post.createdAt.toISOString(),
            "attributedTo": actorUri,
            "inReplyTo": inReplyTo,
            "content": post.content,
            "url": post.url,
            "to": ["https://www.w3.org/ns/activitystreams#Public"],
            "cc": uniqueCc,
            "attachment": apAttachments
        };

        if (quoteUrl) {
            note.quoteUrl = quoteUrl;
            note._misskey_quote = quoteUrl;
        }

        return {
            "@context": "https://www.w3.org/ns/activitystreams",
            "id": `${post.uri}/activity`,
            "type": "Create",
            "actor": actorUri,
            "published": post.createdAt.toISOString(),
            "to": ["https://www.w3.org/ns/activitystreams#Public"],
            "cc": uniqueCc,
            "object": note
        };
    }

    async broadcastActivity(activity: any, actorId: string): Promise<void> {
        const user = await this.userRepository.findById(actorId);
        if (!user || !user.privateKey) {
            console.error(`Cannot broadcast: User ${actorId} not found or has no private key`);
            return;
        }

        const remoteInboxes = new Set<string>();

        // 1. Add follower inboxes
        const followerInboxes = await this.followerRepository.getRemoteFollowersInboxes(actorId);
        followerInboxes.forEach(inbox => remoteInboxes.add(inbox));

        // 2. If it's a reply, find the target inbox
        const object = activity.object;
        if (object && object.inReplyTo) {
            try {
                const parentPost = await this.postRepository.findByUri(object.inReplyTo);
                if (parentPost) {
                    if (parentPost.remoteActorId) {
                        const actor = await this.remoteActorRepository.findById(parentPost.remoteActorId);
                        if (actor?.inbox) {
                            remoteInboxes.add(actor.inbox);
                        }
                    }
                }
            } catch (err) {
                console.error("Error resolving target inbox for reply delivery:", err);
            }
        }

        // 3. If it's a quote, find the target inbox
        if (object && (object.quoteUrl || object._misskey_quote)) {
            try {
                const quoteUri = object.quoteUrl || object._misskey_quote;
                const quotedPost = await this.postRepository.findByUri(quoteUri);
                if (quotedPost && quotedPost.remoteActorId) {
                    const actor = await this.remoteActorRepository.findById(quotedPost.remoteActorId);
                    if (actor?.inbox) {
                        remoteInboxes.add(actor.inbox);
                    }
                }
            } catch (err) {
                console.error("Error resolving target inbox for quote delivery:", err);
            }
        }
        
        console.log(`Delivering activity to ${remoteInboxes.size} unique remote inboxes...`);

        for (const inboxUrl of Array.from(remoteInboxes)) {
            this.deliverToRemoteInbox(inboxUrl, activity, {
                username: user.username,
                privateKey: user.privateKey
            }).catch(err => console.error(`Failed to deliver to ${inboxUrl}:`, err));
        }
    }

    async sendAcceptActivity(localUserId: string, followActivity: any, inboxUrl?: string): Promise<void> {
        const user = await this.userRepository.findById(localUserId);
        if (!user || !user.privateKey) return;

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komunikasi.qzz.io";
        const actorUri = `${baseUrl}/api/users/${user.username}`;

        const acceptActivity = {
            "@context": "https://www.w3.org/ns/activitystreams",
            "id": `${actorUri}#accept-${Date.now()}`,
            "type": "Accept",
            "actor": actorUri,
            "object": followActivity
        };

        let targetInbox = inboxUrl;
        if (!targetInbox) {
            try {
                const senderActor = await fetch(followActivity.actor, {
                    headers: { 
                        "Accept": "application/activity+json",
                        "User-Agent": "Mozilla/5.0 (compatible; Komunikasi/1.0; +https://komunikasi.qzz.io) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Mastodon/4.2.1"
                    }
                }).then(res => res.json());
                targetInbox = senderActor.inbox;
            } catch (err) {
                console.error("Failed to fetch sender actor for Accept activity:", err);
                return;
            }
        }

        if (targetInbox) {
            await this.deliverToRemoteInbox(targetInbox, acceptActivity, {
                username: user.username,
                privateKey: user.privateKey
            });
        }
    }

    async followRemote(localUserId: string, remoteActorUrl: string): Promise<void> {
        const user = await this.userRepository.findById(localUserId);
        if (!user || !user.privateKey) throw new Error("Local user not found or has no private key");

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komunikasi.qzz.io";
        const actorUri = `${baseUrl}/api/users/${user.username}`;

        const followActivity = {
            "@context": "https://www.w3.org/ns/activitystreams",
            "id": `${actorUri}#follow-${Date.now()}`,
            "type": "Follow",
            "actor": actorUri,
            "object": remoteActorUrl
        };

        const remoteActor = await fetch(remoteActorUrl, {
            headers: { 
                "Accept": "application/activity+json",
                "User-Agent": "Mozilla/5.0 (compatible; Komunikasi/1.0; +https://komunikasi.qzz.io) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Mastodon/4.2.1"
            }
        }).then(res => res.json());

        if (!remoteActor.inbox) throw new Error("Remote actor has no inbox");

        await this.deliverToRemoteInbox(remoteActor.inbox, followActivity, {
            username: user.username,
            privateKey: user.privateKey
        });
        
        await this.followerRepository.followLocalToRemote(localUserId, remoteActorUrl);
    }

    async unfollowRemote(localUserId: string, remoteActorUrl: string): Promise<void> {
        const user = await this.userRepository.findById(localUserId);
        if (!user || !user.privateKey) throw new Error("Local user not found or has no private key");

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komunikasi.qzz.io";
        const actorUri = `${baseUrl}/api/users/${user.username}`;

        const undoActivity = {
            "@context": "https://www.w3.org/ns/activitystreams",
            "id": `${actorUri}#undo-${Date.now()}`,
            "type": "Undo",
            "actor": actorUri,
            "object": {
                "type": "Follow",
                "actor": actorUri,
                "object": remoteActorUrl
            }
        };

        const remoteActor = await fetch(remoteActorUrl, {
            headers: { 
                "Accept": "application/activity+json",
                "User-Agent": "Mozilla/5.0 (compatible; Komunikasi/1.0; +https://komunikasi.qzz.io) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Mastodon/4.2.1"
            }
        }).then(res => res.json());

        if (!remoteActor.inbox) throw new Error("Remote actor has no inbox");

        await this.deliverToRemoteInbox(remoteActor.inbox, undoActivity, {
            username: user.username,
            privateKey: user.privateKey
        });

        await this.followerRepository.unfollowLocalToRemote(localUserId, remoteActorUrl);
    }

    async sendLikeActivity(userId: string, targetPostUri: string, targetActorInbox: string): Promise<void> {
        const user = await this.userRepository.findById(userId);
        if (!user || !user.privateKey) return;

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komunikasi.qzz.io";
        const actorUri = `${baseUrl}/api/users/${user.username}`;

        const likeActivity = {
            "@context": "https://www.w3.org/ns/activitystreams",
            "id": `${actorUri}#like-${Date.now()}`,
            "type": "Like",
            "actor": actorUri,
            "object": targetPostUri
        };

        await this.deliverToRemoteInbox(targetActorInbox, likeActivity, {
            username: user.username,
            privateKey: user.privateKey
        });
    }

    async sendUndoLikeActivity(userId: string, targetPostUri: string, targetActorInbox: string): Promise<void> {
        const user = await this.userRepository.findById(userId);
        if (!user || !user.privateKey) return;

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komunikasi.qzz.io";
        const actorUri = `${baseUrl}/api/users/${user.username}`;

        const undoActivity = {
            "@context": "https://www.w3.org/ns/activitystreams",
            "id": `${actorUri}#undo-like-${Date.now()}`,
            "type": "Undo",
            "actor": actorUri,
            "object": {
                "type": "Like",
                "actor": actorUri,
                "object": targetPostUri
            }
        };

        await this.deliverToRemoteInbox(targetActorInbox, undoActivity, {
            username: user.username,
            privateKey: user.privateKey
        });
    }

    async sendAnnounceActivity(userId: string, targetPostUri: string, targetActorInbox: string): Promise<void> {
        const user = await this.userRepository.findById(userId);
        if (!user || !user.privateKey) return;

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komunikasi.qzz.io";
        const actorUri = `${baseUrl}/api/users/${user.username}`;

        const announceActivity = {
            "@context": "https://www.w3.org/ns/activitystreams",
            "id": `${actorUri}#announce-${Date.now()}`,
            "type": "Announce",
            "actor": actorUri,
            "published": new Date().toISOString(),
            "to": ["https://www.w3.org/ns/activitystreams#Public"],
            "cc": [`${actorUri}/followers`],
            "object": targetPostUri
        };

        await this.deliverToRemoteInbox(targetActorInbox, announceActivity, {
            username: user.username,
            privateKey: user.privateKey
        });
    }

    async sendUndoAnnounceActivity(userId: string, targetPostUri: string, targetActorInbox: string): Promise<void> {
        const user = await this.userRepository.findById(userId);
        if (!user || !user.privateKey) return;

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komunikasi.qzz.io";
        const actorUri = `${baseUrl}/api/users/${user.username}`;

        const undoActivity = {
            "@context": "https://www.w3.org/ns/activitystreams",
            "id": `${actorUri}#undo-announce-${Date.now()}`,
            "type": "Undo",
            "actor": actorUri,
            "object": {
                "type": "Announce",
                "actor": actorUri,
                "object": targetPostUri
            }
        };

        await this.deliverToRemoteInbox(targetActorInbox, undoActivity, {
            username: user.username,
            privateKey: user.privateKey
        });
    }

    async fetchRemoteObject(url: string): Promise<any> {
        try {
            const response = await fetch(url, {
                headers: {
                    "Accept": "application/activity+json",
                    "User-Agent": "Mozilla/5.0 (compatible; Komunikasi/1.0; +https://komunikasi.qzz.io) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Mastodon/4.2.1"
                }
            });
            if (!response.ok) return null;
            return await response.json();
        } catch (err) {
            console.error(`Error fetching remote object ${url}:`, err);
            return null;
        }
    }

    async fetchRemoteObjectSigned(url: string, userId: string): Promise<any> {
        const user = await this.userRepository.findById(userId);
        if (!user || !user.privateKey) return this.fetchRemoteObject(url);

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komunikasi.qzz.io";
        const targetUrl = new URL(url);
        const date = new Date().toUTCString();
        const targetPath = targetUrl.pathname + targetUrl.search;

        const headers: Record<string, string> = {
            "Host": targetUrl.host,
            "Date": date,
            "Accept": "application/activity+json",
            "User-Agent": "Mozilla/5.0 (compatible; Komunikasi/1.0; +https://komunikasi.qzz.io) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Mastodon/4.2.1"
        };

        const signature = HttpSignatureService.sign({
            keyId: `${baseUrl}/api/users/${user.username}#main-key`,
            privateKey: user.privateKey,
            method: "GET",
            target: targetPath,
            headers: headers
        });

        try {
            const response = await fetch(url, {
                headers: {
                    ...headers,
                    "Signature": signature
                }
            });
            if (!response.ok) return null;
            return await response.json();
        } catch (err) {
            console.error(`Error fetching signed remote object ${url}:`, err);
            return null;
        }
    }

    async resolveRemotePost(uri: string, localUserId: string, forceRefresh = false): Promise<any | null> {
        // 1. Universal ID Extractor (Improved)
        const idRegex = /\/([a-z0-9_-]{20,})$/i;
        const match = uri.match(idRegex);
        
        const isLikelyLocal = uri.includes("localhost") || 
                              uri.includes("komunikasi.qzz.io") || 
                              uri.includes("komunikasi.verdi");

        if (match && isLikelyLocal) {
            const postId = match[1];
            console.log("[ActivityPubService] Self-resolving local ID: " + postId);
            
            const localPost = await this.postRepository.findById(postId);
            if (localPost) return localPost;
            
            const byUri = await this.postRepository.findByUri(uri);
            if (byUri) return byUri;
        }

        // 2. Robust Resolution & Hydration Strategy
        const existing = await this.postRepository.findByUri(uri);
        
        // If it's local and not forced, return immediately
        if (existing && isLikelyLocal && !forceRefresh) return existing;

        // Dereference if missing or if remote post lacks crucial quote metadata (Hydration)
        const needsHydration = existing && !existing.quoteOfId && !existing.repostOfId && !isLikelyLocal;

        if (!existing || needsHydration || forceRefresh) {
            console.log(`[ActivityPubService] Resolving/Hydrating remote post: ${uri}`);
            const fetched = await this.fetchRemoteObjectSigned(uri, localUserId);
            if (!fetched || (fetched.type !== "Note" && fetched.type !== "Page")) return existing;

            const actor = await this.ensureRemoteActor(fetched.attributedTo, localUserId);
            if (!actor) return existing;

            // Recursive Resolution: Parent Post (Reply)
            let parentPostId: string | null = null;
            if (fetched.inReplyTo) {
                const parent = await this.resolveRemotePost(fetched.inReplyTo, localUserId);
                if (parent) parentPostId = parent.id;
            }

            // Recursive Resolution: Quoted Post
            let quoteOfId: string | null = null;
            const quoteUri = fetched.quoteUrl || fetched._misskey_quote;
            if (quoteUri) {
                console.log("[ActivityPubService] Detected quote metadata for: " + quoteUri);
                const quoted = await this.resolveRemotePost(quoteUri, localUserId);
                if (quoted) quoteOfId = quoted.id;
            }

            const emojis = this.extractEmojis(fetched.tag);
            // Context-aware cleaning: Only strip RE: if we successfully resolved a quote
            const finalContent = this.getCleanContent(fetched, !!quoteOfId);
            
            if (existing) {
                console.log(`[ActivityPubService] Patching existing post with new metadata: ${existing.id}`);
                return await this.postRepository.update(existing.id, {
                    content: finalContent,
                    replyToId: parentPostId || existing.replyToId,
                    quoteOfId: quoteOfId || existing.quoteOfId,
                    emojis: emojis as any,
                    updatedAt: new Date()
                });
            } else {
                const newId = createId();
                console.log("[ActivityPubService] Saving new remote post with quoteOfId: " + quoteOfId);
                return await this.postRepository.create({
                    id: newId,
                    content: finalContent,
                    userId: null as any,
                    remoteActorId: actor.id,
                    uri: fetched.id,
                    url: fetched.url,
                    replyToId: parentPostId,
                    repostOfId: null,
                    quoteOfId: quoteOfId,
                    visibility: "public",
                    emojis: emojis as any,
                    isDeleted: false,
                    createdAt: new Date(fetched.published || Date.now()),
                    updatedAt: new Date(),
                });
            }
        }

        return existing;
    }

    private getCleanContent(object: any, hasQuote: boolean = false): string {
        // 1. Priority: Misskey-specific clean field
        if (object._misskey_content) return object._misskey_content;

        // 2. Agnostic stripping of redundant reply/quote indicators
        let content = object.summary || object.content || "";

        // Only strip RE: markers if we actually have the quote metadata resolved
        // This prevents data loss if we can't find the quoted post
        if (hasQuote) {
            const wrappers = [
                /<span class="quote-inline">RE:.*?<\/span>/gi,
                /<p>RE:.*?<\/p>/gi,
                /<blockquote>RE:.*?<\/blockquote>/gi,
                /RE:\s*https?:\/\/\S+/gi
            ];
            
            wrappers.forEach(regex => {
                content = content.replace(regex, "");
            });
        }

        // Clean up remaining dangling breaks or whitespace
        content = content.replace(/^(?:<br\s*\/?>\s*)+|(?:<br\s*\/?>\s*)+$/gi, "").trim();

        return content;
    }

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

    private async ensureRemoteActor(actorUrl: string, localUserIdForSignedFetch?: string) {
        const existing = await this.remoteActorRepository.findById(actorUrl);
        if (existing) return existing;

        let senderActorData;
        if (localUserIdForSignedFetch) {
            senderActorData = await this.fetchRemoteObjectSigned(actorUrl, localUserIdForSignedFetch);
        } else {
            senderActorData = await this.fetchRemoteObject(actorUrl);
        }

        if (!senderActorData || !senderActorData.inbox) {
            return null;
        }

        const domain = new URL(actorUrl).hostname;
        const emojis = this.extractEmojis(senderActorData.tag);

        await this.remoteActorRepository.upsert({
            id: actorUrl,
            username: senderActorData.preferredUsername || senderActorData.name || "unknown",
            domain: domain,
            name: senderActorData.name,
            bio: senderActorData.summary,
            avatar: senderActorData.icon?.url,
            banner: senderActorData.image?.url,
            inbox: senderActorData.inbox,
            sharedInbox: senderActorData.endpoints?.sharedInbox,
            publicKey: senderActorData.publicKey?.publicKeyPem,
            followerCount: senderActorData.followersCount || 0,
            followingCount: senderActorData.followingCount || 0,
            published: senderActorData.published ? new Date(senderActorData.published) : null,
            emojis: emojis as any,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return await this.remoteActorRepository.findById(actorUrl);
    }

    private async deliverToRemoteInbox(inboxUrl: string, activity: any, user: { username: string, privateKey: string }) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komunikasi.qzz.io";
        const body = JSON.stringify(activity);
        const url = new URL(inboxUrl);
        const digest = HttpSignatureService.createDigest(body);
        const date = new Date().toUTCString();

        const target = url.pathname + url.search;

        const headers: Record<string, string> = {
            "Host": url.host,
            "Date": date,
            "Digest": digest,
            "Content-Type": "application/activity+json",
            "Accept": "application/activity+json",
            "User-Agent": "Mozilla/5.0 (compatible; Komunikasi/1.0; +https://komunikasi.qzz.io) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Mastodon/4.2.1"
        };

        const signature = HttpSignatureService.sign({
            keyId: `${baseUrl}/api/users/${user.username}#main-key`,
            privateKey: user.privateKey,
            method: "POST",
            target: target,
            headers: headers
        });

        try {
            const response = await fetch(inboxUrl, {
                method: "POST",
                headers: {
                    ...headers,
                    "Signature": signature,
                },
                body: body
            });

            if (!response.ok) {
                console.error(`Failed to deliver to ${inboxUrl}: ${response.status} ${await response.text()}`);
            } else {
                console.log(`Successfully delivered to ${inboxUrl}`);
            }
        } catch (err) {
            console.error(`Error delivering to ${inboxUrl}:`, err);
        }
    }
}
