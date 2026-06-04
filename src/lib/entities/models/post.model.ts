import { AttachmentRecord } from "./attachment.model";
import { MessageReactionWithUserDTO } from "./reaction.model";

export interface PostRecord {
    id: string;
    userId?: string | null;
    remoteActorId?: string | null;
    content: string;
    uri?: string | null;
    url?: string | null;
    replyToId?: string | null;
    repostOfId?: string | null;
    quoteOfId?: string | null;
    context?: string | null;
    apMetadata?: {
        originalTags?: any[];
        isFepE232Quote?: boolean;
    } | null;
    visibility: "public" | "unlisted" | "private";
    emojis?: { name: string; url: string }[] | null;
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
        name?: string | null;
        customStatus?: string | null;
    } | null;
    remoteActor?: {
        id: string;
        username: string;
        domain: string;
        name?: string | null;
        avatar?: string | null;
        emojis?: { name: string; url: string }[] | null;
    } | null;
    attachments?: AttachmentRecord[];
    reactions?: PostReactionWithUserDTO[];
    reposts?: PostWithUserDTO[];
    replyTo?: PostWithUserDTO | null;
    repostOf?: PostWithUserDTO | null;
    quoteOf?: PostWithUserDTO | null;
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
    userId?: string | null;
    remoteActorId?: string | null;
    emoji: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface PostReactionWithUserDTO extends PostReactionRecord {
    user: {
        username: string;
    } | null;
    remoteActor?: {
        id: string;
        username: string;
        domain: string;
        name?: string | null;
        avatar?: string | null;
    } | null;
}
