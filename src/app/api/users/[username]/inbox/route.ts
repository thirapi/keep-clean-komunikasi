import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { UserRepository } from "@/lib/infrastructure/repositories/user.repository";
import { RemoteActorRepository } from "@/lib/infrastructure/repositories/remote-actor.repository";
import { FollowerRepository } from "@/lib/infrastructure/repositories/follower.repository";
import { PostRepository } from "@/lib/infrastructure/repositories/post.repository";
import { NotificationRepository } from "@/lib/infrastructure/repositories/notification.repository";
import { PusherService } from "@/lib/infrastructure/services/pusher.service";
import { SignatureVerificationService } from "@/lib/infrastructure/services/signature-verification.service";
import { ActivityPubService } from "@/lib/infrastructure/services/activitypub.service";
import { createId } from "@paralleldrive/cuid2";

const userRepository = new UserRepository(db);
const remoteActorRepository = new RemoteActorRepository(db as any);
const followerRepository = new FollowerRepository(db);
const postRepository = new PostRepository(db);
const notificationRepository = new NotificationRepository(db);
const pusherService = new PusherService();
const activityPubService = new ActivityPubService(userRepository, followerRepository, postRepository, remoteActorRepository);

/**
 * User Inbox endpoint (ActivityPub)
 * Receiver for activities from other instances
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ username: string }> }
) {
    const { username } = await params;
    
    // 1. Check if user exists locally
    const user = await userRepository.findByUsername(username);
    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Extract headers for signature verification
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
        headers[key] = value;
    });

    const signatureHeader = headers["signature"];
    if (!signatureHeader) {
        return NextResponse.json({ error: "Missing Signature header" }, { status: 401 });
    }

    // 3. Parse keyId from signature to fetch the sender's public key
    const keyIdMatch = signatureHeader.match(/keyId="([^"]+)"/);
    if (!keyIdMatch) {
        return NextResponse.json({ error: "Invalid Signature header format" }, { status: 401 });
    }
    const keyId = keyIdMatch[1];

    // 4. Verify the signature
    let publicKey = await SignatureVerificationService.fetchRemotePublicKey(keyId);
    
    const actorIdFromKeyId = keyId.split("#")[0];

    if (!publicKey) {
        // Try to find it in our local database as a fallback
        const cachedActor = await remoteActorRepository.findById(actorIdFromKeyId);
        if (cachedActor?.publicKey) {
            console.log("[Inbox] Using cached public key for " + actorIdFromKeyId);
            publicKey = cachedActor.publicKey;
        }
    }

    const body = await request.json();

    if (!publicKey) {
        // Special case: If it's a Delete activity and we can't get the key, 
        // it might be because the user is already gone. 
        if (body.type === "Delete") {
            console.log("[Inbox] Received Delete for " + body.actor + " but could not verify signature (Actor gone). Acknowledging.");
            return NextResponse.json({ status: "acknowledged_unverified_delete" }, { status: 202 });
        }

        console.warn("[Inbox] Could not fetch sender public key for " + keyId + " (returned 401)");
        return NextResponse.json({ error: "Could not fetch sender public key" }, { status: 401 });
    }

    const url = new URL(request.url);
    const isValid = await SignatureVerificationService.verify(
        request.method,
        url.pathname,
        headers,
        publicKey
    );

    if (!isValid) {
        console.warn("[Inbox] Invalid signature for " + username + " from " + keyId);
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    console.log("[Inbox] Verified activity received for " + username + ":", body.type);

    // Basic Activity Handling
    switch (body.type) {
        case "Follow":
            return handleFollow(user.id, username, body);
        case "Undo":
            return handleUndo(user.id, username, body);
        case "Create":
            return handleCreate(user.id, username, body);
        case "Like":
            return handleLike(user.id, username, body);
        case "Accept":
            return handleAccept(user.id, username, body);
        case "Delete":
            return handleDelete(body);
        case "Announce":
            return handleAnnounce(user.id, username, body);
        default:
            return NextResponse.json({ status: "ignored" }, { status: 202 });
    }
}

function extractEmojis(tag: any[] | undefined) {
    if (!tag || !Array.isArray(tag)) return null;
    const emojis = tag
        .filter((t: any) => t.type === "Emoji")
        .map((t: any) => ({
            name: t.name,
            url: t.icon?.url
        }));
    return emojis.length > 0 ? emojis : null;
}

async function handleDelete(activity: any) {
    const objectId = typeof activity.object === 'string' ? activity.object : activity.object?.id;
    if (!objectId) return NextResponse.json({ status: "ignored" }, { status: 202 });

    console.log("[Inbox] Verified Delete for: " + objectId);
    
    if (objectId === activity.actor) {
        // Actor deletion
        console.log("[Inbox] Remote actor deleted themselves: " + objectId);
        // We could mark them as deleted in our DB if we want to keep history
        // or just let it be. For now we just acknowledge.
    } else {
        // Post deletion
        await postRepository.deleteByUri(objectId);
    }

    return NextResponse.json({ status: "deleted" }, { status: 202 });
}

async function ensureRemoteActor(actorUrl: string, localUserIdForSignedFetch?: string) {
    const existing = await remoteActorRepository.findById(actorUrl);
    if (existing) return existing;

    // Fetch sender's actor object
    let senderActorData;
    if (localUserIdForSignedFetch) {
        senderActorData = await activityPubService.fetchRemoteObjectSigned(actorUrl, localUserIdForSignedFetch);
    } else {
        senderActorData = await activityPubService.fetchRemoteObject(actorUrl);
    }

    if (!senderActorData || !senderActorData.inbox) {
        return null;
    }

    const domain = new URL(actorUrl).hostname;
    const emojis = extractEmojis(senderActorData.tag);

    await remoteActorRepository.upsert({
        id: actorUrl,
        username: senderActorData.preferredUsername || senderActorData.name || "unknown",
        domain: domain,
        name: senderActorData.name,
        bio: senderActorData.summary, // ActivityPub uses 'summary' for bio
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

    return await remoteActorRepository.findById(actorUrl);
}

async function handleFollow(userId: string, username: string, activity: any) {
    console.log("[Inbox] Verified Follow: " + activity.actor + " wants to follow " + username);
    
    try {
        const actor = await ensureRemoteActor(activity.actor, userId);
        if (!actor) throw new Error("Could not ensure remote actor");

        // Record follow relationship (Remote Follower -> Local User)
        await followerRepository.followRemote(activity.actor, userId);

        // Notification: Remote follow
        const notificationId = createId();
        await notificationRepository.create({
            id: notificationId,
            recipientId: userId,
            remoteActorId: actor.id,
            type: "follow",
            targetType: "user",
            isRead: false,
            createdAt: new Date()
        });

        // Trigger Pusher
        await pusherService.trigger(`user-${userId}`, "new-notification", {
            id: notificationId,
            type: "follow",
            remoteActorId: actor.id
        });

        // Send Accept activity back
        await activityPubService.sendAcceptActivity(userId, activity, actor.inbox);

        return NextResponse.json({ status: "accepted" }, { status: 202 });
    } catch (err) {
        console.error("Error handling Follow activity:", err);
        return NextResponse.json({ error: "Internal error but acknowledged" }, { status: 202 });
    }
}

async function handleUndo(userId: string, username: string, activity: any) {
    if (activity.object?.type === "Follow") {
        console.log("[Inbox] Verified Unfollow: " + activity.actor + " stopped following " + username);
        await followerRepository.unfollowRemote(activity.actor, userId);
    }
    return NextResponse.json({ status: "received" }, { status: 202 });
}

async function handleAccept(userId: string, username: string, activity: any) {
    console.log("[Inbox] Verified Accept from " + activity.actor);
    return NextResponse.json({ status: "received" }, { status: 202 });
}

async function handleLike(userId: string, username: string, activity: any) {
    const objectUri = typeof activity.object === 'string' ? activity.object : activity.object?.id;
    if (!objectUri) return NextResponse.json({ status: "ignored" }, { status: 202 });

    const post = await postRepository.findByUri(objectUri);
    if (!post) {
        console.log("[Inbox] Like received for unknown post: " + objectUri);
        return NextResponse.json({ status: "ignored" }, { status: 202 });
    }

    try {
        const actor = await ensureRemoteActor(activity.actor, userId);
        if (!actor) throw new Error("Could not ensure remote actor");

        console.log("[Inbox] Post " + post.id + " liked by remote actor " + actor.id);
        await postRepository.addReaction(post.id, null, "❤️", actor.id);

        // Notification: Remote like
        if (post.userId) {
            const notificationId = createId();
            await notificationRepository.create({
                id: notificationId,
                recipientId: post.userId,
                remoteActorId: actor.id,
                type: "like",
                targetId: post.id,
                targetType: "post",
                isRead: false,
                createdAt: new Date()
            });

            // Trigger Pusher
            await pusherService.trigger(`user-${post.userId}`, "new-notification", {
                id: notificationId,
                type: "like",
                remoteActorId: actor.id
            });
        }
    } catch (err) {
        console.error("Error handling Like activity:", err);
    }

    return NextResponse.json({ status: "received" }, { status: 202 });
}

async function handleCreate(userId: string, username: string, activity: any) {
    const object = activity.object;
    if (!object || object.type !== "Note") return NextResponse.json({ status: "ignored" }, { status: 202 });

    // Use unified resolution logic from ActivityPubService
    try {
        const post = await activityPubService.resolveRemotePost(object.id, userId);
        
        if (post) {
            // Notification logic (only if it's a new association established)
            if (post.replyToId) {
                const parent = await postRepository.findById(post.replyToId);
                if (parent?.userId) {
                    const notificationId = createId();
                    await notificationRepository.create({
                        id: notificationId,
                        recipientId: parent.userId,
                        remoteActorId: post.remoteActorId,
                        type: "reply",
                        targetId: post.id,
                        targetType: "post",
                        isRead: false,
                        createdAt: new Date()
                    });

                    await pusherService.trigger(`user-${parent.userId}`, "new-notification", {
                        id: notificationId,
                        type: "reply",
                        remoteActorId: post.remoteActorId,
                        postId: post.id
                    });
                }
            }

            // Quote Notification
            if (post.quoteOfId) {
                const quoted = await postRepository.findById(post.quoteOfId);
                if (quoted?.userId) {
                    const notificationId = createId();
                    await notificationRepository.create({
                        id: notificationId,
                        recipientId: quoted.userId,
                        remoteActorId: post.remoteActorId,
                        type: "quote",
                        targetId: post.id,
                        targetType: "post",
                        isRead: false,
                        createdAt: new Date()
                    });

                    await pusherService.trigger(`user-${quoted.userId}`, "new-notification", {
                        id: notificationId,
                        type: "quote",
                        remoteActorId: post.remoteActorId,
                        postId: post.id
                    });
                }
            }
        }
        
        return NextResponse.json({ status: "received" }, { status: 201 });
    } catch (err) {
        console.error("Error handling Create activity via resolveRemotePost:", err);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

async function handleAnnounce(userId: string, username: string, activity: any) {
    const objectUri = typeof activity.object === 'string' ? activity.object : activity.object?.id;
    if (!objectUri) return NextResponse.json({ status: "ignored" }, { status: 202 });

    try {
        const actor = await ensureRemoteActor(activity.actor, userId);
        if (!actor) throw new Error("Could not ensure remote actor");

        // Use resolveRemotePost to ensure full thread context for the announced post
        const originalPost = await activityPubService.resolveRemotePost(objectUri, userId);

        if (originalPost) {
            // Avoid duplicate reposts
            const existingRepost = await postRepository.findByUri(activity.id);
            if (existingRepost) return NextResponse.json({ status: "already_exists" }, { status: 202 });

            const repostId = createId();
            await postRepository.create({
                id: repostId,
                content: "", // Pure repost
                userId: null as any,
                remoteActorId: actor.id,
                uri: activity.id,
                repostOfId: originalPost.id,
                visibility: "public",
                isDeleted: false,
                createdAt: new Date(activity.published || Date.now()),
                updatedAt: new Date(),
            });

            // Notification: Remote repost
            if (originalPost.userId) {
                const notificationId = createId();
                await notificationRepository.create({
                    id: notificationId,
                    recipientId: originalPost.userId,
                    remoteActorId: actor.id,
                    type: "repost",
                    targetId: originalPost.id,
                    targetType: "post",
                    isRead: false,
                    createdAt: new Date()
                });

                await pusherService.trigger(`user-${originalPost.userId}`, "new-notification", {
                    id: notificationId,
                    type: "repost",
                    remoteActorId: actor.id
                });
            }
        }

        return NextResponse.json({ status: "announced" }, { status: 202 });
    } catch (err) {
        console.error("Error handling Announce activity:", err);
        return NextResponse.json({ error: "Internal error but acknowledged" }, { status: 202 });
    }
}
