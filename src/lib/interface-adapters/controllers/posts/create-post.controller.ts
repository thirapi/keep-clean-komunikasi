import { PostRepository } from "@/lib/infrastructure/repositories/post.repository";
import { CreatePostUseCase } from "@/lib/application/use-cases/posts/create-post.use-case";
import { PusherService } from "@/lib/infrastructure/services/pusher.service";
import { db } from "@/lib/db";
import { z } from "zod";
import { InputParsedError } from "@/lib/entities/errors/common";

const postRepository = new PostRepository(db);
const pusherService = new PusherService();
const createPostUseCase = new CreatePostUseCase(postRepository, pusherService);

const createPostSchema = z.object({
    content: z.string().min(1),
    visibility: z.enum(["public", "unlisted", "private"]).default("public"),
    replyToId: z.string().optional(),
    repostOfId: z.string().optional(),
    attachments: z.array(z.object({
        url: z.string(),
        key: z.string(),
        fileType: z.string(),
        size: z.number().optional(),
    })).optional(),
});

export const createPostController = async (
    userId: string,
    data: {
        content: string;
        visibility?: "public" | "unlisted" | "private";
        replyToId?: string;
        repostOfId?: string;
        attachments?: { url: string; key: string; fileType: string; size?: number }[];
    }
) => {
    const parsed = createPostSchema.safeParse(data);

    if (!parsed.success) {
        throw new InputParsedError("Invalid post input", parsed.error.flatten().fieldErrors);
    }

    return await createPostUseCase.execute(
        userId,
        parsed.data.content,
        parsed.data.visibility,
        parsed.data.replyToId,
        parsed.data.repostOfId,
        parsed.data.attachments
    );
};
