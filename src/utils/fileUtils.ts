import fs from 'fs';
import path from 'path';
import { FileMetadata } from '../types/file';

export const getUploadDir = () => {
  return path.join(process.cwd(), 'public', 'uploads');
};

export const getMetadataPath = () => {
  return path.join(getUploadDir(), 'metadata.json');
};

export const ensureUploadDir = () => {
  const uploadDir = getUploadDir();
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
};

export const readMetadata = (): FileMetadata[] => {
  const metadataPath = getMetadataPath();
  if (!fs.existsSync(metadataPath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(metadataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading metadata:', error);
    return [];
  }
};

export const writeMetadata = (metadata: FileMetadata[]) => {
  const metadataPath = getMetadataPath();
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
};
