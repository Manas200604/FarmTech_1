/**
 * Cloudinary Service for FarmTech Image Uploads
 */

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'farmtech';
const CLOUDINARY_API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

export const cloudinaryService = {
  /**
   * Upload image to Cloudinary
   * @param {File} file - Image file to upload
   * @param {string} userId - User ID for organizing uploads
   * @returns {Promise<Object>} Upload result with public URL and metadata
   */
  async uploadImage(file, userId) {
    try {
      console.log('📤 Uploading to Cloudinary...', file.name);
      
      // Try multiple upload strategies
      let formData = new FormData();
      formData.append('file', file);
      
      // Strategy 1: Try with ml_default preset
      formData.append('upload_preset', 'ml_default');
      
      let uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
      
      // Upload to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Cloudinary upload failed: ${errorData.error?.message || response.statusText}`);
      }
      
      const result = await response.json();
      
      console.log('✅ Cloudinary upload successful:', result.public_id);
      console.log('🔗 Image URL:', result.secure_url);
      
      return {
        success: true,
        data: {
          public_id: result.public_id,
          secure_url: result.secure_url,
          url: result.url,
          width: result.width,
          height: result.height,
          format: result.format,
          resource_type: result.resource_type,
          bytes: result.bytes,
          created_at: result.created_at,
          folder: result.folder,
          tags: result.tags,
          context: result.context
        }
      };
      
    } catch (error) {
      console.error('❌ Cloudinary upload failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Get optimized image URL with transformations
   * @param {string} publicId - Cloudinary public ID
   * @param {Object} options - Transformation options
   * @returns {string} Optimized image URL
   */
  getOptimizedUrl(publicId, options = {}) {
    const {
      width = 800,
      height = 600,
      crop = 'fill',
      quality = 'auto',
      format = 'auto'
    } = options;
    
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_${width},h_${height},c_${crop},q_${quality},f_${format}/${publicId}`;
  },

  /**
   * Get thumbnail URL
   * @param {string} publicId - Cloudinary public ID
   * @returns {string} Thumbnail URL
   */
  getThumbnailUrl(publicId) {
    return this.getOptimizedUrl(publicId, {
      width: 300,
      height: 200,
      crop: 'fill',
      quality: 'auto'
    });
  },

  /**
   * Delete image from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteImage(publicId) {
    try {
      console.log('🗑️ Deleting from Cloudinary:', publicId);
      
      // Note: For security, deletion should typically be done from backend
      // This is a simplified client-side implementation
      const timestamp = Math.round(new Date().getTime() / 1000);
      const signature = await this.generateSignature(publicId, timestamp);
      
      const formData = new FormData();
      formData.append('public_id', publicId);
      formData.append('signature', signature);
      formData.append('api_key', CLOUDINARY_API_KEY);
      formData.append('timestamp', timestamp);
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
        {
          method: 'POST',
          body: formData
        }
      );
      
      const result = await response.json();
      
      if (result.result === 'ok') {
        console.log('✅ Image deleted successfully');
        return { success: true };
      } else {
        throw new Error(result.error?.message || 'Deletion failed');
      }
      
    } catch (error) {
      console.error('❌ Cloudinary deletion failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Generate signature for upload authentication
   * Note: In production, this should be done on the backend for security
   * @param {Object} params - Parameters to sign
   * @returns {string} Signature
   */
  async generateUploadSignature(params) {
    // Sort parameters alphabetically
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    // In a real implementation, you would use HMAC-SHA1 with your API secret
    // For demo purposes, we'll use a simple hash
    // WARNING: This is not secure - use backend signature generation in production
    const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET;
    const stringToSign = sortedParams + apiSecret;
    
    // Simple hash for demo (not cryptographically secure)
    let hash = 0;
    for (let i = 0; i < stringToSign.length; i++) {
      const char = stringToSign.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16);
  },

  /**
   * Generate signature for authenticated requests (legacy method)
   * @param {string} publicId - Public ID
   * @param {number} timestamp - Timestamp
   * @returns {string} Signature
   */
  async generateSignature(publicId, timestamp) {
    const params = { public_id: publicId, timestamp: timestamp };
    return this.generateUploadSignature(params);
  }
};

export default cloudinaryService;