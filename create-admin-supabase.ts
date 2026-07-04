import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import ws from 'ws';

// Load .env from current directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws }
});

const db = new PrismaClient();

async function main() {
  const email = 'guruprasath23062008@gmail.com';
  const password = '@jacksparrow07';

  console.log(`Creating user in Supabase Auth...`);
  
  // 1. Create user in Supabase Auth (or get if exists)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  let userId: string;

  if (authError) {
    if (authError.message.includes('already registered') || authError.code === 'user_already_exists') {
      console.log('User already exists in Supabase Auth. Fetching ID...');
      const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;
      
      const existingUser = usersData.users.find(u => u.email === email);
      if (!existingUser) throw new Error('Could not find existing user in list.');
      userId = existingUser.id;
      
      // Update password just in case
      console.log('Updating password to be safe...');
      await supabase.auth.admin.updateUserById(userId, { password });
    } else {
      throw authError;
    }
  } else {
    userId = authData.user.id;
    console.log('Successfully created user in Supabase Auth. ID:', userId);
  }

  // 2. Ensure they are ADMIN in public.User table
  console.log('Upserting user in public.User table as ADMIN...');
  
  const existingPublicUser = await db.user.findUnique({ where: { email } });
  
  if (existingPublicUser) {
    if (existingPublicUser.id !== userId) {
        console.log(`Warning: public.User ID (${existingPublicUser.id}) does not match Auth ID (${userId}). Deleting old public.User record...`);
        await db.user.delete({ where: { email } });
        
        await db.user.create({
            data: {
              id: userId,
              authUserId: userId,
              email,
              name: 'GURUPRASATH D',
              role: 'ADMIN',
              isVerified: true
            }
        });
    } else {
        await db.user.update({
          where: { email },
          data: { role: 'ADMIN', isVerified: true }
        });
    }
  } else {
    await db.user.create({
      data: {
        id: userId,
        authUserId: userId,
        email,
        name: 'GURUPRASATH D',
        role: 'ADMIN',
        isVerified: true
      }
    });
  }

  console.log('Setup complete! You can now log in with the application UI.');
}

main()
  .catch(console.error)
  .finally(async () => {
    await db.$disconnect();
  });
