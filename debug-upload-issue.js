// Debug script to check upload and order issues
console.log('🔍 Debugging upload and order issues...');

// Check if we can access environment variables
console.log('Environment check:');
console.log('- VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'Set' : 'Missing');
console.log('- VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing');

// Check local storage for uploads (fallback storage)
const localUploads = JSON.parse(localStorage.getItem('farmtech_uploads') || '[]');
console.log(`\n📦 Local uploads found: ${localUploads.length}`);

if (localUploads.length > 0) {
  console.log('Recent local uploads:');
  localUploads.slice(-3).forEach((upload, index) => {
    console.log(`  ${index + 1}. ${upload.crop_type} - ${upload.status} (${upload.created_at || 'No date'})`);
  });
}

// Check for orders in local storage
const localOrders = JSON.parse(localStorage.getItem('farmtech_orders') || '[]');
console.log(`\n📋 Local orders found: ${localOrders.length}`);

if (localOrders.length > 0) {
  console.log('Recent local orders:');
  localOrders.slice(-3).forEach((order, index) => {
    console.log(`  ${index + 1}. ${order.farmer_name || 'Unknown'} - ${order.status} - TxnID: ${order.transaction_id || 'Missing'}`);
  });
}

console.log('\n🔧 Potential Issues:');
console.log('1. Database connection might be failing');
console.log('2. Table structure might be missing required columns');
console.log('3. User authentication might not be working properly');
console.log('4. Transaction ID might not be saved during order creation');

console.log('\n✅ Next Steps:');
console.log('1. Check if Supabase tables exist: uploads, user_uploads, orders');
console.log('2. Verify table columns include: transaction_id, user_id, status');
console.log('3. Test database connection in browser console');
console.log('4. Check if orders are saving transaction_id field');