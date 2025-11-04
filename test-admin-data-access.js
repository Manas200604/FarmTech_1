// Test script to check admin data access
console.log('🔍 Testing admin data access...');

// Test 1: Check if we can access uploads
console.log('\n📤 Testing uploads access...');
try {
  const localUploads = JSON.parse(localStorage.getItem('farmtech_uploads') || '[]');
  console.log(`Local uploads found: ${localUploads.length}`);
  
  if (localUploads.length > 0) {
    console.log('Sample upload:', localUploads[0]);
  }
} catch (error) {
  console.error('Error accessing local uploads:', error);
}

// Test 2: Check if we can access orders
console.log('\n📋 Testing orders access...');
try {
  const localOrders = JSON.parse(localStorage.getItem('farmtech_orders') || '[]');
  console.log(`Local orders found: ${localOrders.length}`);
  
  if (localOrders.length > 0) {
    console.log('Sample order:', localOrders[0]);
  }
} catch (error) {
  console.error('Error accessing local orders:', error);
}

// Test 3: Check admin authentication
console.log('\n🛡️ Testing admin authentication...');
const isAdmin = sessionStorage.getItem('isAdmin');
const adminLoginTime = sessionStorage.getItem('adminLoginTime');
console.log('Admin authenticated:', isAdmin === 'true');
console.log('Login time:', adminLoginTime);

// Test 4: Check environment variables
console.log('\n🔧 Environment check...');
console.log('Admin email set:', !!import.meta.env.VITE_ADMIN_EMAIL);
console.log('Admin password set:', !!import.meta.env.VITE_ADMIN_PASSWORD);
console.log('Supabase URL set:', !!import.meta.env.VITE_SUPABASE_URL);

console.log('\n✅ Admin data access test completed!');