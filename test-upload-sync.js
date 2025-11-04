// Quick test to verify upload synchronization
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUploadSync() {
  console.log('🔍 Testing upload synchronization...');
  
  try {
    // Check uploads table (for admin)
    const { data: uploads, error: uploadsError } = await supabase
      .from('uploads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (uploadsError) {
      console.error('❌ Error fetching uploads:', uploadsError);
    } else {
      console.log(`✅ Found ${uploads.length} uploads in admin table`);
      uploads.forEach((upload, index) => {
        console.log(`  ${index + 1}. ${upload.crop_type} - ${upload.status} (${upload.created_at})`);
      });
    }
    
    // Check user_uploads table (for farmer history)
    const { data: userUploads, error: userUploadsError } = await supabase
      .from('user_uploads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (userUploadsError) {
      console.error('❌ Error fetching user uploads:', userUploadsError);
    } else {
      console.log(`✅ Found ${userUploads.length} uploads in user history table`);
      userUploads.forEach((upload, index) => {
        console.log(`  ${index + 1}. ${upload.crop_type} - ${upload.status} (${upload.created_at})`);
      });
    }
    
    console.log('\n📊 Upload sync test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testUploadSync();