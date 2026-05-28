import { PostRepository } from "@/lib/infrastructure/repositories/post.repository";
import { RemoteActorRepository } from "@/lib/infrastructure/repositories/remote-actor.repository";
import { GetProfileFeedUseCase } from "@/lib/application/use-cases/posts/get-profile-feed.use-case";
import { db } from "@/lib/db";
import { remoteActors, users } from "@/lib/infrastructure/drizzle/schema";
import { and, eq, sql } from "drizzle-orm";

const postRepository = new PostRepository(db);
const remoteActorRepository = new RemoteActorRepository(db as any);
const getProfileFeedUseCase = new GetProfileFeedUseCase(postRepository, remoteActorRepository);

export const getProfileFeedController = async (
    username: string,
    currentUserId?: string,
    filter?: "threads" | "replies" | "reposts" | "media",
    limit = 20,
    offset = 0
) => {
    // 1. Try local user (case insensitive)
    const localUser = await db.query.users.findFirst({
        where: eq(sql`lower(${users.username})`, username.toLowerCase()),
    });

    if (localUser) {
        return await getProfileFeedUseCase.execute(localUser.id, currentUserId, filter, limit, offset);
    }

    // 2. Try remote actor
    if (username.includes("@")) {
        const handle = username.startsWith("@") ? username : `@${username}`;
        const parts = handle.slice(1).split("@");
        const localPart = parts[0].toLowerCase();
        const domain = parts[1].toLowerCase();

        const actors = await db.query.remoteActors.findMany({
            where: and(
                eq(sql`lower(${remoteActors.username})`, localPart), 
                eq(sql`lower(${remoteActors.domain})`, domain)
            ),
        });

        if (actors.length > 0) {
            // Use all IDs found to catch all posts even if stored under different URI aliases
            const actorIds = actors.map(a => a.id);
            return await getProfileFeedUseCase.executeRemote(actorIds, currentUserId, filter, limit, offset);
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
        where: eq(sql`lower(${users.username})`, username.toLowerCase()),
    });

    if (localUser) {
        return await getProfileFeedUseCase.getCount(localUser.id, filter);
    }

    // 2. Try remote actor
    if (username.includes("@")) {
        const handle = username.startsWith("@") ? username : `@${username}`;
        const parts = handle.slice(1).split("@");
        const localPart = parts[0].toLowerCase();
        const domain = parts[1].toLowerCase();

        const actors = await db.query.remoteActors.findMany({
            where: and(
                eq(sql`lower(${remoteActors.username})`, localPart), 
                eq(sql`lower(${remoteActors.domain})`, domain)
            ),
        });

        if (actors.length > 0) {
            const actorIds = actors.map(a => a.id);
            return await getProfileFeedUseCase.getCountRemote(actorIds, filter);
        }
    }

    throw new Error("User not found");
};
