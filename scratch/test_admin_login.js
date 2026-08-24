const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uruqnynrgxzgwugybjpu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVydXFueW5yZ3h6Z3d1Z3lianB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyOTg3NzMsImV4cCI6MjEwMjg3NDc3M30.MzzawgOfxsENDcUuBb-pVSMAUGC7h9l4VovTfDE6vGI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignIn() {
  console.log('Testing Admin Sign In...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@veloria.com.tr',
    password: 'Veloria2026!'
  });

  if (error) {
    console.error('SignIn Error:', error.message);
  } else {
    console.log('SignIn SUCCESS! User Email:', data.user?.email);
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();
    console.log('Profile Role:', profile?.role);
  }
}

testSignIn();
