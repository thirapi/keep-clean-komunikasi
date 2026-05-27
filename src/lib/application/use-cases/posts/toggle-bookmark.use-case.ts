import { IBookmarkRepository } from "@/lib/application/repositories/bookmark.repository.interface";
import { PostWithUserDTO } from "@/lib/entities/models/post.model";

export class ToggleBookmarkUseCase {
    constructor(private readonly bookmarkRepository: IBookmarkRepository) {}

    async execute(userId: string, postId: string): Promise<PostWithUserDTO> {
        return await this.bookmarkRepository.toggle(userId, postId);
    }
}
