import { uploadBuffer } from './src/lib/cloudinary';
import fs from 'fs';

async function testUpload() {
  try {
    const buffer = fs.readFileSync('./public/logo.jpeg');
    console.log('Uploading to Cloudinary...');
    const result = await uploadBuffer(buffer, 'test-folder');
    console.log('SUCCESS! Image URL:', result.secure_url);
  } catch (err) {
    console.error('UPLOAD FAILED:', err);
  }
}
testUpload();
