import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

import ws from 'ws';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws }
});

async function main() {
  console.log('Ensuring "prompts" storage bucket exists...');
  
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error('Error listing buckets:', listError);
    process.exit(1);
  }

  const bucketExists = buckets.some(b => b.name === 'prompts');
  
  if (bucketExists) {
    console.log('Bucket "prompts" already exists. Updating it to be public...');
    await supabase.storage.updateBucket('prompts', { public: true });
    console.log('Success!');
  } else {
    console.log('Creating "prompts" bucket as public...');
    const { error: createError } = await supabase.storage.createBucket('prompts', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      fileSizeLimit: 10485760 // 10MB
    });
    
    if (createError) {
      console.error('Failed to create bucket:', createError);
      process.exit(1);
    }
    console.log('Success! Bucket created.');
  }
}

main().catch(console.error);
