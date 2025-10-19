// Test Supabase Connection
// Run this in your browser console at http://localhost:3000

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n');
  
  try {
    // Import supabase client
    const { supabase } = await import('./src/supabase/client.js');
    
    // Test 1: Basic connection
    console.log('1. Testing basic connection...');
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
    console.log('✅ Connection successful!');
    
    // Test 2: Check all tables
    console.log('\n2. Checking database tables...');
    const tables = ['users', 'uploads', 'schemes', 'contacts', 'pesticides', 'stats'];
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('*', { head: true, count: 'exact' });
        if (error) throw error;
        console.log(`✅ Table '${table}' exists and accessible`);
      } catch (err) {
        console.log(`❌ Table '${table}' issue:`, err.message);
        return false;
      }
    }
    
    // Test 3: Check storage
    console.log('\n3. Testing storage bucket...');
    try {
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      if (bucketError) throw bucketError;
      
      const uploadsBucket = buckets.find(bucket => bucket.name === 'uploads');
      if (!uploadsBucket) {
        console.log('❌ Storage bucket "uploads" not found');
        return false;
      }
      console.log('✅ Storage bucket "uploads" exists and accessible');
    } catch (err) {
      console.log('❌ Storage test failed:', err.message);
      return false;
    }
    
    console.log('\n🎉 All tests passed! Your Supabase setup is working perfectly.');
    console.log('\nYou can now:');
    console.log('1. Register a new user account');
    console.log('2. Test the login functionality');
    console.log('3. Upload images and test features');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure you ran the SQL schema in Supabase');
    console.log('2. Check that the uploads bucket exists and is public');
    console.log('3. Verify your environment variables are correct');
    return false;
  }
}

// Run the test
testSupabaseConnection();