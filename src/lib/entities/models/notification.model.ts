export interface NotificationRecord {
    id: string;
    recipientId: string;
    actorId?: string | null;
    remoteActorId?: string | null;
    type: "like" | "repost" | "reply" | "mention" | "follow" | "quote" | "reaction";
    emoji?: string | null;
    targetId?: string | null;
    targetType?: "post" | "message" | "user" | null;
    isRead: boolean;
    createdAt: Date;
}
