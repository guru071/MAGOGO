import fs from 'fs';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    const buffer = fs.readFileSync('./public/logo.jpeg');
    console.log(`Original size: ${buffer.length} bytes`);
    
    let finalBuffer = buffer;
    if (buffer.length > 500 * 1024 || true) { // Force compression for test
      finalBuffer = (await sharp(buffer).jpeg({ quality: 75 }).toBuffer()) as any;
      console.log(`Compressed size: ${finalBuffer.length} bytes`);
    }
    
    const filename = `test-upload-${Date.now()}.jpg`;
    console.log('Uploading to Supabase:', filename);
    
    const { data, error } = await supabase.storage.from('prompts').upload(filename, finalBuffer, { contentType: 'image/jpeg' });
    
    if (error) {
      console.error('SUPABASE ERROR:', error);
    } else {
      console.log('SUCCESS!', data);
      const { data: { publicUrl } } = supabase.storage.from('prompts').getPublicUrl(filename);
      console.log('Public URL:', publicUrl);
    }
  } catch (err) {
    console.error('TEST FAILED:', err);
  }
}
test();
