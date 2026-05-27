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

    const count = await followerRepository.getFollowerCount(user.id);
    const results = await db.query.followers.findMany({
        where: (followers, { or, eq }) => or(
            eq(followers.followingId, user.id),
            eq(followers.remoteFollowingId, user.id)
        ),
        with: {
            follower: { columns: { username: true } },
            remoteFollower: { columns: { id: true } }
        }
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komunikasi.qzz.io";
    
    // Map to URIs
    const followerUris = results.map(f => {
        if (f.remoteFollowerId) return f.remoteFollowerId; // It's a remote actor URI
        if (f.follower) return `${baseUrl}/api/users/${f.follower.username}`; // It's a local user URI
        return null;
    }).filter(Boolean);

    return NextResponse.json({
        "@context": "https://www.w3.org/ns/activitystreams",
        "id": `${baseUrl}/api/users/${username}/followers`,
        "type": "OrderedCollection",
        "totalItems": count,
        "first": {
            "type": "OrderedCollectionPage",
            "totalItems": count,
            "partOf": `${baseUrl}/api/users/${username}/followers`,
            "orderedItems": followerUris
        }
    }, {
        headers: { "Content-Type": "application/activity+json" }
    });
}
