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
    
    // Enhanced fields for admin management
    this.priceHistory = data.priceHistory || [];
    this.lowStockThreshold = data.lowStockThreshold || 10;
    this.reorderLevel = data.reorderLevel || 20;
    this.supplier = data.supplier || {
      name: '',
      contact: '',
      email: ''
    };
    this.tags = data.tags || [];
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.seoMetadata = data.seoMetadata || {
      title: '',
      description: '',
      keywords: []
    };
    this.salesCount = data.salesCount || 0;
    this.revenue = data.revenue || 0;
    this.lastSold = data.lastSold || null;
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

  // Update price with history tracking
  updatePrice(newPrice, reason = '', updatedBy = '') {
    if (newPrice !== this.price) {
      // Add to price history
      this.priceHistory.push({
        price: this.price,
        effectiveDate: new Date(),
        updatedBy: updatedBy,
        reason: reason
      });
      
      this.price = newPrice;
      this.updatedAt = new Date();
    }
  }

  // Check if stock is low
  isLowStock() {
    return this.stock <= this.lowStockThreshold;
  }

  // Check if reorder is needed
  needsReorder() {
    return this.stock <= this.reorderLevel;
  }

  // Record a sale
  recordSale(quantity, unitPrice) {
    this.salesCount += quantity;
    this.revenue += (quantity * unitPrice);
    this.lastSold = new Date();
    this.updatedAt = new Date();
  }

  // Get price history
  getPriceHistory() {
    return [...this.priceHistory].sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate));
  }

  // Get current price trend
  getPriceTrend() {
    if (this.priceHistory.length < 2) return 'stable';
    
    const recent = this.priceHistory[this.priceHistory.length - 1];
    const previous = this.priceHistory[this.priceHistory.length - 2];
    
    if (recent.price > previous.price) return 'increasing';
    if (recent.price < previous.price) return 'decreasing';
    return 'stable';
  }

  // Add tag
  addTag(tag) {
    if (tag && !this.tags.includes(tag)) {
      this.tags.push(tag);
      this.updatedAt = new Date();
    }
  }

  // Remove tag
  removeTag(tag) {
    const index = this.tags.indexOf(tag);
    if (index > -1) {
      this.tags.splice(index, 1);
      this.updatedAt = new Date();
    }
  }

  // Update supplier information
  updateSupplier(supplierData) {
    this.supplier = { ...this.supplier, ...supplierData };
    this.updatedAt = new Date();
  }

  // Update SEO metadata
  updateSEOMetadata(seoData) {
    this.seoMetadata = { ...this.seoMetadata, ...seoData };
    this.updatedAt = new Date();
  }

  // Get popularity score (based on sales and revenue)
  getPopularityScore() {
    const salesWeight = 0.6;
    const revenueWeight = 0.4;
    
    // Normalize values (this is a simplified calculation)
    const salesScore = Math.min(this.salesCount / 100, 1) * salesWeight;
    const revenueScore = Math.min(this.revenue / 10000, 1) * revenueWeight;
    
    return (salesScore + revenueScore) * 100;
  }

  // Get stock status
  getStockStatus() {
    if (this.stock === 0) return 'out_of_stock';
    if (this.isLowStock()) return 'low_stock';
    if (this.needsReorder()) return 'reorder_needed';
    return 'in_stock';
  }

  // Get stock status display text
  getStockStatusText(language = 'en') {
    const statusTexts = {
      en: {
        out_of_stock: 'Out of Stock',
        low_stock: 'Low Stock',
        reorder_needed: 'Reorder Needed',
        in_stock: 'In Stock'
      },
      hi: {
        out_of_stock: 'स्टॉक समाप्त',
        low_stock: 'कम स्टॉक',
        reorder_needed: 'पुनः ऑर्डर आवश्यक',
        in_stock: 'स्टॉक में'
      },
      mr: {
        out_of_stock: 'स्टॉक संपला',
        low_stock: 'कमी स्टॉक',
        reorder_needed: 'पुन्हा ऑर्डर आवश्यक',
        in_stock: 'स्टॉकमध्ये'
      }
    };

    const status = this.getStockStatus();
    return statusTexts[language]?.[status] || statusTexts.en[status] || status;
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
      createdBy: this.createdBy,
      priceHistory: this.priceHistory,
      lowStockThreshold: this.lowStockThreshold,
      reorderLevel: this.reorderLevel,
      supplier: this.supplier,
      tags: this.tags,
      isActive: this.isActive,
      seoMetadata: this.seoMetadata,
      salesCount: this.salesCount,
      revenue: this.revenue,
      lastSold: this.lastSold
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

    if (this.lowStockThreshold < 0) {
      errors.push('Low stock threshold cannot be negative');
    }

    if (this.reorderLevel < 0) {
      errors.push('Reorder level cannot be negative');
    }

    if (this.lowStockThreshold > this.reorderLevel) {
      errors.push('Low stock threshold should be less than or equal to reorder level');
    }

    if (this.supplier.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.supplier.email)) {
      errors.push('Invalid supplier email format');
    }

    if (this.salesCount < 0) {
      errors.push('Sales count cannot be negative');
    }

    if (this.revenue < 0) {
      errors.push('Revenue cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default Material;