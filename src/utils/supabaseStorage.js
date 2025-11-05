import { supabase } from '../supabase/client';
import toast from 'react-hot-toast';

const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'uploads';

export class SupabaseStorageManager {
  constructor() {
    this.bucket = STORAGE_BUCKET;
  }

  /**
   * Upload a file to Supabase Storage
   * @param {File} file - The file to upload
   * @param {string} userId - The user ID for organizing files
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Upload result with public URL
   */
  async uploadFile(file, userId, options = {}) {
    try {
      if (!file) {
        throw new Error('No file provided');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}_${randomString}.${fileExtension}`;
      
      // Create file path with user organization
      const filePath = `${userId}/${fileName}`;

      console.log('Uploading file to Supabase Storage:', {
        bucket: this.bucket,
        filePath,
        fileSize: file.size,
        fileType: file.type
      });

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          ...options
        });

      if (error) {
        console.error('Supabase Storage upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.bucket)
        .getPublicUrl(filePath);

      const result = {
        success: true,
        data: {
          path: data.path,
          fullPath: data.fullPath,
          id: data.id,
          publicUrl: publicUrl,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          storagePath: filePath
        }
      };

      console.log('File uploaded successfully:', result);
      return result;

    } catch (error) {
      console.error('Upload failed:', error);
      const errorResult = {
        success: false,
        error: error.message || 'Upload failed'
      };
      
      toast.error(`Upload failed: ${error.message}`);
      return errorResult;
    }
  }

  /**
   * Delete a file from Supabase Storage
   * @param {string} filePath - The path of the file to delete
   * @returns {Promise<Object>} Delete result
   */
  async deleteFile(filePath) {
    try {
      console.log('Deleting file from Supabase Storage:', filePath);

      const { data, error } = await supabase.storage
        .from(this.bucket)
        .remove([filePath]);

      if (error) {
        console.error('Supabase Storage delete error:', error);
        throw error;
      }

      console.log('File deleted successfully:', data);
      return {
        success: true,
        data: data
      };

    } catch (error) {
      console.error('Delete failed:', error);
      return {
        success: false,
        error: error.message || 'Delete failed'
      };
    }
  }

  /**
   * Get public URL for a file
   * @param {string} filePath - The path of the file
   * @returns {string} Public URL
   */
  getPublicUrl(filePath) {
    const { data: { publicUrl } } = supabase.storage
      .from(this.bucket)
      .getPublicUrl(filePath);
    
    return publicUrl;
  }

  /**
   * List files for a user
   * @param {string} userId - The user ID
   * @returns {Promise<Array>} List of files
   */
  async listUserFiles(userId) {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucket)
        .list(userId, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('List files error:', error);
        throw error;
      }

      return {
        success: true,
        files: data || []
      };

    } catch (error) {
      console.error('List files failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to list files'
      };
    }
  }

  /**
   * Get file metadata
   * @param {string} filePath - The path of the file
   * @returns {Promise<Object>} File metadata
   */
  async getFileMetadata(filePath) {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucket)
        .list('', {
          search: filePath
        });

      if (error) {
        throw error;
      }

      const file = data.find(f => f.name === filePath.split('/').pop());
      
      return {
        success: true,
        metadata: file || null
      };

    } catch (error) {
      console.error('Get metadata failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to get metadata'
      };
    }
  }

  /**
   * Create a signed URL for temporary access
   * @param {string} filePath - The path of the file
   * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
   * @returns {Promise<Object>} Signed URL result
   */
  async createSignedUrl(filePath, expiresIn = 3600) {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucket)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        throw error;
      }

      return {
        success: true,
        signedUrl: data.signedUrl
      };

    } catch (error) {
      console.error('Create signed URL failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to create signed URL'
      };
    }
  }
}

// Create singleton instance
export const supabaseStorage = new SupabaseStorageManager();

// Helper functions for backward compatibility
export const uploadToSupabase = (file, userId, options) => {
  return supabaseStorage.uploadFile(file, userId, options);
};

export const deleteFromSupabase = (filePath) => {
  return supabaseStorage.deleteFile(filePath);
};

export const getSupabasePublicUrl = (filePath) => {
  return supabaseStorage.getPublicUrl(filePath);
};

export default supabaseStorage;