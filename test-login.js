const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'admin2@example.com',
    password: 'password123',
    email_confirm: true
  });
  console.log(data, error);
}
main();
