const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uruqnynrgxzgwugybjpu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVydXFueW5yZ3h6Z3d1Z3lianB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyOTg3NzMsImV4cCI6MjEwMjg3NDc3M30.MzzawgOfxsENDcUuBb-pVSMAUGC7h9l4VovTfDE6vGI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdmin() {
  console.log('Signing up admin...');
  const { data, error } = await supabase.auth.signUp({
    email: 'admin@veloria.com.tr',
    password: 'Veloria2026!',
    options: {
      data: {
        full_name: 'Veloria Admin'
      }
    }
  });

  if (error) {
    console.error('SignUp Error:', error.message);
  } else {
    console.log('SignUp Success! User ID:', data.user?.id);
  }
}

createAdmin();
