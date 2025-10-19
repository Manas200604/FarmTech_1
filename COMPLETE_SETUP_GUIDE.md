# 🔥 Complete Firebase Storage CORS Setup Guide

## 🚀 Quick Setup (Choose One Method)

### Method 1: Automatic Setup (Recommended)

#### Step 1: Install Google Cloud SDK
```powershell
# Download and run installer
Invoke-WebRequest -Uri "https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe" -OutFile "$env:TEMP\GoogleCloudSDKInstaller.exe"
Start-Process "$env:TEMP\GoogleCloudSDKInstaller.exe" -Wait
```

#### Step 2: Setup Authentication
```bash
# Restart terminal, then run:
gcloud auth login
gcloud config set project farmtech-da3df
```

#### Step 3: Apply CORS Settings
```bash
# Run our setup script
node setup-firebase-storage.cjs
```

### Method 2: Manual Firebase Console Setup

#### Step 1: Firebase Console
1. Go to: https://console.firebase.google.com/project/farmtech-da3df/storage/rules
2. Update Storage Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /uploads/{userId}/{allPaths=**} {
      allow write: if request.auth != null && 
        request.auth.uid == userId &&
        request.resource.size < 10 * 1024 * 1024;
      allow read: if request.auth != null && 
        (request.auth.uid == userId || isAdmin());
    }

    function isAdmin() {
      return firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

#### Step 2: Google Cloud Console CORS
1. Go to: https://console.cloud.google.com/storage/browser/farmtech-da3df.appspot.com
2. Click "Edit bucket details"
3. Add CORS configuration:

```json
[
  {
    "origin": ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173", "https://farmtech-da3df.web.app"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Content-Length", "x-goog-meta-*"]
  }
]
```

## 🔧 Alternative: Code-Based Solution

### Update Upload Component
Add better error handling and CORS management:

```javascript
// src/components/upload/UploadModal.jsx - Enhanced version
const handleSubmit = async (e) => {
  e.preventDefault();
  setUploading(true);
  
  try {
    // Validate user and file
    if (!userProfile?.id) throw new Error('User not authenticated');
    if (!selectedFile) throw new Error('No file selected');
    
    // Compress large images
    let fileToUpload = selectedFile;
    if (selectedFile.size > 2 * 1024 * 1024) {
      fileToUpload = await compressImage(selectedFile);
    }
    
    // Create storage reference
    const fileName = `${Date.now()}_${fileToUpload.name}`;
    const storageRef = ref(storage, `uploads/${userProfile.id}/${fileName}`);
    
    // Upload with progress tracking
    const uploadTask = uploadBytesResumable(storageRef, fileToUpload, {
      contentType: fileToUpload.type,
      customMetadata: {
        originalName: selectedFile.name,
        uploadedBy: userProfile.id,
        uploadedAt: new Date().toISOString()
      }
    });
    
    // Monitor progress
    const uploadPromise = new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        },
        (error) => {
          console.error('Upload error:', error);
          
          // Handle specific errors
          if (error.code === 'storage/unauthorized') {
            reject(new Error('Upload permission denied. Please check Firebase Storage rules.'));
          } else if (error.code === 'storage/canceled') {
            reject(new Error('Upload was canceled.'));
          } else if (error.code === 'storage/quota-exceeded') {
            reject(new Error('Storage quota exceeded.'));
          } else if (error.message?.includes('CORS')) {
            reject(new Error('CORS error. Please configure Firebase Storage CORS settings.'));
          } else {
            reject(error);
          }
        },
        async () => {
          try {
            const imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(imageUrl);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
    
    const imageUrl = await uploadPromise;
    
    // Save to Firestore
    const uploadData = {
      userId: userProfile.id,
      imageUrl,
      description: formData.description.trim(),
      cropType: formData.cropType,
      location: formData.location.trim(),
      status: 'pending',
      createdAt: Timestamp.now(),
      metadata: {
        fileSize: fileToUpload.size,
        fileName: fileToUpload.name,
        contentType: fileToUpload.type,
        originalSize: selectedFile.size
      }
    };
    
    await addDoc(collection(db, 'uploads'), uploadData);
    
    toast.success('Image uploaded successfully!');
    onClose();
    
    // Reset form
    setSelectedFile(null);
    setPreview(null);
    setUploadProgress(0);
    setFormData({
      description: '',
      cropType: '',
      location: userProfile?.farmDetails?.location || ''
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    toast.error(error.message || 'Failed to upload image. Please try again.');
  } finally {
    setUploading(false);
    setUploadProgress(0);
  }
};
```

## 🧪 Testing Upload Functionality

### Browser Console Test
```javascript
// Test Firebase Storage access
async function testStorageAccess() {
  try {
    const response = await fetch('https://firebasestorage.googleapis.com/v0/b/farmtech-da3df.appspot.com/o', {
      method: 'GET',
      mode: 'cors'
    });
    console.log('✅ Storage access test passed:', response.status);
  } catch (error) {
    console.error('❌ Storage access test failed:', error);
  }
}

testStorageAccess();
```

### Upload Test
```javascript
// Test upload functionality (run in browser console when logged in)
async function testUpload() {
  if (!firebase.auth().currentUser) {
    console.error('❌ User not authenticated');
    return;
  }
  
  // Create test blob
  const testBlob = new Blob(['test'], { type: 'text/plain' });
  const storageRef = firebase.storage().ref(`uploads/${firebase.auth().currentUser.uid}/test-${Date.now()}.txt`);
  
  try {
    const snapshot = await storageRef.put(testBlob);
    const url = await snapshot.ref.getDownloadURL();
    console.log('✅ Upload test passed:', url);
  } catch (error) {
    console.error('❌ Upload test failed:', error);
  }
}

testUpload();
```

## 🔍 Troubleshooting

### Common Issues:

1. **CORS Policy Error**
   ```
   Access to fetch at '...' blocked by CORS policy
   ```
   **Solution**: Apply CORS settings using gsutil or Firebase Console

2. **Storage Unauthorized**
   ```
   FirebaseError: Firebase Storage: User does not have permission
   ```
   **Solution**: Check Firebase Storage rules

3. **Network Error**
   ```
   Failed to fetch
   ```
   **Solution**: Check internet connection and Firebase project status

### Debug Steps:
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Try uploading a file
4. Check for error messages
5. Go to Network tab to see failed requests

## ✅ Verification Checklist

After setup:
- [ ] No CORS errors in browser console
- [ ] Images upload successfully
- [ ] Progress bar shows during upload
- [ ] Images display in farmer dashboard
- [ ] Admin can view all uploads
- [ ] File size limits are enforced
- [ ] Only authenticated users can upload

## 🚀 Final Steps

1. **Restart Development Server**
   ```bash
   npm run dev
   ```

2. **Clear Browser Cache**
   - Press Ctrl+Shift+Delete
   - Clear cached images and files

3. **Test Upload**
   - Login as farmer
   - Go to dashboard
   - Click "Upload Photo"
   - Select an image
   - Verify successful upload

4. **Check Admin Dashboard**
   - Login as admin
   - Go to Admin Dashboard → Uploads
   - Verify farmer uploads are visible

## 📞 Support

If issues persist:
1. Check Firebase Console for error logs
2. Verify project permissions
3. Test with different browsers
4. Check network connectivity
5. Review Firebase Storage quotas

---

**Project**: FarmTech Agricultural Platform  
**Last Updated**: December 2024