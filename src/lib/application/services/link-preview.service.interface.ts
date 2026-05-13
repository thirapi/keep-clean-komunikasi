export interface LinkPreview {
  title: string;
  description?: string;
  image?: string;
  url: string;
  siteName?: string;
  favicon?: string;
  themeColor?: string;
}

export interface ILinkPreviewService {
  getPreview(url: string): Promise<LinkPreview | null>;
}
