import { PostRecord, PostWithUserDTO } from "@/lib/entities/models/post.model";

export interface IPostRepository {
    create(post: PostRecord, attachments?: { url: string; key: string; fileType: string; size?: number; blurhash?: string; description?: string }[]): Promise<PostRecord>;
    update(id: string, post: Partial<PostRecord>, attachments?: { url: string; key: string; fileType: string; size?: number; blurhash?: string; description?: string }[]): Promise<PostRecord>;
    delete(id: string): Promise<void>;
    findById(id: string): Promise<PostRecord | null>;
    findByIdWithDetails(id: string, currentUserId?: string): Promise<PostWithUserDTO | null>;
    findRepost(userId: string, originalPostId: string): Promise<PostRecord | null>;
    findByUserId(userId: string, currentUserId?: string, filter?: "threads" | "replies" | "reposts" | "media", limit?: number, offset?: number): Promise<PostWithUserDTO[]>;
    findByRemoteActorId(remoteActorId: string | string[], currentUserId?: string, filter?: "threads" | "replies" | "reposts" | "media", limit?: number, offset?: number): Promise<PostWithUserDTO[]>;
    countByUserId(userId: string, filter?: "threads" | "replies" | "reposts" | "media"): Promise<number>;
    countByRemoteActorId(remoteActorId: string | string[], filter?: "threads" | "replies" | "reposts" | "media"): Promise<number>;
    findReplies(postId: string, currentUserId?: string): Promise<PostWithUserDTO[]>;
    findByContext(context: string, currentUserId?: string): Promise<PostWithUserDTO[]>;
    findByUri(uri: string): Promise<PostRecord | null>;
    deleteByUri(uri: string): Promise<void>;
    findParentChain(postId: string, currentUserId?: string): Promise<PostWithUserDTO[]>;
    findThreadDescendants(postId: string, userId: string, currentUserId?: string): Promise<PostWithUserDTO[]>;
    getGlobalFeed(limit?: number, offset?: number, currentUserId?: string, filter?: "all" | "local", excludedUserIds?: string[], excludedRemoteActorIds?: string[]): Promise<PostWithUserDTO[]>;
    getFollowingFeed(followingIds: string[], remoteFollowingIds: string[], limit?: number, offset?: number, currentUserId?: string, excludedUserIds?: string[], excludedRemoteActorIds?: string[]): Promise<PostWithUserDTO[]>;
    getDiscoveryFeed(limit?: number, offset?: number, currentUserId?: string, excludedUserIds?: string[], excludedRemoteActorIds?: string[]): Promise<PostWithUserDTO[]>;
    addReaction(postId: string, userId: string | null, emoji: string, remoteActorId?: string): Promise<void>;
    removeReaction(postId: string, userId: string | null, emoji: string, remoteActorId?: string): Promise<void>;
}
