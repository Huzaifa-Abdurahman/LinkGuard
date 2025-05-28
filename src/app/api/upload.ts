import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const uploadDir = path.join(process.cwd(), 'public/uploads');
  
  // Create uploads directory if it doesn't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB limit
  });

  try {
    const [fields, files] = await form.parse(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Rename file to include timestamp for uniqueness
    const timestamp = Date.now();
    const originalName = file.originalFilename || 'unknown';
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    const newFileName = `${baseName}-${timestamp}${extension}`;
    const newPath = path.join(uploadDir, newFileName);
    
    fs.renameSync(file.filepath, newPath);

    // Store file metadata in a simple JSON file
    const metadataPath = path.join(uploadDir, 'metadata.json');
    let metadata = [];
    
    if (fs.existsSync(metadataPath)) {
      metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    }
    
    metadata.push({
      id: timestamp,
      originalName,
      fileName: newFileName,
      size: file.size,
      uploadDate: new Date().toISOString(),
    });
    
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    res.status(200).json({ 
      message: 'File uploaded successfully', 
      fileName: newFileName,
      originalName 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
}