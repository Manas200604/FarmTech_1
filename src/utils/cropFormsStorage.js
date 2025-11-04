/**
 * Crop Forms Storage Utilities
 * Handles storage and retrieval of farmer crop form submissions
 */

const CROP_FORMS_STORAGE_KEY = 'farmtech_crop_forms';

class CropFormsStorage {
  constructor() {
    this.forms = this.loadForms();
  }

  // Load all crop forms from localStorage
  loadForms() {
    try {
      const stored = localStorage.getItem(CROP_FORMS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading crop forms:', error);
      return [];
    }
  }

  // Save forms to localStorage
  saveForms() {
    try {
      localStorage.setItem(CROP_FORMS_STORAGE_KEY, JSON.stringify(this.forms));
      return true;
    } catch (error) {
      console.error('Error saving crop forms:', error);
      return false;
    }
  }

  // Add new crop form submission
  addCropForm(formData) {
    const cropForm = {
      id: `crop_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      farmerName: formData.farmerName,
      farmerId: formData.farmerId,
      phoneNumber: formData.phoneNumber,
      location: formData.location,
      cropType: formData.cropType,
      landSize: formData.landSize,
      expectedYield: formData.expectedYield,
      plantingDate: formData.plantingDate,
      harvestDate: formData.harvestDate,
      cropImages: formData.cropImages || [], // Array of base64 images
      description: formData.description,
      requirements: formData.requirements,
      submittedAt: new Date().toISOString(),
      status: 'pending', // pending, approved, rejected
      reviewedAt: null,
      reviewedBy: null,
      adminNotes: ''
    };

    this.forms.unshift(cropForm); // Add to beginning of array
    this.saveForms();
    return cropForm;
  }

  // Get all crop forms
  getAllForms() {
    return [...this.forms];
  }

  // Get form by ID
  getFormById(id) {
    return this.forms.find(form => form.id === id);
  }

  // Update form status (for admin)
  updateFormStatus(id, status, reviewedBy, adminNotes = '') {
    const formIndex = this.forms.findIndex(form => form.id === id);
    if (formIndex === -1) {
      throw new Error('Crop form not found');
    }

    this.forms[formIndex] = {
      ...this.forms[formIndex],
      status,
      reviewedAt: new Date().toISOString(),
      reviewedBy,
      adminNotes
    };

    this.saveForms();
    return this.forms[formIndex];
  }

  // Delete crop form
  deleteCropForm(id) {
    const initialLength = this.forms.length;
    this.forms = this.forms.filter(form => form.id !== id);
    
    if (this.forms.length < initialLength) {
      this.saveForms();
      return true;
    }
    return false;
  }

  // Get forms by status
  getFormsByStatus(status) {
    return this.forms.filter(form => form.status === status);
  }

  // Get forms by farmer
  getFormsByFarmer(farmerId) {
    return this.forms.filter(form => form.farmerId === farmerId);
  }

  // Get form statistics
  getStatistics() {
    const total = this.forms.length;
    const pending = this.forms.filter(f => f.status === 'pending').length;
    const approved = this.forms.filter(f => f.status === 'approved').length;
    const rejected = this.forms.filter(f => f.status === 'rejected').length;

    return {
      total,
      pending,
      approved,
      rejected
    };
  }

  // Bulk delete forms
  bulkDeleteForms(formIds) {
    const initialLength = this.forms.length;
    this.forms = this.forms.filter(form => !formIds.includes(form.id));
    
    if (this.forms.length < initialLength) {
      this.saveForms();
      return initialLength - this.forms.length; // Return number of deleted forms
    }
    return 0;
  }

  // Search forms
  searchForms(query) {
    const searchTerm = query.toLowerCase();
    return this.forms.filter(form => 
      form.farmerName.toLowerCase().includes(searchTerm) ||
      form.cropType.toLowerCase().includes(searchTerm) ||
      form.location.toLowerCase().includes(searchTerm) ||
      form.description.toLowerCase().includes(searchTerm)
    );
  }
}

// Create singleton instance
const cropFormsStorage = new CropFormsStorage();

export default cropFormsStorage;
export { CropFormsStorage };