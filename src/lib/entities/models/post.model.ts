import { AttachmentRecord } from "./attachment.model";
import { MessageReactionWithUserDTO } from "./reaction.model";

export interface PostRecord {
    id: string;
    userId: string;
    content: string;
    uri?: string | null;
    url?: string | null;
    replyToId?: string | null;
    repostOfId?: string | null;
    visibility: "public" | "unlisted" | "private";
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface PostLinkPreview {
    id: string;
    postId: string;
    url: string;
    title?: string | null;
    description?: string | null;
    image?: string | null;
    siteName?: string | null;
    createdAt: Date;
}

export interface PostWithUserDTO extends PostRecord {
    user: {
        username: string;
        avatar?: string | null;
        bio?: string | null;
        banner?: string | null;
        customStatus?: string | null;
    };
    attachments?: AttachmentRecord[];
    reactions?: PostReactionWithUserDTO[];
    replyTo?: PostWithUserDTO | null;
    repostOf?: PostWithUserDTO | null;
    linkPreviews?: PostLinkPreview[];
    // UI metadata
    isLikedByCurrentUser?: boolean;
    isRepostedByCurrentUser?: boolean;
    isBookmarkedByCurrentUser?: boolean;
    repostCount?: number;
    replyCount?: number;
    optimisticId?: string;
}

export interface PostReactionRecord {
    id: string;
    postId: string;
    userId: string;
    emoji: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface PostReactionWithUserDTO extends PostReactionRecord {
    user: {
        username: string;
    };
}
