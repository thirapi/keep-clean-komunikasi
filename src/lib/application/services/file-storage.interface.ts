export abstract class FileStorageInterface {
  abstract saveFile(file: UploadedFile, options?: SaveFileOptions): Promise<SavedFileResult>;
  abstract deleteFile(filepath: string): Promise<void>;

  protected validateFileSize(size: number, maxSize: number): boolean {
    return size <= maxSize;
  }
}

export interface UploadedFile {
  size: number;
  fieldname: string;
  originalname: string;
  buffer: Buffer;
  mimetype: string;
}

export interface SaveFileOptions {
  destination?: string;
}

export interface SavedFileResult {
  fileurl: string;
  filename: string;
  originalFilename: string;
  filepath: string;
  size: number;
  mimetype: string;
}