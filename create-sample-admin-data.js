// Create sample data for admin testing
console.log('🔧 Creating sample admin data...');

// Create sample uploads
const sampleUploads = [
  {
    id: 'upload_1',
    user_id: 'farmer_1',
    user_name: 'John Farmer',
    user_email: 'john@farmer.com',
    description: 'Wheat crop showing yellow spots on leaves',
    crop_type: 'Wheat',
    status: 'pending',
    image_url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
    created_at: new Date().toISOString()
  },
  {
    id: 'upload_2',
    user_id: 'farmer_2',
    user_name: 'Mary Farmer',
    user_email: 'mary@farmer.com',
    description: 'Rice crop needs fertilizer recommendation',
    crop_type: 'Rice',
    status: 'pending',
    image_url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
    created_at: new Date().toISOString()
  }
];

// Create sample orders
const sampleOrders = [
  {
    id: 'ORD-1234567890-ABC',
    user_id: 'farmer_1',
    farmer_name: 'John Farmer',
    farmer_email: 'john@farmer.com',
    farmer_phone: '+1234567890',
    crop_type: 'Wheat',
    farm_location: 'Punjab, India',
    order_type: 'online',
    order_date: new Date().toISOString(),
    status: 'payment_submitted',
    total_amount: 2500,
    transaction_id: 'TXN123456789',
    payment_method: 'upi',
    items: JSON.stringify([
      { productName: 'Wheat Seeds', quantity: 10, unitPrice: 150, subtotal: 1500 },
      { productName: 'Fertilizer', quantity: 5, unitPrice: 200, subtotal: 1000 }
    ])
  },
  {
    id: 'ORD-1234567891-DEF',
    user_id: 'farmer_2',
    farmer_name: 'Mary Farmer',
    farmer_email: 'mary@farmer.com',
    farmer_phone: '+1234567891',
    crop_type: 'Rice',
    farm_location: 'Tamil Nadu, India',
    order_type: 'online',
    order_date: new Date().toISOString(),
    status: 'confirmed',
    total_amount: 3200,
    transaction_id: 'TXN987654321',
    payment_method: 'upi',
    items: JSON.stringify([
      { productName: 'Rice Seeds', quantity: 15, unitPrice: 120, subtotal: 1800 },
      { productName: 'Pesticide', quantity: 7, unitPrice: 200, subtotal: 1400 }
    ])
  }
];

// Save to localStorage
try {
  localStorage.setItem('farmtech_uploads', JSON.stringify(sampleUploads));
  localStorage.setItem('farmtech_orders', JSON.stringify(sampleOrders));
  
  console.log('✅ Sample uploads created:', sampleUploads.length);
  console.log('✅ Sample orders created:', sampleOrders.length);
  console.log('\n📋 Sample Order Details:');
  sampleOrders.forEach((order, index) => {
    console.log(`${index + 1}. ${order.farmer_name} - ${order.crop_type} - ₹${order.total_amount} - TxnID: ${order.transaction_id}`);
  });
  
  console.log('\n📤 Sample Upload Details:');
  sampleUploads.forEach((upload, index) => {
    console.log(`${index + 1}. ${upload.user_name} - ${upload.crop_type} - ${upload.status}`);
  });
  
  console.log('\n🎉 Sample data created successfully!');
  console.log('Now you can test the admin panel with this data.');
  
} catch (error) {
  console.error('❌ Error creating sample data:', error);
}