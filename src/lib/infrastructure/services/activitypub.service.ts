import { IActivityPubService } from "@/lib/application/services/activitypub.service.interface";
import { IUserRepository } from "@/lib/application/repositories/user.repository.interface";
import { IFollowerRepository } from "@/lib/application/repositories/follower.repository.interface";
import { IPostRepository } from "@/lib/application/repositories/post.repository.interface";
import { IRemoteActorRepository } from "@/lib/application/repositories/remote-actor.repository.interface";
import { ICustomEmojiRepository } from "@/lib/application/repositories/custom-emoji.repository.interface";
import { HttpSignatureService } from "./http-signature.service";
import { createId } from "@paralleldrive/cuid2";

export class ActivityPubService implements IActivityPubService {
    private pendingResolutions = new Map<string, Promise<any>>();

    constructor(
        private userRepository: IUserRepository,
        private followerRepository: IFollowerRepository,
        private postRepository: IPostRepository,
        private remoteActorRepository: IRemoteActorRepository,
        private customEmojiRepository: ICustomEmojiRepository
    ) { }


    private validateRemoteUrl(urlStr: string): boolean {
        try {
            const url = new URL(urlStr);
            if (url.protocol !== 'https:') return false;
            
            const hostname = url.hostname.toLowerCase();
            // SSRF Protection: Block localhost and common private IP ranges
            const isPrivate = 
                hostname === 'localhost' || 
                hostname === '127.0.0.1' || 
                hostname.startsWith('192.168.') || 
                hostname.startsWith('10.') || 
                hostname.startsWith('172.16.') || 
                hostname.startsWith('172.17.') ||
                hostname.startsWith('172.18.') ||
                hostname.startsWith('172.19.') ||
                hostname.startsWith('172.20.') ||
                hostname.startsWith('172.21.') ||
                hostname.startsWith('172.22.') ||
                hostname.startsWith('172.23.') ||
                hostname.startsWith('172.24.') ||
                hostname.startsWith('172.25.') ||
                hostname.startsWith('172.26.') ||
                hostname.startsWith('172.27.') ||
                hostname.startsWith('172.28.') ||
                hostname.startsWith('172.29.') ||
                hostname.startsWith('172.30.') ||
                hostname.startsWith('172.31.') ||
                hostname.endsWith('.local') ||
                hostname === '0.0.0.0';

            return !isPrivate;
        } catch {
            return false;
        }
    }

    async createAnnounceActivity(userId: string, post: any): Promise<any> {
        const user = await this.userRepository.findById(userId);
        if (!user) throw new Error("User not found");

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komunikasi.qzz.io";
        const actorUri = `${baseUrl}/api/users/${user.username}`;

        if (!post.repostOfId) throw new Error("Post is not a repost");

        const originalPost = await this.postRepository.findById(post.repostOfId);
        if (!originalPost || !originalPost.uri) throw new Error("Original post not found or has no URI");

        return {
            "@context": "https://www.w3.org/ns/activitystreams",
            "id": `${post.uri}/activity`,
            "type": "Announce",
            "actor": actorUri,
            "published": post.createdAt.toISOString(),
            "to": ["https://www.w3.org/ns/activitystreams#Public"],
            "cc": [`${actorUri}/followers`],
            "object": originalPost.uri
        };
    }

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

        // Detect custom emojis in content
        const emojiRegex = /:([a-zA-Z0-9_-]+):/g;
        const matches = post.content.match(emojiRegex);
        const tags: any[] = [];
        
        if (matches) {
            for (const shortcode of matches) {
                const customEmoji = await this.customEmojiRepository.findByShortcode(shortcode);
                if (customEmoji) {
                    tags.push({
                        type: "Emoji",
                        name: shortcode,
                        icon: {
                            type: "Image",
                            mediaType: customEmoji.url.endsWith(".gif") ? "image/gif" : "image/png",
                            url: customEmoji.url
                        }
                    });
                }
            }
        }

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
            "attachment": apAttachments,
            "tag": tags
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
        
