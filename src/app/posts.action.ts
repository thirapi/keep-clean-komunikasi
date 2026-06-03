"use server";

import { createPostController } from "@/lib/interface-adapters/controllers/posts/create-post.controller";
import { getProfileFeedController, getProfileFeedCountController } from "@/lib/interface-adapters/controllers/posts/get-profile-feed.controller";
import { ServerResponse } from "@/lib/entities/models/response.model";
import { PostWithUserDTO } from "@/lib/entities/models/post.model";

import { toggleLikeController, toggleReactionController, repostController } from "@/lib/interface-adapters/controllers/posts/interact-with-post.controller";
import { toggleBookmarkController, getBookmarkedPostsController } from "@/lib/interface-adapters/controllers/posts/bookmark.controller";

import { getPostThreadController } from "@/lib/interface-adapters/controllers/posts/get-post-thread.controller";

// ... (existing actions)

export async function toggleReactionAction(postId: string, userId: string, emoji: string, optimisticId?: string): Promise<ServerResponse<PostWithUserDTO | null>> {
    if (!userId) {
        return { status: "error", data: null, error: { message: "Unauthorized", type: "AuthError" } };
    }
    try {
        const post = await toggleReactionController(userId, postId, emoji, optimisticId);
        return { status: "success", data: post, error: null };
    } catch (error: any) {
        return { status: "error", data: null, error: { message: error.message, type: error.constructor.name } };
    }
}

export async function toggleBookmarkAction(postId: string, userId: string): Promise<ServerResponse<PostWithUserDTO | null>> {
    if (!userId) {
        return { status: "error", data: null, error: { message: "Unauthorized", type: "AuthError" } };
    }
    try {
        const post = await toggleBookmarkController(userId, postId);
        return { status: "success", data: post, error: null };
    } catch (error: any) {
        return { status: "error", data: null as any, error: { message: error.message, type: error.constructor.name } };
    }
}

export async function getBookmarkedPostsAction(userId: string, limit = 20, offset = 0): Promise<ServerResponse<PostWithUserDTO[] | null>> {
    try {
        const posts = await getBookmarkedPostsController(userId, limit, offset);
        return { status: "success", data: posts, error: null };
    } catch (error: any) {
        return { status: "error", data: null, error: { message: error.message, type: error.constructor.name } };
    }
}

import { getGlobalFeedController } from "@/lib/interface-adapters/controllers/posts/get-global-feed.controller";
import { getFollowingFeedController } from "@/lib/interface-adapters/controllers/posts/get-following-feed.controller";
import { getDiscoveryFeedController } from "@/lib/interface-adapters/controllers/posts/get-discovery-feed.controller";
import { deletePostController } from "@/lib/interface-adapters/controllers/posts/delete-post.controller";

export async function deletePostAction(postId: string, userId: string): Promise<ServerResponse<void>> {
    try {
        await deletePostController(postId, userId);
        return {
            status: "success",
            data: undefined,
            error: null,
        };
    } catch (error: any) {
        return {
            status: "error",
            data: undefined as any,
            error: {
                message: error.message || "Failed to delete post",
                type: error.constructor.name,
            },
        };
    }
}

export async function getFollowingFeedAction(userId?: string, limit = 20, offset = 0): Promise<ServerResponse<PostWithUserDTO[] | null>> {
    if (!userId) return { status: "success", data: [], error: null };
    try {
        const feed = await getFollowingFeedController(userId, limit, offset);
        return {
            status: "success",
            data: feed,
            error: null,
        };
    } catch (error: any) {
        return { status: "error", data: null, error: { message: error.message, type: error.constructor.name } };
    }
}

export async function getDiscoveryFeedAction(currentUserId?: string, limit = 20, offset = 0): Promise<ServerResponse<PostWithUserDTO[] | null>> {
    try {
        const feed = await getDiscoveryFeedController(limit, offset, currentUserId);
        return {
            status: "success",
            data: feed,
            error: null,
        };
    } catch (error: any) {
        return { status: "error", data: null, error: { message: error.message, type: error.constructor.name } };
    }
}

