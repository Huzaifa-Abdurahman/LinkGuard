import { NextResponse } from 'next/server';
import { readMetadata } from '../../../utils/fileUtils';

export async function GET() {
  try {
    const metadata = readMetadata();
    return NextResponse.json(metadata);
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
  }
}