        // 4. If it's an Announce (Repost), notify the original author
        if (activity.type === "Announce" && typeof activity.object === 'string') {
            try {
                const originalPost = await this.postRepository.findByUri(activity.object);
                if (originalPost && originalPost.remoteActorId) {
                    const actor = await this.remoteActorRepository.findById(originalPost.remoteActorId);
                    if (actor?.inbox) {
                        remoteInboxes.add(actor.inbox);
                    }
                }
            } catch (err) {
                console.error("Error resolving target inbox for announce delivery:", err);
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
        
        // Background backfill for new follow
        this.backfillActor(remoteActorUrl, localUserId).catch(e => console.error(`[FollowRemote] Backfill failed for ${remoteActorUrl}:`, e));
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

    async broadcastUndoAnnounceActivity(userId: string, targetPostUri: string): Promise<void> {
        const user = await this.userRepository.findById(userId);
        if (!user || !user.privateKey) return;

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komunikasi.qzz.io";
        const actorUri = `${baseUrl}/api/users/${user.username}`;

        const undoActivity = {
            "@context": "https://www.w3.org/ns/activitystreams",
            "id": `${actorUri}#undo-announce-${Date.now()}-${createId()}`,
            "type": "Undo",
            "actor": actorUri,
            "object": {
                "type": "Announce",
                "actor": actorUri,
                "object": targetPostUri
            }
        };

        const remoteInboxes = await this.followerRepository.getRemoteFollowersInboxes(userId);
        
        // Also include the original author's inbox if possible
        try {
            const originalPost = await this.postRepository.findByUri(targetPostUri);
            if (originalPost?.remoteActorId) {
                const actor = await this.remoteActorRepository.findById(originalPost.remoteActorId);
                if (actor?.inbox) {
                    remoteInboxes.push(actor.inbox);
                }
            }
        } catch (err) {
            console.error("[BroadcastUndoAnnounce] Failed to fetch original author inbox:", err);
        }

        const uniqueInboxes = [...new Set(remoteInboxes)];
        console.log(`Broadcasting Undo Announce to ${uniqueInboxes.length} inboxes...`);

        for (const inboxUrl of uniqueInboxes) {
            this.deliverToRemoteInbox(inboxUrl, undoActivity, {
                username: user.username,
                privateKey: user.privateKey
            }).catch(err => console.error(`Failed to deliver Undo Announce to ${inboxUrl}:`, err));
        }
    }

    async sendEmojiReactionActivity(userId: string, targetPostUri: string, targetActorInbox: string, emoji: string): Promise<void> {
        const user = await this.userRepository.findById(userId);
        if (!user || !user.privateKey) return;

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komunikasi.qzz.io";
        const actorUri = `${baseUrl}/api/users/${user.username}`;

        const tags: any[] = [];
        if (emoji.startsWith(":") && emoji.endsWith(":")) {
            const customEmoji = await this.customEmojiRepository.findByShortcode(emoji);
            if (customEmoji) {
                tags.push({
                    type: "Emoji",
                    name: emoji,
                    icon: {
                        type: "Image",
                        mediaType: customEmoji.url.endsWith(".gif") ? "image/gif" : "image/png",
                        url: customEmoji.url
                    }
                });
            }
        }

        const reactionActivity = {
            "@context": [
                "https://www.w3.org/ns/activitystreams",
                {
                    "EmojiReact": "https://purl.org/fep/e232/EmojiReact"
                }
            ],
            "id": `${actorUri}#reaction-${Date.now()}-${createId()}`,
            "type": "EmojiReact",
            "actor": actorUri,
            "content": emoji,
            "object": targetPostUri,
            "tag": tags.length > 0 ? tags : undefined
        };

        await this.deliverToRemoteInbox(targetActorInbox, reactionActivity, {
            username: user.username,
            privateKey: user.privateKey
        });
    }

    async sendUndoEmojiReactionActivity(userId: string, targetPostUri: string, targetActorInbox: string, emoji: string): Promise<void> {
        const user = await this.userRepository.findById(userId);
        if (!user || !user.privateKey) return;

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komunikasi.qzz.io";
        const actorUri = `${baseUrl}/api/users/${user.username}`;

        const undoActivity = {
            "@context": [
                "https://www.w3.org/ns/activitystreams",
                {
                    "EmojiReact": "https://purl.org/fep/e232/EmojiReact"
                }
            ],
            "id": `${actorUri}#undo-reaction-${Date.now()}-${createId()}`,
            "type": "Undo",
            "actor": actorUri,
            "object": {
                "type": "EmojiReact",
                "actor": actorUri,
                "content": emoji,
                "object": targetPostUri
            }
        };

        await this.deliverToRemoteInbox(targetActorInbox, undoActivity, {
            username: user.username,
            privateKey: user.privateKey
        });
    }

    async fetchRemoteObject(url: string): Promise<any> {
        if (!this.validateRemoteUrl(url)) return null;
        try {
            const response = await fetch(url, {
                headers: {
                    "Accept": "application/activity+json",
                    "User-Agent": "Mozilla/5.0 (compatible; Komunikasi/1.0; +https://komunikasi.qzz.io) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Mastodon/4.2.1"
                }
            });
            if (!response.ok) return null;

            const contentType = response.headers.get("content-type") || "";
            if (!contentType.includes("json") && !contentType.includes("activity")) {
                return null;
            }

            return await response.json();
        } catch (err) {
            console.error(`Error fetching remote object ${url}:`, err);
            return null;
        }
    }

    async fetchRemoteObjectSigned(url: string, userId: string): Promise<any> {
        if (!this.validateRemoteUrl(url)) return null;

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

            const contentType = response.headers.get("content-type") || "";
            if (!contentType.includes("json") && !contentType.includes("activity")) {
                return null;
            }

            return await response.json();
        } catch (err) {
            console.error(`Error fetching signed remote object ${url}:`, err);
            return null;
        }
    }

    async resolveRemotePost(uri: string, localUserId: string, forceRefresh = false, prefetchedObject?: any, depth = 0): Promise<any | null> {
        if (depth > 10) return null;
        if (!this.validateRemoteUrl(uri)) return null;

        // 1. Universal ID Extractor (Improved)
        const idRegex = /\/([a-z0-9_-]{10,})$/i;
        const match = uri.match(idRegex);
        
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
        const appDomain = appUrl ? new URL(appUrl).hostname : "";

        const isLikelyLocal = uri.includes("localhost") || 
                              (appDomain && uri.includes(appDomain)) ||
                              uri.includes("komunikasi.qzz.io") || 
                              uri.includes("komunikasi.verdi");

        if (match && isLikelyLocal) {
            const postId = match[1];
            const localPost = await this.postRepository.findById(postId);
            if (localPost) return localPost;
            const byUri = await this.postRepository.findByUri(uri);
            if (byUri) return byUri;
        }

        // 2. Robust Resolution & Hydration Strategy
        const existing = await this.postRepository.findByUri(uri);
        if (existing && isLikelyLocal && !forceRefresh) return existing;

        const isRemoteAndMissingMeta = existing && !existing.userId && (!existing.replyToId || !existing.quoteOfId);
        const needsHydration = (forceRefresh || (prefetchedObject && !isLikelyLocal) || isRemoteAndMissingMeta);

        if (!existing || needsHydration) {
            // Concurrency Lock: Check if a resolution for this URI is already in progress
            const existingPromise = this.pendingResolutions.get(uri);
            if (existingPromise && !prefetchedObject) {
                return await existingPromise;
            }

            const resolutionPromise = (async () => {
                try {
                    const fetched = prefetchedObject || await this.fetchRemoteObjectSigned(uri, localUserId);
                    if (!fetched || (fetched.type !== "Note" && fetched.type !== "Page" && fetched.type !== "Question")) {
                        return existing;
                    }

                    const actor = await this.ensureRemoteActor(fetched.attributedTo, localUserId);
                    if (!actor) return existing;

                    // Recursive Resolution: Parent Post (Reply)
                    let parentPostId: string | null = null;
                    if (fetched.inReplyTo) {
                        let parentUri: string | null = null;
                        if (typeof fetched.inReplyTo === 'string') {
                            parentUri = fetched.inReplyTo;
                        } else if (Array.isArray(fetched.inReplyTo)) {
                            const first = fetched.inReplyTo[0];
                            parentUri = typeof first === 'string' ? first : first?.id;
                        } else if (fetched.inReplyTo.id) {
                            parentUri = fetched.inReplyTo.id;
                        }

                        if (parentUri) {
                            const parent = await this.resolveRemotePost(parentUri, localUserId, false, null, depth + 1);
                            if (parent) parentPostId = parent.id;
                        }
                    }

                    // Recursive Resolution: Quoted Post
                    let quoteOfId: string | null = null;
                    let quoteUri = fetched.quoteUrl || fetched._misskey_quote;

                    if (!quoteUri && Array.isArray(fetched.tag)) {
                        const quoteTag = fetched.tag.find((t: any) => 
                            (t.type === 'Mention' || t.type === 'Link') && 
                            (t.mediaType === 'application/activity+json' || t.rel === 'quote')
                        );
                        if (quoteTag) quoteUri = quoteTag.href;
                    }

                    if (!quoteUri && fetched.quoteOf) {
                        quoteUri = typeof fetched.quoteOf === 'string' ? fetched.quoteOf : fetched.quoteOf.id;
                    }

                    if (quoteUri) {
                        const quoted = await this.resolveRemotePost(quoteUri, localUserId, false, null, depth + 1);
                        if (quoted) quoteOfId = quoted.id;
                    }

                    // Robust tag and attachment parsing
                    const tags = Array.isArray(fetched.tag) ? fetched.tag : (fetched.tag ? [fetched.tag] : []);
                    const apAttachments = Array.isArray(fetched.attachment) ? fetched.attachment : (fetched.attachment ? [fetched.attachment] : []);
                    const summary = fetched.summary || null; // Content Warning (CW)
                    
                    const emojis = this.extractEmojis(tags);
                    const attachments = apAttachments
                        .map((a: any) => {
                            let url = "";
                            if (typeof a.url === 'string') {
                                url = a.url;
                            } else if (Array.isArray(a.url)) {
                                // Find best link in array
                                const best = a.url.find((l: any) => l.mediaType?.startsWith('image/') || l.mediaType?.startsWith('video/')) || a.url[0];
                                url = typeof best === 'string' ? best : best?.href || best?.url;
                            } else if (a.url) {
                                url = a.url.href || a.url.url || a.url;
                            }

                            if (!url) return null;

                            return {
                                url: url,
                                key: a.name || createId(),
                                fileType: a.mediaType || "application/octet-stream",
                                size: a.size,
                                blurhash: a.blurhash || null,
                                description: a.name || a.summary || null
                            };
                        })
                        .filter((a: any): a is NonNullable<typeof a> => a !== null);

                    const finalContent = this.getCleanContent(fetched, !!quoteOfId || !!fetched.inReplyTo);
                    const context = fetched.context || fetched.conversation;

                    // --- NEW: Reaction Summary & Custom Emojis from Tags ---
                    // Handle various reaction formats (Misskey, Akkoma, Pleroma)
                    let rawReactions = fetched.reactions || fetched._misskey_reactions || null;
                    let reactionCount = fetched.reactionCount || fetched._misskey_reactionCount || 0;
                    
                    // Normalize reaction summary keys (ensure colons for shortcodes)
                    const reactionSummary: Record<string, number> = {};
                    if (rawReactions && typeof rawReactions === 'object') {
                        Object.entries(rawReactions).forEach(([key, val]) => {
                            // If key is a shortcode without colons, add them
                            const normalizedKey = (key.length > 1 && !key.startsWith(':') && !key.endsWith(':') && !/^\p{Emoji}/u.test(key))
                                ? `:${key}:`
                                : key;
                            reactionSummary[normalizedKey] = typeof val === 'number' ? val : 0;
                        });
                    }

                    const finalReactionSummary = Object.keys(reactionSummary).length > 0 ? reactionSummary : null;

                    // If summary exists but count is missing/0, calculate it
                    if (finalReactionSummary && !reactionCount) {
                        reactionCount = Object.values(finalReactionSummary).reduce((a, b) => a + b, 0);
                    }

                    // Register custom emojis found in tags
                    if (emojis) {
                        for (const emoji of emojis) {
                            if (emoji.name && emoji.url) {
                                await this.customEmojiRepository.upsert({
                                    shortcode: emoji.name.startsWith(':') ? emoji.name : `:${emoji.name}:`,
                                    url: emoji.url,
                                    category: "federated"
                                }).catch(() => {}); // Best effort
                            }
                        }
                    }

                    let savedPost: any;
                    if (existing) {
                        const hasNewMeta = (parentPostId && !existing.replyToId) || (quoteOfId && !existing.quoteOfId) || (context && !existing.context);
                        const contentChanged = finalContent !== existing.content;
                        const hasAttachments = attachments.length > 0;
                        
                        if (hasNewMeta || contentChanged || hasAttachments || forceRefresh || prefetchedObject) {
                            savedPost = await this.postRepository.update(existing.id, {
                                content: finalContent || existing.content,
                                replyToId: parentPostId || existing.replyToId,
                                quoteOfId: quoteOfId || existing.quoteOfId,
                                context: context || existing.context,
                                emojis: emojis as any || existing.emojis,
                                apMetadata: {
                                    originalTags: tags,
                                    isFepE232Quote: !!quoteUri && !fetched.quoteUrl && !fetched._misskey_quote,
                                    summary: summary || (existing.apMetadata as any)?.summary,
                                    reactionSummary: reactionSummary || (existing.apMetadata as any)?.reactionSummary,
                                    reactionCount: reactionCount || (existing.apMetadata as any)?.reactionCount
                                } as any,
                                updatedAt: new Date()
                            }, attachments);
                        } else {
                            savedPost = existing;
                        }
                    } else {
                        const newId = createId();
                        savedPost = await this.postRepository.create({
                            id: newId,
                            content: finalContent,
                            userId: null as any,
                            remoteActorId: actor.id,
                            uri: fetched.id,
                            url: fetched.url,
                            replyToId: parentPostId,
                            repostOfId: null,
                            quoteOfId: quoteOfId,
                            context: context,
                            visibility: "public",
                            emojis: emojis as any,
                            apMetadata: {
                                originalTags: tags,
                                summary: summary,
                                reactionSummary: reactionSummary,
                                reactionCount: reactionCount
                            } as any,
                            isDeleted: false,
                            createdAt: new Date(fetched.published || Date.now()),
                            updatedAt: new Date(),
                        }, attachments);
                    }

                    // Background: Discover Replies if it's a new or forced refresh post
                    if (!existing || forceRefresh) {
                        this.discoverReplies(uri, localUserId, fetched).catch(e => console.error(`[ResolveRemotePost] Reply discovery failed for ${uri}:`, e));
                    }

                    // Background: Pre-fetch media to warm up Proxy/CDN cache
                    if (attachments.length > 0) {
                        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komunikasi.qzz.io";
                        attachments.forEach((a: any) => {
                            const proxyUrl = `${baseUrl}/api/media-proxy?url=${encodeURIComponent(a.url)}`;
                            fetch(proxyUrl).catch(() => {}); // Fire and forget
                        });
                    }

                    return savedPost;
                } finally {
                    this.pendingResolutions.delete(uri);
                }
            })();

            if (!prefetchedObject) {
                this.pendingResolutions.set(uri, resolutionPromise);
            }

            return await resolutionPromise;
        }

        return existing;
    }

    async discoverReplies(uri: string, localUserId: string, prefetchedObject?: any): Promise<void> {
        try {
            const fetched = prefetchedObject || await this.fetchRemoteObjectSigned(uri, localUserId);
            if (!fetched || !fetched.replies) return;

            let repliesCollection: any = null;
            if (typeof fetched.replies === 'string') {
                repliesCollection = await this.fetchRemoteObjectSigned(fetched.replies, localUserId);
            } else if (fetched.replies.first) {
                // If it's an object with 'first' link
                const firstPageUrl = typeof fetched.replies.first === 'string' ? fetched.replies.first : fetched.replies.first.id;
                if (firstPageUrl) {
                    repliesCollection = await this.fetchRemoteObjectSigned(firstPageUrl, localUserId);
                }
            } else if (fetched.replies.items || fetched.replies.orderedItems) {
                // If items are inline
                repliesCollection = fetched.replies;
            }

            if (!repliesCollection) return;

            const items = repliesCollection.orderedItems || repliesCollection.items || [];
            console.log(`[DiscoverReplies] Found ${items.length} replies for ${uri}. Resolving first 20...`);

            // Resolve top 20 replies to keep it manageable
            for (const item of items.slice(0, 20)) {
                const replyUri = typeof item === 'string' ? item : item.id;
                if (replyUri && this.validateRemoteUrl(replyUri)) {
                    // We don't await here to keep it moving, but we do await resolutionPromise internally via Map
                    this.resolveRemotePost(replyUri, localUserId).catch(e => console.error(`[DiscoverReplies] Failed to resolve reply ${replyUri}:`, e));
                }
            }
        } catch (e) {
            console.error(`[DiscoverReplies] Error discovering replies for ${uri}:`, e);
        }
    }

    async backfillActor(actorUrl: string, localUserId: string): Promise<void> {
        try {
            const actor = await this.fetchRemoteObjectSigned(actorUrl, localUserId);
            if (!actor || !actor.outbox) return;

            console.log(`[Backfill] Starting backfill for actor ${actorUrl}...`);

            // 1. Fetch Outbox
            const outbox = await this.fetchRemoteObjectSigned(actor.outbox, localUserId);
            if (!outbox || !outbox.first) return;

            // 2. Fetch first page of outbox
            const firstPageUrl = typeof outbox.first === 'string' ? outbox.first : outbox.first.id;
            const page = await this.fetchRemoteObjectSigned(firstPageUrl, localUserId);
            
            if (!page || (!page.orderedItems && !page.items)) return;

            const items = page.orderedItems || page.items || [];
            console.log(`[Backfill] Pulling ${items.length} recent activities from outbox...`);

            // 3. Process items (usually Create or Announce activities)
            for (const activity of items.slice(0, 20)) {
                try {
                    const object = activity.object;
                    if (!object) continue;

                    if (activity.type === "Create" || activity.type === "Announce") {
                        const objectUri = typeof object === 'string' ? object : object.id;
                        if (objectUri) {
                            await this.resolveRemotePost(objectUri, localUserId, false, typeof object === 'object' ? object : undefined);
                        }
                    }
                } catch (err) {
                    console.error(`[Backfill] Failed to process activity in outbox:`, err);
                }
            }
            console.log(`[Backfill] Completed backfill for ${actorUrl}`);
        } catch (e) {
            console.error(`[Backfill] Error backfilling actor ${actorUrl}:`, e);
        }
    }

    private getCleanContent(object: any, isLinked: boolean = false): string {
        // 1. Priority: Misskey-specific clean field
        if (object._misskey_content) return object._misskey_content;

        // 2. Agnostic stripping of redundant reply/quote indicators
        let content = object.summary || object.content || "";

        // Standard Fediverse fallback patterns for Quotes/Replies
        // We use 'gs' for global and single-line (to treat entire content as one line for .)
        const wrappers = [
            /<span class="quote-inline">RE:.*?<\/span>/gis,
            /<p>RE:.*?<\/p>/gis,
            /<blockquote>RE:.*?<\/blockquote>/gis,
            /RE:\s*<a[^>]*>https?:\/\/\S+<\/a>/gis,
            /RE:\s*https?:\/\/\S+/gi,
            // Multiline "RE: " at the start or end of content
            /^\s*RE:\s*https?:\/\/\S+/gim,
            /^\s*RE:\s+/gim,
            // Even more aggressive for Misskey/Mastodon variations
            /<a[^>]*>RE: https?:\/\/\S+<\/a>/gis,
            /RE:\s*<a[^>]*>.*?<\/a>/gis
        ];
        
        wrappers.forEach(regex => {
            content = content.replace(regex, "");
        });

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
        if (!this.validateRemoteUrl(actorUrl)) return null;
        const existing = await this.remoteActorRepository.findById(actorUrl);
        
        if (existing) return existing;

        let senderActorData;
        if (localUserIdForSignedFetch) {
            senderActorData = await this.fetchRemoteObjectSigned(actorUrl, localUserIdForSignedFetch);
        } else {
            senderActorData = await this.fetchRemoteObject(actorUrl);
        }

        if (!senderActorData || !senderActorData.inbox) return null;

        const domain = new URL(actorUrl).hostname;
        const tags = Array.isArray(senderActorData.tag) ? senderActorData.tag : (senderActorData.tag ? [senderActorData.tag] : []);
        const emojis = this.extractEmojis(tags);

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

        const newActor = await this.remoteActorRepository.findById(actorUrl);
        
        // Trigger backfill for new discovery
        if (newActor && localUserIdForSignedFetch) {
            this.backfillActor(actorUrl, localUserIdForSignedFetch).catch(e => console.error(`[EnsureActor] Backfill failed for ${actorUrl}:`, e));
        }

        return newActor;
    }

    async sendDeleteActivity(userId: string, postUri: string): Promise<void> {
        const user = await this.userRepository.findById(userId);
        if (!user || !user.privateKey) return;

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komunikasi.qzz.io";
        const actorUri = `${baseUrl}/api/users/${user.username}`;

        const deleteActivity = {
            "@context": "https://www.w3.org/ns/activitystreams",
            "id": `${actorUri}#delete-${createId()}`,
            "type": "Delete",
            "actor": actorUri,
            "to": ["https://www.w3.org/ns/activitystreams#Public"],
            "object": postUri
        };

        // 1. Gather inboxes
        const remoteInboxes = new Set<string>();

        // Add followers
        const followerInboxes = await this.followerRepository.getRemoteFollowersInboxes(userId);
        followerInboxes.forEach(inbox => remoteInboxes.add(inbox));

        // 2. If it's a reply/repost/quote, find the target inbox to ensure synchronization
        try {
            const post = await this.postRepository.findByUri(postUri);
            if (post) {
                // Check replyTo
                if (post.replyToId) {
                    const parent = await this.postRepository.findById(post.replyToId);
                    if (parent?.remoteActorId) {
                        const actor = await this.remoteActorRepository.findById(parent.remoteActorId);
                        if (actor?.inbox) remoteInboxes.add(actor.inbox);
                    }
                }
                // Check repostOf
                if (post.repostOfId) {
                    const original = await this.postRepository.findById(post.repostOfId);
                    if (original?.remoteActorId) {
                        const actor = await this.remoteActorRepository.findById(original.remoteActorId);
                        if (actor?.inbox) remoteInboxes.add(actor.inbox);
                    }
                }
                // Check quoteOf
                if (post.quoteOfId) {
                    const quoted = await this.postRepository.findById(post.quoteOfId);
                    if (quoted?.remoteActorId) {
                        const actor = await this.remoteActorRepository.findById(quoted.remoteActorId);
                        if (actor?.inbox) remoteInboxes.add(actor.inbox);
                    }
                }
            }
        } catch (err) {
            console.error("[DeletePost] Failed to fetch related authors inboxes:", err);
        }

        console.log(`Broadcasting Delete activity to ${remoteInboxes.size} unique remote inboxes...`);

        for (const inboxUrl of remoteInboxes) {
            this.deliverToRemoteInbox(inboxUrl, deleteActivity, {
                username: user.username,
                privateKey: user.privateKey
            }).catch(err => console.error(`Failed to deliver delete to ${inboxUrl}:`, err));
        }
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
                headers: { ...headers, "Signature": signature },
                body: body
            });
            if (!response.ok) {
                console.error(`Failed to deliver to ${inboxUrl}: ${response.status} ${await response.text()}`);
            }
        } catch (err) {
            console.error(`Error delivering to ${inboxUrl}:`, err);
        }
    }
}
