import { PostWithUserDTO } from "@/lib/entities/models/post.model";

export interface IBookmarkRepository {
    toggle(userId: string, postId: string): Promise<PostWithUserDTO>;
    isBookmarked(userId: string, postId: string): Promise<boolean>;
    getBookmarkedPosts(userId: string, limit: number, offset: number): Promise<PostWithUserDTO[]>;
}