export async function createPostAction(
    userId: string,
    content: string,
    attachments?: { url: string; key: string; fileType: string; size?: number }[],
    replyToId?: string,
    repostOfId?: string,
    id?: string,
    visibility?: "public" | "unlisted" | "private",
    quoteOfId?: string
): Promise<ServerResponse<PostWithUserDTO | null>> {
    try {
        const post = await createPostController(userId, {
            id,
            content,
            attachments,
            replyToId,
            repostOfId,
            visibility,
            quoteOfId,
        });

        return {
            status: "success",
            data: post,
            error: null,
        };
    } catch (error: any) {
        return {
            status: "error",
            data: null,
            error: {
                message: error.message || "Failed to create post",
                type: error.constructor.name,
                meta: error.details,
            },
        };
    }
}

export async function getProfileFeedAction(
    username: string,
    filter?: "threads" | "replies" | "reposts" | "media",
    currentUserId?: string,
    limit = 20,
    offset = 0
): Promise<ServerResponse<PostWithUserDTO[] | null>> {
    try {
        const feed = await getProfileFeedController(username, currentUserId, filter, limit, offset);
        return {
            status: "success",
            data: feed,
            error: null,
        };
    } catch (error: any) {
        return {
            status: "error",
            data: null,
            error: {
                message: error.message || "Failed to fetch feed",
                type: error.constructor.name,
            },
        };
    }
}

export async function getProfileFeedCountAction(
    username: string,
    filter?: "threads" | "replies" | "reposts" | "media"
): Promise<ServerResponse<number | null>> {
    try {
        const count = await getProfileFeedCountController(username, filter);
        return {
            status: "success",
            data: count,
            error: null,
        };
    } catch (error: any) {
        return {
            status: "error",
            data: null,
            error: {
                message: error.message || "Failed to fetch count",
                type: error.constructor.name,
            },
        };
    }
}

export async function getGlobalFeedAction(currentUserId?: string, limit = 20, offset = 0, filter: "all" | "local" = "all"): Promise<ServerResponse<PostWithUserDTO[] | null>> {
    try {
        const feed = await getGlobalFeedController(limit, offset, currentUserId, filter);
        return {
            status: "success",
            data: feed,
            error: null,
        };
    } catch (error: any) {
        return { status: "error", data: null, error: { message: error.message, type: error.constructor.name } };
    }
}

export async function toggleLikeAction(postId: string, userId: string, optimisticId?: string): Promise<ServerResponse<PostWithUserDTO | null>> {
    if (!userId) {
        return { status: "error", data: null, error: { message: "Unauthorized", type: "AuthError" } };
    }
    try {
        const post = await toggleLikeController(userId, postId, optimisticId);
        return { status: "success", data: post, error: null };
    } catch (error: any) {
        return { status: "error", data: null, error: { message: error.message, type: error.constructor.name } };
    }
}

export async function repostAction(postId: string, userId: string, optimisticId?: string): Promise<ServerResponse<PostWithUserDTO | null>> {
    if (!userId) {
        return { status: "error", data: null, error: { message: "Unauthorized", type: "AuthError" } };
    }
    try {
        const post = await repostController(userId, postId, optimisticId);
        return { status: "success", data: post, error: null };
    } catch (error: any) {
        return { status: "error", data: null, error: { message: error.message, type: error.constructor.name } };
    }
}

export async function getPostThreadAction(postId: string, currentUserId?: string): Promise<ServerResponse<{
    post: PostWithUserDTO;
    replies: PostWithUserDTO[];
    parents: PostWithUserDTO[];
    thread: PostWithUserDTO[];
} | null>> {
    try {
        const data = await getPostThreadController(postId, currentUserId);
        return { status: "success", data, error: null };
    } catch (error: any) {
        return { status: "error", data: null, error: { message: error.message, type: error.constructor.name } };
    }
}

export async function getNewPostsAction(sinceId: string, currentUserId?: string): Promise<ServerResponse<PostWithUserDTO[] | null>> {
    try {
        // Simple implementation: fetch all global and filter in memory or add to controller
        // For efficiency, we should ideally have a getNewPostsController
        const feed = await getGlobalFeedController(50, 0, currentUserId);
        const sinceIdx = feed.findIndex(p => p.id === sinceId);

        const newPosts = sinceIdx > 0 ? feed.slice(0, sinceIdx) : [];

        return {
            status: "success",
            data: newPosts,
            error: null
        };
    } catch (error: any) {
        return { status: "error", data: null, error: { message: error.message, type: error.constructor.name } };
    }
}
