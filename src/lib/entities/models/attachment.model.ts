export interface AttachmentRecord {
  id: string;
  url: string;
  key: string;
  fileType: string;
  size?: number | null;
  description?: string | null;
  blurhash?: string | null;
  messageId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttachmentWithMessageDTO extends AttachmentRecord {
  message: {
    userId: string;
    roomId: string;
  };
}
