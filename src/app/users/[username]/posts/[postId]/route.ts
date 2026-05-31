import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PostRepository } from "@/lib/infrastructure/repositories/post.repository";

export const dynamic = "force-dynamic";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ username: string, postId: string }> }
) {
    const { postId } = await params;
    const postRepository = new PostRepository(db);

    const post = await postRepository.findById(postId);

    if (!post || post.isDeleted) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komunikasi.qzz.io";
    const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, post.userId!),
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const actorId = `${baseUrl}/api/users/${user.username}`;

    // Return the Note object for ActivityPub
    return NextResponse.json({
        "@context": [
            "https://www.w3.org/ns/activitystreams",
            "https://w3id.org/security/v1"
        ],
        "id": post.uri,
        "type": "Note",
        "published": post.createdAt.toISOString(),
        "attributedTo": actorId,
        "content": post.content,
        "url": post.url,
        "to": ["https://www.w3.org/ns/activitystreams#Public"],
        "cc": [`${actorId}/followers`],
        "attachment": [] // We could add attachments here if needed
    }, {
        headers: {
            "Content-Type": "application/activity+json"
        }
    });
}
