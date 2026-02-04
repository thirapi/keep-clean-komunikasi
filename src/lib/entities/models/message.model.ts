export interface MessageRecord {
  id: string;
  userId: string;
  content: string;
  roomId: string;
  imageUrl?: string | null;
  replyTo?: string | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  isOptimistic?: boolean;
}

export interface MessageWithUserDTO extends MessageRecord {
  user: {
    username: string;
    avatar?: string | null;
  };
  replyToMessage?: {
    id: string;
    content: string;
    user: {
      username: string;
    };
  } | null;
}
