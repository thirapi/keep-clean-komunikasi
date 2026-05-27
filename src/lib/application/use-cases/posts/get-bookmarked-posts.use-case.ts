import { IBookmarkRepository } from "@/lib/application/repositories/bookmark.repository.interface";
import { PostWithUserDTO } from "@/lib/entities/models/post.model";

export class GetBookmarkedPostsUseCase {
    constructor(private readonly bookmarkRepository: IBookmarkRepository) {}

    async execute(userId: string, limit: number, offset: number): Promise<PostWithUserDTO[]> {
        return await this.bookmarkRepository.getBookmarkedPosts(userId, limit, offset);
    }
}
