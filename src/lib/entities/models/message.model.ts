import { AttachmentRecord } from "./attachment.model";
import { MessageReactionWithUserDTO } from "./reaction.model";

export interface MessageRecord {
  id: string;
  userId: string;
  content: string;
  roomId: string;
  replyTo?: string | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  attachments?: AttachmentRecord[];
  isOptimistic?: boolean;
  optimisticId?: string;
}

export interface MessageWithUserDTO extends MessageRecord {
  user: {
    username: string;
    avatar?: string | null;
    bio?: string | null;
    banner?: string | null;
    customStatus?: string | null;
  };
  replyToMessage?: {
    id: string;
    content: string;
    user: {
      username: string;
    };
  } | null;
  reactions?: MessageReactionWithUserDTO[];
}
