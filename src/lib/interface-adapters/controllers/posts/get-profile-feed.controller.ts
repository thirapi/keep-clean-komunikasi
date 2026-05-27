import { PostRepository } from "@/lib/infrastructure/repositories/post.repository";
import { GetProfileFeedUseCase } from "@/lib/application/use-cases/posts/get-profile-feed.use-case";
import { db } from "@/lib/db";

const postRepository = new PostRepository(db);
const getProfileFeedUseCase = new GetProfileFeedUseCase(postRepository);

export const getProfileFeedController = async (
    username: string,
    currentUserId?: string,
    filter?: "threads" | "replies" | "reposts" | "media",
    limit = 20,
    offset = 0
) => {
    // 1. Try local user
    const localUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.username, username),
    });

    if (localUser) {
        return await getProfileFeedUseCase.execute(localUser.id, currentUserId, filter, limit, offset);
    }

    // 2. Try remote actor
    if (username.includes("@")) {
        const handle = username.startsWith("@") ? username : `@${username}`;
        const parts = handle.slice(1).split("@");
        const remoteActor = await db.query.remoteActors.findFirst({
            where: (actors, { and, eq }) => and(eq(actors.username, parts[0]), eq(actors.domain, parts[1])),
        });

        if (remoteActor) {
            // For remote actors, we fetch posts where remoteActorId matches
            return await getProfileFeedUseCase.executeRemote(remoteActor.id, currentUserId, filter, limit, offset);
        }
    }

    throw new Error("User not found");
};

export const getProfileFeedCountController = async (
    username: string,
    filter?: "threads" | "replies" | "reposts" | "media"
) => {
    // 1. Try local user
    const localUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.username, username),
    });

    if (localUser) {
        return await getProfileFeedUseCase.getCount(localUser.id, filter);
    }

    // 2. Try remote actor
    if (username.includes("@")) {
        const handle = username.startsWith("@") ? username : `@${username}`;
        const parts = handle.slice(1).split("@");
        const remoteActor = await db.query.remoteActors.findFirst({
            where: (actors, { and, eq }) => and(eq(actors.username, parts[0]), eq(actors.domain, parts[1])),
        });

        if (remoteActor) {
            return await getProfileFeedUseCase.getCountRemote(remoteActor.id, filter);
        }
    }

    throw new Error("User not found");
};
