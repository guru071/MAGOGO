const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  const email = 'admin@maghgo.com';
  const password = 'AdminPassword123!';
  const name = 'Super Admin';

  try {
    console.log(`Creating user ${email} in Supabase Auth...`);
    // 1. Create User in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (authError) {
      if (authError.message.includes('already been registered')) {
        console.log("User already exists in Supabase. We will upgrade them to ADMIN.");
      } else {
        throw authError;
      }
    }

    const authUserId = authData?.user?.id;
    if (!authUserId) {
        console.log("Fetching existing user id...");
        // If it already exists, fetch it
        const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;
        const existingUser = listData.users.find(u => u.email === email);
        if (!existingUser) throw new Error("Could not find user in Supabase");
        
        await prisma.user.update({
            where: { email },
            data: { role: 'ADMIN', authUserId: existingUser.id }
        });
        console.log(`Successfully upgraded existing user ${email} to ADMIN!`);
        return;
    }

    console.log(`Creating user profile in Prisma Database...`);
    // 2. Create User in Prisma DB
    await prisma.user.upsert({
      where: { email },
      update: { role: 'ADMIN', authUserId },
      create: {
        authUserId,
        email,
        name,
        role: 'ADMIN',
      }
    });

    console.log("====================================================");
    console.log("✅ Admin User Created Successfully!");
    console.log("Email:    " + email);
    console.log("Password: " + password);
    console.log("====================================================");
    
  } catch (err) {
    console.error("Failed to create admin user:", err);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
