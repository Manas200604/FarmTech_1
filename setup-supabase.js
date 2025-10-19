// Quick Supabase Setup Verification Script
// Run this in your browser console after setting up Supabase

import { supabase } from './src/supabase/client.js';

async function verifySupabaseSetup() {
  console.log('🔍 Verifying Supabase Setup...\n');
  
  try {
    // Test 1: Check connection
    console.log('1. Testing Supabase connection...');
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log('✅ Connection successful!\n');
    
    // Test 2: Check tables exist
    console.log('2. Checking database tables...');
    const tables = ['users', 'uploads', 'schemes', 'contacts', 'pesticides', 'stats'];
    for (const table of tables) {
      const { error } = await supabase.from(table).select('*', { head: true, count: 'exact' });
      if (error) {
        console.log(`❌ Table '${table}' not found or accessible`);
        throw error;
      }
      console.log(`✅ Table '${table}' exists`);
    }
    console.log('');
    
    // Test 3: Check storage bucket
    console.log('3. Checking storage bucket...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) throw bucketError;
    
    const uploadsBucket = buckets.find(bucket => bucket.name === 'uploads');
    if (!uploadsBucket) {
      console.log('❌ Storage bucket "uploads" not found');
      throw new Error('Storage bucket missing');
    }
    console.log('✅ Storage bucket "uploads" exists\n');
    
    // Test 4: Test authentication
    console.log('4. Testing authentication...');
    const { data: authData } = await supabase.auth.getSession();
    console.log('✅ Authentication system ready\n');
    
    console.log('🎉 All checks passed! Your Supabase setup is complete.');
    console.log('\nNext steps:');
    console.log('1. Register your first admin user');
    console.log('2. Seed demo data (optional)');
    console.log('3. Start using the application!');
    
  } catch (error) {
    console.error('❌ Setup verification failed:', error.message);
    console.log('\nPlease check:');
    console.log('1. Your .env file has correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    console.log('2. You ran the SQL schema in Supabase SQL Editor');
    console.log('3. You created the "uploads" storage bucket');
    console.log('4. Your Supabase project is active');
  }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  verifySupabaseSetup();
}

export { verifySupabaseSetup };