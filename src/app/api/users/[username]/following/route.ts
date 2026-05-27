import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { UserRepository } from "@/lib/infrastructure/repositories/user.repository";
import { FollowerRepository } from "@/lib/infrastructure/repositories/follower.repository";

export const dynamic = "force-dynamic";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ username: string }> }
) {
    const { username } = await params;
    const userRepository = new UserRepository(db);
    const followerRepository = new FollowerRepository(db);

    const user = await userRepository.findByUsername(username);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const count = await followerRepository.getFollowingCount(user.id);
    const results = await db.query.followers.findMany({
        where: (followers, { eq }) => eq(followers.followerId, user.id),
        with: {
            following: { columns: { username: true } },
            remoteFollowing: { columns: { id: true } }
        }
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komunikasi.qzz.io";
    
    // Map to URIs
    const followingUris = results.map(f => {
        if (f.remoteFollowingId) return f.remoteFollowingId; // It's a remote actor URI
        if (f.following) return `${baseUrl}/api/users/${f.following.username}`; // It's a local user URI
        return null;
    }).filter(Boolean);

    return NextResponse.json({
        "@context": "https://www.w3.org/ns/activitystreams",
        "id": `${baseUrl}/api/users/${username}/following`,
        "type": "OrderedCollection",
        "totalItems": count,
        "first": {
            "type": "OrderedCollectionPage",
            "totalItems": count,
            "partOf": `${baseUrl}/api/users/${username}/following`,
            "orderedItems": followingUris
        }
    }, {
        headers: { "Content-Type": "application/activity+json" }
    });
}
