export interface AttachmentRecord {
  id: string;
  url: string;
  key: string;
  fileType: string;
  size?: number | null;
  description?: string | null; // Alt text
  blurhash?: string | null; // Placeholder for images
  messageId?: string | null;
  postId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
