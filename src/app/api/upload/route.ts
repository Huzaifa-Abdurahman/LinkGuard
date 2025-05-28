import { NextRequest, NextResponse } from 'next/server';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { ensureUploadDir, readMetadata, writeMetadata, getUploadDir } from '../../../utils/fileUtils';

export async function POST(request: NextRequest) {
  try {
    ensureUploadDir();
    const uploadDir = getUploadDir();

    // Get form data from request
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    // Create unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    const fileName = `${baseName}-${timestamp}${extension}`;
    const filePath = path.join(uploadDir, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(filePath, buffer);

    // Update metadata
    const metadata = readMetadata();
    const newFile = {
      id: timestamp,
      originalName,
      fileName,
      size: file.size,
      uploadDate: new Date().toISOString(),
      mimeType: file.type
    };
    
    metadata.push(newFile);
    writeMetadata(metadata);

    return NextResponse.json({
      message: 'File uploaded successfully',
      file: newFile
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
