/**
 * Uploads Storage Utilities
 * Handles storage and management of user uploads (images, documents, etc.)
 */

const UPLOADS_STORAGE_KEY = 'farmtech_uploads';

class UploadsStorage {
  constructor() {
    this.uploads = this.loadUploads();
  }

  // Load all uploads from localStorage
  loadUploads() {
    try {
      const stored = localStorage.getItem(UPLOADS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading uploads:', error);
      return [];
    }
  }

  // Save uploads to localStorage
  saveUploads() {
    try {
      localStorage.setItem(UPLOADS_STORAGE_KEY, JSON.stringify(this.uploads));
      return true;
    } catch (error) {
      console.error('Error saving uploads:', error);
      return false;
    }
  }

  // Add new upload
  addUpload(uploadData) {
    const upload = {
      id: `upload_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      fileName: uploadData.fileName,
      fileType: uploadData.fileType,
      fileSize: uploadData.fileSize,
      fileData: uploadData.fileData, // base64 encoded file
      uploadedBy: uploadData.uploadedBy,
      uploaderName: uploadData.uploaderName,
      uploaderRole: uploadData.uploaderRole || 'farmer',
      category: uploadData.category || 'general', // general, crop, payment, document
      description: uploadData.description || '',
      tags: uploadData.tags || [],
      uploadedAt: new Date().toISOString(),
      isPublic: uploadData.isPublic || false,
      status: 'active', // active, archived, deleted
      downloadCount: 0,
      lastAccessed: new Date().toISOString()
    };

    this.uploads.unshift(upload); // Add to beginning of array
    this.saveUploads();
    return upload;
  }

  // Get all uploads
  getAllUploads() {
    return [...this.uploads.filter(upload => upload.status === 'active')];
  }

  // Get upload by ID
  getUploadById(id) {
    return this.uploads.find(upload => upload.id === id && upload.status === 'active');
  }

  // Get uploads by user
  getUploadsByUser(userId) {
    return this.uploads.filter(upload => 
      upload.uploadedBy === userId && upload.status === 'active'
    );
  }

  // Get uploads by category
  getUploadsByCategory(category) {
    return this.uploads.filter(upload => 
      upload.category === category && upload.status === 'active'
    );
  }

  // Update upload
  updateUpload(id, updateData) {
    const uploadIndex = this.uploads.findIndex(upload => upload.id === id);
    if (uploadIndex === -1) {
      throw new Error('Upload not found');
    }

    this.uploads[uploadIndex] = {
      ...this.uploads[uploadIndex],
      ...updateData,
      lastModified: new Date().toISOString()
    };

    this.saveUploads();
    return this.uploads[uploadIndex];
  }

  // Delete upload (soft delete)
  deleteUpload(id, deletedBy) {
    const uploadIndex = this.uploads.findIndex(upload => upload.id === id);
    if (uploadIndex === -1) {
      throw new Error('Upload not found');
    }

    this.uploads[uploadIndex] = {
      ...this.uploads[uploadIndex],
      status: 'deleted',
      deletedAt: new Date().toISOString(),
      deletedBy: deletedBy
    };

    this.saveUploads();
    return true;
  }

  // Permanently delete upload
  permanentlyDeleteUpload(id) {
    const initialLength = this.uploads.length;
    this.uploads = this.uploads.filter(upload => upload.id !== id);
    
    if (this.uploads.length < initialLength) {
      this.saveUploads();
      return true;
    }
    return false;
  }

  // Bulk delete uploads
  bulkDeleteUploads(uploadIds, deletedBy) {
    let deletedCount = 0;
    uploadIds.forEach(id => {
      const uploadIndex = this.uploads.findIndex(upload => upload.id === id);
      if (uploadIndex !== -1) {
        this.uploads[uploadIndex] = {
          ...this.uploads[uploadIndex],
          status: 'deleted',
          deletedAt: new Date().toISOString(),
          deletedBy: deletedBy
        };
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      this.saveUploads();
    }
    return deletedCount;
  }

  // Restore deleted upload
  restoreUpload(id) {
    const uploadIndex = this.uploads.findIndex(upload => upload.id === id);
    if (uploadIndex === -1) {
      throw new Error('Upload not found');
    }

    this.uploads[uploadIndex] = {
      ...this.uploads[uploadIndex],
      status: 'active',
      restoredAt: new Date().toISOString()
    };

    this.saveUploads();
    return this.uploads[uploadIndex];
  }

  // Get deleted uploads (for admin recovery)
  getDeletedUploads() {
    return this.uploads.filter(upload => upload.status === 'deleted');
  }

  // Search uploads
  searchUploads(query, userId = null) {
    const searchTerm = query.toLowerCase();
    let uploads = this.uploads.filter(upload => upload.status === 'active');
    
    if (userId) {
      uploads = uploads.filter(upload => upload.uploadedBy === userId);
    }

    return uploads.filter(upload => 
      upload.fileName.toLowerCase().includes(searchTerm) ||
      upload.description.toLowerCase().includes(searchTerm) ||
      upload.category.toLowerCase().includes(searchTerm) ||
      upload.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  // Get upload statistics
  getStatistics(userId = null) {
    let uploads = this.uploads;
    
    if (userId) {
      uploads = uploads.filter(upload => upload.uploadedBy === userId);
    }

    const active = uploads.filter(u => u.status === 'active').length;
    const deleted = uploads.filter(u => u.status === 'deleted').length;
    const totalSize = uploads
      .filter(u => u.status === 'active')
      .reduce((sum, u) => sum + (u.fileSize || 0), 0);

    const categories = {};
    uploads.filter(u => u.status === 'active').forEach(upload => {
      categories[upload.category] = (categories[upload.category] || 0) + 1;
    });

    return {
      total: active,
      deleted,
      totalSize,
      categories
    };
  }

  // Increment download count
  incrementDownloadCount(id) {
    const uploadIndex = this.uploads.findIndex(upload => upload.id === id);
    if (uploadIndex !== -1) {
      this.uploads[uploadIndex].downloadCount = (this.uploads[uploadIndex].downloadCount || 0) + 1;
      this.uploads[uploadIndex].lastAccessed = new Date().toISOString();
      this.saveUploads();
    }
  }

  // Clean up old deleted uploads (older than 30 days)
  cleanupDeletedUploads() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const initialLength = this.uploads.length;
    this.uploads = this.uploads.filter(upload => {
      if (upload.status === 'deleted' && upload.deletedAt) {
        const deletedDate = new Date(upload.deletedAt);
        return deletedDate > thirtyDaysAgo;
      }
      return true;
    });

    if (this.uploads.length < initialLength) {
      this.saveUploads();
      return initialLength - this.uploads.length;
    }
    return 0;
  }
}

// Create singleton instance
const uploadsStorage = new UploadsStorage();

export default uploadsStorage;
export { UploadsStorage };