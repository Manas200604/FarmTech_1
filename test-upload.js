// Firebase Storage Upload Test Script
// Run this in browser console to test upload functionality

async function testFirebaseUpload() {
  console.log('🧪 Testing Firebase Storage Upload...');
  
  try {
    // Check if Firebase is loaded
    if (typeof firebase === 'undefined') {
      console.error('❌ Firebase not loaded');
      return;
    }
    
    // Check authentication
    const user = firebase.auth().currentUser;
    if (!user) {
      console.error('❌ User not authenticated');
      return;
    }
    
    console.log('✅ User authenticated:', user.uid);
    
    // Create a test blob (1x1 pixel PNG)
    const testBlob = new Blob([
      new Uint8Array([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
        0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
        0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
        0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
        0xE2, 0x21, 0xBC, 0x33, 0x00, 0x00, 0x00, 0x00,
        0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ])
    ], { type: 'image/png' });
    
    console.log('📁 Created test image blob');
    
    // Test upload
    const storageRef = firebase.storage().ref();
    const uploadRef = storageRef.child(`uploads/${user.uid}/test-${Date.now()}.png`);
    
    console.log('⬆️ Starting upload...');
    const snapshot = await uploadRef.put(testBlob);
    
    console.log('✅ Upload successful!');
    console.log('📊 Upload details:', {
      bytesTransferred: snapshot.bytesTransferred,
      totalBytes: snapshot.totalBytes,
      state: snapshot.state
    });
    
    // Get download URL
    const downloadURL = await snapshot.ref.getDownloadURL();
    console.log('🔗 Download URL:', downloadURL);
    
    // Test download
    const response = await fetch(downloadURL);
    if (response.ok) {
      console.log('✅ Download test successful!');
    } else {
      console.error('❌ Download test failed:', response.status);
    }
    
    console.log('🎉 All tests passed! Upload functionality is working.');
    
  } catch (error) {
    console.error('❌ Upload test failed:', error);
    
    if (error.code) {
      switch (error.code) {
        case 'storage/unauthorized':
          console.error('💡 Fix: Check Firebase Storage rules');
          break;
        case 'storage/canceled':
          console.error('💡 Fix: Upload was canceled');
          break;
        case 'storage/unknown':
          console.error('💡 Fix: Check CORS configuration');
          break;
        default:
          console.error('💡 Error code:', error.code);
      }
    }
  }
}

// Run the test
testFirebaseUpload();