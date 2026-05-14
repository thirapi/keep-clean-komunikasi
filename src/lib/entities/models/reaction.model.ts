export interface MessageReactionRecord {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageReactionWithUserDTO extends MessageReactionRecord {
  user: {
    username: string;
  };
}
