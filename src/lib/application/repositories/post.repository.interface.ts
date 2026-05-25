import { PostRecord, PostWithUserDTO } from "@/lib/entities/models/post.model";

export interface IPostRepository {
    create(post: PostRecord, attachments?: { url: string; key: string; fileType: string; size?: number }[]): Promise<PostRecord>;
    update(id: string, post: Partial<PostRecord>): Promise<PostRecord>;
    delete(id: string): Promise<void>;
    findById(id: string): Promise<PostRecord | null>;
    findByIdWithDetails(id: string, currentUserId?: string): Promise<PostWithUserDTO | null>;
    findRepost(userId: string, originalPostId: string): Promise<PostRecord | null>;
    findByUserId(userId: string, currentUserId?: string, filter?: "threads" | "replies" | "reposts", limit?: number, offset?: number): Promise<PostWithUserDTO[]>;
    findReplies(postId: string, currentUserId?: string): Promise<PostWithUserDTO[]>;
    findParentChain(postId: string, currentUserId?: string): Promise<PostWithUserDTO[]>;
    getGlobalFeed(limit?: number, offset?: number, currentUserId?: string): Promise<PostWithUserDTO[]>;
    getFollowingFeed(followingIds: string[], limit?: number, offset?: number, currentUserId?: string): Promise<PostWithUserDTO[]>;
    getDiscoveryFeed(limit?: number, offset?: number, currentUserId?: string): Promise<PostWithUserDTO[]>;
    addReaction(postId: string, userId: string, emoji: string): Promise<void>;
    removeReaction(postId: string, userId: string, emoji: string): Promise<void>;
}
