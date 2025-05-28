import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const metadataPath = path.join(process.cwd(), 'public/uploads/metadata.json');
  
  try {
    if (!fs.existsSync(metadataPath)) {
      return res.status(200).json([]);
    }
    
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    res.status(200).json(metadata);
  } catch (error) {
    console.error('Error reading files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
}
