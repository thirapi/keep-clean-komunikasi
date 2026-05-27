import { BookmarkRepository } from "@/lib/infrastructure/repositories/bookmark.repository";
import { ToggleBookmarkUseCase } from "@/lib/application/use-cases/posts/toggle-bookmark.use-case";
import { GetBookmarkedPostsUseCase } from "@/lib/application/use-cases/posts/get-bookmarked-posts.use-case";
import { db } from "@/lib/db";

const bookmarkRepository = new BookmarkRepository(db);
const toggleBookmarkUseCase = new ToggleBookmarkUseCase(bookmarkRepository);
const getBookmarkedPostsUseCase = new GetBookmarkedPostsUseCase(bookmarkRepository);

export const toggleBookmarkController = async (userId: string, postId: string) => {
    return await toggleBookmarkUseCase.execute(userId, postId);
};

export const getBookmarkedPostsController = async (userId: string, limit: number = 20, offset: number = 0) => {
    return await getBookmarkedPostsUseCase.execute(userId, limit, offset);
};
