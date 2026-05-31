export interface NotificationRecord {
    id: string;
    recipientId: string;
    actorId?: string | null;
    remoteActorId?: string | null;
    type: "like" | "repost" | "reply" | "mention" | "follow";
    targetId?: string | null;
    targetType?: "post" | "message" | "user" | null;
    isRead: boolean;
    createdAt: Date;
}
