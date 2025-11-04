// Mock storage service for development when RLS policies block uploads
export const mockStorageService = {
  async uploadFile(file, userId) {
    // Simulate upload delay for realistic UX
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Convert the actual file to base64 for reliable display
    const base64Url = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
    
    console.log('Mock storage: Created base64 URL for', file.name);
    
    // Return structure matching Supabase storage response
    return {
      data: {
        path: `user_${userId}/${Date.now()}_${file.name}`,
        fullPath: base64Url, // Use actual base64 data
        id: `mock_${Date.now()}`,
        bucket_id: 'uploads'
      },
      error: null
    };
  },

  async getPublicUrl(path) {
    // This method is not used in our implementation since we return the base64 URL directly
    // But keeping it for compatibility
    return {
      data: {
        publicUrl: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNGFkZTgwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNyb3AgSW1hZ2U8L3RleHQ+PC9zdmc+`
      }
    };
  },

  // Simulate successful operations
  async deleteFile(path) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { data: null, error: null };
  }
};