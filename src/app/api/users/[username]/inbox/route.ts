import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { UserRepository } from "@/lib/infrastructure/repositories/user.repository";
import { RemoteActorRepository } from "@/lib/infrastructure/repositories/remote-actor.repository";
import { FollowerRepository } from "@/lib/infrastructure/repositories/follower.repository";
import { SignatureVerificationService } from "@/lib/infrastructure/services/signature-verification.service";
import { ActivityPubService } from "@/lib/infrastructure/services/activitypub.service";

const userRepository = new UserRepository(db);
const remoteActorRepository = new RemoteActorRepository(db);
const followerRepository = new FollowerRepository(db);
const activityPubService = new ActivityPubService(userRepository, followerRepository);

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
    const publicKey = await SignatureVerificationService.fetchRemotePublicKey(keyId);
    if (!publicKey) {
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
        console.warn(`[Inbox] Invalid signature for ${username} from ${keyId}`);
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = await request.json();
    console.log(`[Inbox] Verified activity received for ${username}:`, body.type);

    // Basic Activity Handling
    switch (body.type) {
        case "Follow":
            return handleFollow(user.id, username, body);
        case "Undo":
            return handleUndo(user.id, username, body);
        default:
            return NextResponse.json({ status: "ignored" }, { status: 202 });
    }
}

async function handleFollow(userId: string, username: string, activity: any) {
    console.log(`[Inbox] Verified Follow: ${activity.actor} wants to follow ${username}`);
    
    try {
        // 1. Fetch sender's actor object
        const senderActorData = await fetch(activity.actor, {
            headers: { "Accept": "application/activity+json" }
        }).then(res => res.json());

        const domain = new URL(activity.actor).hostname;

        // 2. Upsert RemoteActor
        await remoteActorRepository.upsert({
            id: activity.actor,
            username: senderActorData.preferredUsername || senderActorData.name,
            domain: domain,
            name: senderActorData.name,
            avatar: senderActorData.icon?.url,
            inbox: senderActorData.inbox,
            sharedInbox: senderActorData.endpoints?.sharedInbox,
            publicKey: senderActorData.publicKey?.publicKeyPem,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // 3. Record follow relationship
        await followerRepository.followRemote(activity.actor, userId);

        // 4. Send Accept activity back
        await activityPubService.sendAcceptActivity(userId, activity);

        return NextResponse.json({ status: "accepted" }, { status: 202 });
    } catch (err) {
        console.error("Error handling Follow activity:", err);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

async function handleUndo(userId: string, username: string, activity: any) {
    if (activity.object?.type === "Follow") {
        console.log(`[Inbox] Verified Unfollow: ${activity.actor} stopped following ${username}`);
        await followerRepository.unfollowRemote(activity.actor, userId);
    }
    return NextResponse.json({ status: "received" }, { status: 202 });
}
