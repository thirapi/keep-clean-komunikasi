import { PostRepository } from "@/lib/infrastructure/repositories/post.repository";
import { GetProfileFeedUseCase } from "@/lib/application/use-cases/posts/get-profile-feed.use-case";
import { db } from "@/lib/db";

const postRepository = new PostRepository(db);
const getProfileFeedUseCase = new GetProfileFeedUseCase(postRepository);

export const getProfileFeedController = async (
    username: string,
    currentUserId?: string,
    filter?: "threads" | "replies" | "reposts"
) => {
    const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.username, username),
    });

    if (!user) {
        throw new Error("User not found");
    }

    return await getProfileFeedUseCase.execute(user.id, currentUserId, filter);
};
