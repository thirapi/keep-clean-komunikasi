import { FileStorageInterface, UploadedFile } from "../../services/file-storage.interface";

export class UploadFileUseCase {
  constructor(private storageService: FileStorageInterface) {}

  async execute(file: UploadedFile, destination?: string): Promise<{ fileurl: string; filename: string; size: number; mimetype: string }> {
    const result = await this.storageService.saveFile(file, { destination });
    return {
      fileurl: result.fileurl,
      filename: result.filename,
      size: result.size,
      mimetype: result.mimetype,
    };
  }
}
