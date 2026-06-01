import { IActivityPubService } from "@/lib/application/services/activitypub.service.interface";
import { IUserRepository } from "@/lib/application/repositories/user.repository.interface";
import { IFollowerRepository } from "@/lib/application/repositories/follower.repository.interface";
import { IPostRepository } from "@/lib/application/repositories/post.repository.interface";
import { IRemoteActorRepository } from "@/lib/application/repositories/remote-actor.repository.interface";
import { HttpSignatureService } from "./http-signature.service";
import { createId } from "@paralleldrive/cuid2";

export class ActivityPubService implements IActivityPubService {
    private pendingResolutions = new Set<string>();

    constructor(
        private userRepository: IUserRepository,
        private followerRepository: IFollowerRepository,
        private postRepository: IPostRepository,
        private remoteActorRepository: IRemoteActorRepository
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
            if (this.pendingResolutions.has(uri) && !prefetchedObject) {
                return await this.postRepository.findByUri(uri);
            }

            try {
                if (!prefetchedObject) this.pendingResolutions.add(uri);

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
                    .filter((a: any) => a.url)
                    .map((a: any) => ({
                        url: typeof a.url === 'string' ? a.url : a.url.href,
                        key: a.name || createId(),
                        fileType: a.mediaType || "application/octet-stream",
                        size: a.size,
                        description: a.name || a.summary || null // Map remote name/summary to description
                    }));

                const finalContent = this.getCleanContent(fetched, !!quoteOfId || !!fetched.inReplyTo);
                const context = fetched.context || fetched.conversation;

                if (existing) {
                    const hasNewMeta = (parentPostId && !existing.replyToId) || (quoteOfId && !existing.quoteOfId) || (context && !existing.context);
                    const contentChanged = finalContent !== existing.content;
                    
                    if (hasNewMeta || contentChanged || forceRefresh || prefetchedObject) {
                        return await this.postRepository.update(existing.id, {
                            content: finalContent || existing.content,
                            replyToId: parentPostId || existing.replyToId,
                            quoteOfId: quoteOfId || existing.quoteOfId,
                            context: context || existing.context,
                            emojis: emojis as any || existing.emojis,
                            apMetadata: {
                                originalTags: tags,
                                isFepE232Quote: !!quoteUri && !fetched.quoteUrl && !fetched._misskey_quote,
                                summary: summary || (existing.apMetadata as any)?.summary
                            } as any,
                            updatedAt: new Date()
                        });
                    }
                    return existing;
                } else {
                    const newId = createId();
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
                        context: context,
                        visibility: "public",
                        emojis: emojis as any,
                        apMetadata: {
                            originalTags: tags,
                            summary: summary
                        } as any,
                        isDeleted: false,
                        createdAt: new Date(fetched.published || Date.now()),
                        updatedAt: new Date(),
                    }, attachments);
                }
            } finally {
                this.pendingResolutions.delete(uri);
            }
        }

        return existing;
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

        return await this.remoteActorRepository.findById(actorUrl);
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

        // Broadcast to followers
        const remoteInboxes = await this.followerRepository.getRemoteFollowersInboxes(userId);
        
        console.log(`Broadcasting Delete activity to ${remoteInboxes.length} remote inboxes...`);

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
