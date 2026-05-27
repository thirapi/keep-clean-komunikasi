import { IActivityPubService } from "@/lib/application/services/activitypub.service.interface";
import { IUserRepository } from "@/lib/application/repositories/user.repository.interface";
import { IFollowerRepository } from "@/lib/application/repositories/follower.repository.interface";
import { HttpSignatureService } from "./http-signature.service";

export class ActivityPubService implements IActivityPubService {
    constructor(
        private userRepository: IUserRepository,
        private followerRepository: IFollowerRepository
    ) { }

    async createNoteActivity(userId: string, post: any): Promise<any> {
        const user = await this.userRepository.findById(userId);
        if (!user) throw new Error("User not found");

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komunikasi.qzz.io";
        const actorUri = `${baseUrl}/api/users/${user.username}`;

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
            }
        };
    }

    async broadcastActivity(activity: any, actorId: string): Promise<void> {
        const user = await this.userRepository.findById(actorId);
        if (!user || !user.privateKey) {
            console.error(`Cannot broadcast: User ${actorId} not found or has no private key`);
            return;
        }

        // 1. Get local followers
        const localFollowers = await this.followerRepository.getFollowers(actorId);
        
        // 2. Get remote followers' inboxes
        const remoteInboxes = await this.followerRepository.getRemoteFollowersInboxes(actorId);
        
        console.log(`Broadcasting activity to ${localFollowers.length} local followers and ${remoteInboxes.length} remote inboxes...`);

        // 3. Deliver to remote inboxes
        for (const inboxUrl of remoteInboxes) {
            // We should ideally run this in background or via a queue
            this.deliverToRemoteInbox(inboxUrl, activity, {
                username: user.username,
                privateKey: user.privateKey
            }).catch(err => console.error(`Failed to deliver broadcast to ${inboxUrl}:`, err));
        }

        // 4. Local delivery (if we had a local inbox logic for notifications/feed)
        // For local followers, Pusher is already handling real-time updates in CreatePostUseCase.
    }

    async sendAcceptActivity(localUserId: string, followActivity: any): Promise<void> {
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

        // We need to fetch the sender's actor object to get their inbox
        const senderActor = await fetch(followActivity.actor, {
            headers: { "Accept": "application/activity+json" }
        }).then(res => res.json());

        const inboxUrl = senderActor.inbox;
        if (inboxUrl) {
            await this.deliverToRemoteInbox(inboxUrl, acceptActivity, {
                username: user.username,
                privateKey: user.privateKey
            });
        }
    }

    /**
     * Internal method to send signed request to a remote inbox
     */
    private async deliverToRemoteInbox(inboxUrl: string, activity: any, user: { username: string, privateKey: string }) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komunikasi.qzz.io";
        const body = JSON.stringify(activity);
        const url = new URL(inboxUrl);
        const digest = HttpSignatureService.createDigest(body);
        const date = new Date().toUTCString();

        const headers: Record<string, string> = {
            "Host": url.host,
            "Date": date,
            "Digest": digest,
            "Content-Type": "application/activity+json",
            "Accept": "application/activity+json",
        };

        const signature = HttpSignatureService.sign({
            keyId: `${baseUrl}/api/users/${user.username}#main-key`,
            privateKey: user.privateKey,
            method: "POST",
            target: url.pathname,
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
            }
        } catch (err) {
            console.error(`Error delivering to ${inboxUrl}:`, err);
        }
    }
}

