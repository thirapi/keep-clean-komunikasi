import { getPostThreadAction } from "../../../posts.action";
import PostDetailView from "./post-detail-view";
import { notFound } from "next/navigation";

interface PostPageProps {
    params: Promise<{
        postId: string;
    }>;
}

export default async function PostPage({ params }: PostPageProps) {
    const { postId } = await params;

    const fullCurrentUser = await (await import("../../../auth.action")).getUserWithRolesFromSession();

    const response = await getPostThreadAction(postId, fullCurrentUser?.id);

    if (response.status === "error" || !response.data) {
        notFound();
    }

    const { post, replies, parents } = response.data;

    const finalCurrentUser = fullCurrentUser ? {
        id: fullCurrentUser.id,
        name: fullCurrentUser.username,
        initial: fullCurrentUser.username.charAt(0).toUpperCase(),
        role: fullCurrentUser.roles.map(r => r.name).join(", "),
        email: "komunikasi.qzz.io",
        avatar: fullCurrentUser.avatar || "/avatars/avatar1.png",
    } : null;

    return (
        <PostDetailView
            initialPost={post}
            initialReplies={replies}
            initialParents={parents}
            currentUser={finalCurrentUser}
        />
    );
}
