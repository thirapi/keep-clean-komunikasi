export interface AttachmentRecord {
  id: string;
  url: string;
  key: string;
  fileType: string;
  size?: number | null;
  messageId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
