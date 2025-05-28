import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getUploadDir, readMetadata } from '../../../../utils/fileUtils';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params;

    if (!filename) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const uploadDir = getUploadDir();
    const filePath = path.join(uploadDir, filename);

    // Security check - ensure file is in uploads directory
    if (!filePath.startsWith(uploadDir)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Get original filename from metadata
    const metadata = readMetadata();
    const fileInfo = metadata.find(f => f.fileName === filename);
    const originalName = fileInfo?.originalName || filename;

    const fileBuffer = fs.readFileSync(filePath);
    const mimeType = fileInfo?.mimeType || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${originalName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
