/**
 * Material Model
 * Represents agricultural materials/products available for purchase
 */

export class Material {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.name = data.name || { en: '', mr: '', hi: '' };
    this.description = data.description || { en: '', mr: '', hi: '' };
    this.price = data.price || 0;
    this.marketPrice = data.marketPrice || data.price || 0;
    this.unit = data.unit || '';
    this.available = data.available !== undefined ? data.available : true;
    this.stock = data.stock || 0;
    this.category = data.category || ''; // 'pesticides' | 'tools'
    this.subCategory = data.subCategory || ''; // insecticides, herbicides, hand-tools, power-tools, etc.
    this.brand = data.brand || '';
    this.specifications = data.specifications || {};
    this.imageUrl = data.imageUrl || '';
    this.images = data.images || []; // multiple product images
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.createdBy = data.createdBy || '';
  }

  generateId() {
    return 'material_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
  }

  // Get localized name based on language
  getLocalizedName(language = 'en') {
    if (typeof this.name === 'string') {
      return this.name; // Backward compatibility
    }
    if (typeof this.name === 'object' && this.name !== null) {
      return this.name[language] || this.name.en || '';
    }
    return '';
  }

  // Get localized description based on language
  getLocalizedDescription(language = 'en') {
    if (typeof this.description === 'string') {
      return this.description; // Backward compatibility
    }
    if (typeof this.description === 'object' && this.description !== null) {
      return this.description[language] || this.description.en || '';
    }
    return '';
  }

  // Update material details
  update(data) {
    Object.keys(data).forEach(key => {
      if (key !== 'id' && key !== 'createdAt') {
        this[key] = data[key];
      }
    });
    this.updatedAt = new Date();
    return this;
  }

  // Check if material is in stock
  isInStock() {
    return this.available && this.stock > 0;
  }

  // Reduce stock when ordered
  reduceStock(quantity) {
    if (this.stock >= quantity) {
      this.stock -= quantity;
      this.updatedAt = new Date();
      return true;
    }
    return false;
  }

  // Increase stock when restocked
  increaseStock(quantity) {
    this.stock += quantity;
    this.updatedAt = new Date();
  }

  // Get category display name
  getCategoryDisplayName(language = 'en') {
    const categoryNames = {
      pesticides: { en: 'Pesticides', mr: 'कीटकनाशके', hi: 'कीटनाशक' },
      tools: { en: 'Agricultural Tools', mr: 'कृषी साधने', hi: 'कृषि उपकरण' }
    };
    return categoryNames[this.category]?.[language] || this.category;
  }

  // Get subcategory display name
  getSubCategoryDisplayName(language = 'en') {
    const subCategoryNames = {
      insecticides: { en: 'Insecticides', mr: 'कीटकनाशके', hi: 'कीटनाशक' },
      herbicides: { en: 'Herbicides', mr: 'तणनाशके', hi: 'खरपतवारनाशी' },
      fungicides: { en: 'Fungicides', mr: 'बुरशीनाशके', hi: 'फफूंदनाशी' },
      fertilizers: { en: 'Fertilizers', mr: 'खते', hi: 'उर्वरक' },
      'hand-tools': { en: 'Hand Tools', mr: 'हाताची साधने', hi: 'हाथ के औजार' },
      'power-tools': { en: 'Power Tools', mr: 'विद्युत साधने', hi: 'विद्युत उपकरण' },
      'irrigation': { en: 'Irrigation Equipment', mr: 'सिंचन उपकरणे', hi: 'सिंचाई उपकरण' },
      'harvesting': { en: 'Harvesting Tools', mr: 'कापणी साधने', hi: 'कटाई के औजार' }
    };
    return subCategoryNames[this.subCategory]?.[language] || this.subCategory;
  }

  // Get specifications for display
  getSpecifications(language = 'en') {
    const specs = { ...this.specifications };
    
    // Localize safety and usage instructions
    if (specs.safetyInstructions && typeof specs.safetyInstructions === 'object') {
      specs.safetyInstructions = specs.safetyInstructions[language] || specs.safetyInstructions.en || '';
    }
    
    if (specs.usageInstructions && typeof specs.usageInstructions === 'object') {
      specs.usageInstructions = specs.usageInstructions[language] || specs.usageInstructions.en || '';
    }
    
    return specs;
  }

  // Check if this is a pesticide
  isPesticide() {
    return this.category === 'pesticides';
  }

  // Check if this is a tool
  isTool() {
    return this.category === 'tools';
  }

  // Convert to plain object for storage
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price,
      marketPrice: this.marketPrice,
      unit: this.unit,
      available: this.available,
      stock: this.stock,
      category: this.category,
      subCategory: this.subCategory,
      brand: this.brand,
      specifications: this.specifications,
      imageUrl: this.imageUrl,
      images: this.images,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      createdBy: this.createdBy
    };
  }

  // Create from plain object
  static fromJSON(data) {
    return new Material(data);
  }

  // Validate material data
  validate() {
    const errors = [];

    if (!this.name || (typeof this.name === 'object' && !this.name.en)) {
      errors.push('Material name is required');
    }

    if (this.price < 0) {
      errors.push('Price cannot be negative');
    }

    if (!this.unit) {
      errors.push('Unit is required');
    }

    if (this.stock < 0) {
      errors.push('Stock cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default Material;