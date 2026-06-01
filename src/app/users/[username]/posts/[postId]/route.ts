import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PostRepository } from "@/lib/infrastructure/repositories/post.repository";

export const dynamic = "force-dynamic";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ username: string, postId: string }> }
) {
    const { postId } = await params;
    const accept = request.headers.get("accept") || "";
    
    // Content Negotiation: If not an ActivityPub request, redirect to UI
    if (!accept.includes("application/activity+json") && !accept.includes("application/ld+json")) {
        return NextResponse.redirect(new URL(`/posts/${postId}`, request.url));
    }

    const postRepository = new PostRepository(db);
    const post = await postRepository.findByIdWithDetails(postId);

    if (!post || post.isDeleted) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komunikasi.qzz.io";
    const user = post.user;

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const actorId = `${baseUrl}/api/users/${user.username}`;

    // Map attachments to ActivityStreams Document objects
    const apAttachments = post.attachments?.map(a => ({
        type: "Document",
        mediaType: a.fileType,
        url: a.url,
        name: "Attachment"
    })) || [];

    // Return the Note object for ActivityPub
    const note: any = {
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
        "attachment": apAttachments
    };

    // Handle quote metadata for outgoing JSON
    if (post.quoteOfId) {
        const quotedPost = await postRepository.findById(post.quoteOfId);
        if (quotedPost && quotedPost.uri) {
            note.quoteUrl = quotedPost.uri;
            note._misskey_quote = quotedPost.uri;
        }
    }

    return NextResponse.json(note, {
        headers: {
            "Content-Type": "application/activity+json"
        }
    });
}
