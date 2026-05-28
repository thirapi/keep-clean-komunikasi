import { PostRepository } from "@/lib/infrastructure/repositories/post.repository";
import { CreatePostUseCase } from "@/lib/application/use-cases/posts/create-post.use-case";
import { PusherService } from "@/lib/infrastructure/services/pusher.service";
import { LinkPreviewRepository } from "@/lib/infrastructure/repositories/link-preview.repository";
import { LinkPreviewService } from "@/lib/infrastructure/services/link-preview.service";
import { HashtagRepository } from "@/lib/infrastructure/repositories/hashtag.repository";
import { ActivityPubService } from "@/lib/infrastructure/services/activitypub.service";
import { UserRepository } from "@/lib/infrastructure/repositories/user.repository";
import { FollowerRepository } from "@/lib/infrastructure/repositories/follower.repository";
import { RemoteActorRepository } from "@/lib/infrastructure/repositories/remote-actor.repository";
import { db } from "@/lib/db";
import { z } from "zod";
import { InputParsedError } from "@/lib/entities/errors/common";

const postRepository = new PostRepository(db);
const pusherService = new PusherService();
const linkPreviewRepository = new LinkPreviewRepository(db);
const linkPreviewService = new LinkPreviewService();
const hashtagRepository = new HashtagRepository(db);
const userRepository = new UserRepository(db);
const followerRepository = new FollowerRepository(db);
const remoteActorRepository = new RemoteActorRepository(db as any);
const activityPubService = new ActivityPubService(userRepository, followerRepository, postRepository, remoteActorRepository);

const createPostUseCase = new CreatePostUseCase(
    postRepository, 
    pusherService,
    linkPreviewRepository,
    linkPreviewService,
    hashtagRepository,
    activityPubService
);

const createPostSchema = z.object({
    id: z.string().optional(),
    content: z.string().default(""),
    visibility: z.enum(["public", "unlisted", "private"]).default("public"),
    replyToId: z.string().optional(),
    repostOfId: z.string().optional(),
    attachments: z.array(z.object({
        url: z.string(),
        key: z.string(),
        fileType: z.string(),
        size: z.number().optional(),
    })).optional(),
}).refine(data => {
    // Post must have either content or attachments
    return data.content.trim().length > 0 || (data.attachments && data.attachments.length > 0);
}, {
    message: "Postingan harus memiliki konten teks atau lampiran",
    path: ["content"]
});

export const createPostController = async (
    userId: string,
    data: {
        id?: string;
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
        parsed.data.attachments,
        parsed.data.id
    );
};
