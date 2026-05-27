import { IActivityPubService } from "@/lib/application/services/activitypub.service.interface";
import { IUserRepository } from "@/lib/application/repositories/user.repository.interface";
import { IFollowerRepository } from "@/lib/application/repositories/follower.repository.interface";
import { HttpSignatureService } from "./http-signature.service";

export class ActivityPubService implements IActivityPubService {
    constructor(
        private userRepository: IUserRepository,
        private followerRepository: IFollowerRepository
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

        return {
            "@context": "https://www.w3.org/ns/activitystreams",
            "id": `${post.uri}/activity`,
            "type": "Create",
            "actor": actorUri,
            "published": post.createdAt.toISOString(),
            "to": ["https://www.w3.org/ns/activitystreams#Public"],
            "cc": [`${actorUri}/followers`],
            "object": {
                "id": post.uri,
                "type": "Note",
                "published": post.createdAt.toISOString(),
                "attributedTo": actorUri,
                "content": post.content,
                "url": post.url,
                "to": ["https://www.w3.org/ns/activitystreams#Public"],
                "cc": [`${actorUri}/followers`],
                "attachment": apAttachments
            }
        };
    }

    async broadcastActivity(activity: any, actorId: string): Promise<void> {
        const user = await this.userRepository.findById(actorId);
        if (!user || !user.privateKey) {
            console.error(`Cannot broadcast: User ${actorId} not found or has no private key`);
            return;
        }

        const remoteInboxes = await this.followerRepository.getRemoteFollowersInboxes(actorId);
        
        console.log(`Broadcasting activity to ${remoteInboxes.length} remote inboxes...`);

        for (const inboxUrl of remoteInboxes) {
            this.deliverToRemoteInbox(inboxUrl, activity, {
                username: user.username,
                privateKey: user.privateKey
            }).catch(err => console.error(`Failed to deliver broadcast to ${inboxUrl}:`, err));
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
                        "User-Agent": "Mozilla/5.0 (compatible; Komunikasi/1.0; +https://komunikasi.qzz.io)"
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
                "User-Agent": "Mozilla/5.0 (compatible; Komunikasi/1.0; +https://komunikasi.qzz.io)"
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
                "User-Agent": "Mozilla/5.0 (compatible; Komunikasi/1.0; +https://komunikasi.qzz.io)"
            }
        }).then(res => res.json());

        if (!remoteActor.inbox) throw new Error("Remote actor has no inbox");

        await this.deliverToRemoteInbox(remoteActor.inbox, undoActivity, {
            username: user.username,
            privateKey: user.privateKey
        });

        await this.followerRepository.unfollowLocalToRemote(localUserId, remoteActorUrl);
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
            "User-Agent": "Mozilla/5.0 (compatible; Komunikasi/1.0; +https://komunikasi.qzz.io)"
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
