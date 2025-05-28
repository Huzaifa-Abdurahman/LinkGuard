export interface FileMetadata {
    id: number;
    originalName: string;
    fileName: string;
    size: number;
    uploadDate: string;
    mimeType?: string;
  }