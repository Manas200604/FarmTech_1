/**
 * Enhanced Materials Service
 * Handles advanced materials management operations
 */

import BaseAdminService from './BaseAdminService.js';
import { Material } from '../models/Material.js';
import materialsStorage from '../utils/materialsStorage.js';
import { createOperationError, createValidationError, createNotFoundError } from './AdminServiceError.js';

export class MaterialsService extends BaseAdminService {
  constructor(options = {}) {
    super({ ...options, serviceName: 'MaterialsService' });
    this.storage = materialsStorage;
  }

  // Create new material
  async createMaterial(materialData, userProfile) {
    try {
      this.validateAdminPermissions(userProfile);
      
      const materialSchema = {
        required: ['name', 'price', 'unit', 'category'],
        fields: {
          name: { type: 'object' },
          price: { type: 'number', min: 0 },
          unit: { type: 'string', minLength: 1 },
          category: { type: 'string', minLength: 1 },
          stock: { type: 'number', min: 0 },
          lowStockThreshold: { type: 'number', min: 0 },
          reorderLevel: { type: 'number', min: 0 }
        }
      };

      this.validateInput(materialData, materialSchema);

      const enhancedData = {
        ...materialData,
        createdBy: userProfile.id,
        priceHistory: [{
          price: materialData.price,
          effectiveDate: new Date(),
          updatedBy: userProfile.id,
          reason: 'Initial price'
        }]
      };

      const material = await this.storage.addMaterial(enhancedData);
      this.logInfo('Material created', { materialId: material.id, createdBy: userProfile.id });
      
      return this.formatResponse(material, 'Material created successfully');
    } catch (error) {
      this.logError('Error creating material', error);
      throw createOperationError('Failed to create material', { error: error.message });
    }
  }

  // Update existing material
  async updateMaterial(id, updateData, userProfile) {
    try {
      this.validateAdminPermissions(userProfile);

      const material = await this.storage.getMaterialById(id);
      if (!material) {
        throw createNotFoundError('Material');
      }

      // Handle price updates with history
      if (updateData.price && updateData.price !== material.price) {
        material.updatePrice(updateData.price, updateData.priceChangeReason || 'Price update', userProfile.id);
        delete updateData.price; // Remove from updateData as it's handled by updatePrice
      }

      const updatedMaterial = await this.storage.updateMaterial(id, updateData);
      this.logInfo('Material updated', { materialId: id, updatedBy: userProfile.id });
      
      return this.formatResponse(updatedMaterial, 'Material updated successfully');
    } catch (error) {
      this.logError('Error updating material', error);
      throw createOperationError('Failed to update material', { error: error.message });
    }
  }

  // Delete material
  async deleteMaterial(id, userProfile) {
    try {
      this.validateAdminPermissions(userProfile);

      const material = await this.storage.getMaterialById(id);
      if (!material) {
        throw createNotFoundError('Material');
      }

      await this.storage.deleteMaterial(id);
      this.logInfo('Material deleted', { materialId: id, deletedBy: userProfile.id });
      
      return this.formatResponse(null, 'Material deleted successfully');
    } catch (error) {
      this.logError('Error deleting material', error);
      throw createOperationError('Failed to delete material', { error: error.message });
    }
  }

  // Update stock levels
  async updateStock(id, quantity, operation = 'set', userProfile) {
    try {
      this.validateAdminPermissions(userProfile);

      if (typeof quantity !== 'number' || quantity < 0) {
        throw createValidationError('Quantity must be a positive number');
      }

      const material = await this.storage.getMaterialById(id);
      if (!material) {
        throw createNotFoundError('Material');
      }

      const oldStock = material.stock;
      
      switch (operation) {
        case 'set':
          material.stock = quantity;
          break;
        case 'add':
          material.increaseStock(quantity);
          break;
        case 'subtract':
          if (!material.reduceStock(quantity)) {
            throw createValidationError('Insufficient stock for reduction');
          }
          break;
        default:
          throw createValidationError('Invalid operation. Use: set, add, or subtract');
      }

      const updatedMaterial = await this.storage.updateMaterial(id, material.toJSON());
      
      this.logInfo('Stock updated', { 
        materialId: id, 
        oldStock, 
        newStock: updatedMaterial.stock, 
        operation, 
        quantity,
        updatedBy: userProfile.id 
      });
      
      return this.formatResponse(updatedMaterial, 'Stock updated successfully');
    } catch (error) {
      this.logError('Error updating stock', error);
      throw createOperationError('Failed to update stock', { error: error.message });
    }
  }

  // Get low stock items
  async getLowStockItems(userProfile) {
    try {
      this.validateAdminPermissions(userProfile);

      const materials = await this.storage.getAllMaterials();
      const lowStockItems = materials.filter(material => material.isLowStock());
      
      return this.formatResponse(lowStockItems, `Found ${lowStockItems.length} low stock items`);
    } catch (error) {
      this.logError('Error getting low stock items', error);
      throw createOperationError('Failed to get low stock items', { error: error.message });
    }
  }

  // Update pricing with history
  async updatePricing(id, newPrice, reason, userProfile) {
    try {
      this.validateAdminPermissions(userProfile);

      if (typeof newPrice !== 'number' || newPrice < 0) {
        throw createValidationError('Price must be a positive number');
      }

      const material = await this.storage.getMaterialById(id);
      if (!material) {
        throw createNotFoundError('Material');
      }

      material.updatePrice(newPrice, reason || 'Price update', userProfile.id);
      const updatedMaterial = await this.storage.updateMaterial(id, material.toJSON());
      
      this.logInfo('Price updated', { 
        materialId: id, 
        newPrice, 
        reason, 
        updatedBy: userProfile.id 
      });
      
      return this.formatResponse(updatedMaterial, 'Price updated successfully');
    } catch (error) {
      this.logError('Error updating price', error);
      throw createOperationError('Failed to update price', { error: error.message });
    }
  }

  // Bulk update prices
  async bulkUpdatePrices(updates, userProfile) {
    try {
      this.validateAdminPermissions(userProfile);

      if (!Array.isArray(updates) || updates.length === 0) {
        throw createValidationError('Updates must be a non-empty array');
      }

      const results = [];
      
      for (const update of updates) {
        try {
          const { id, price, reason } = update;
          const result = await this.updatePricing(id, price, reason, userProfile);
          results.push({ id, status: 'success', data: result.data });
        } catch (error) {
          results.push({ id: update.id, status: 'failed', error: error.message });
        }
      }

      const successCount = results.filter(r => r.status === 'success').length;
      
      return this.formatResponse(results, `Bulk price update completed: ${successCount}/${updates.length} successful`);
    } catch (error) {
      this.logError('Error in bulk price update', error);
      throw createOperationError('Failed to bulk update prices', { error: error.message });
    }
  }

  // Export materials
  async exportMaterials(format = 'json', userProfile) {
    try {
      this.validateAdminPermissions(userProfile);

      const materials = await this.storage.getAllMaterials();
      const exportData = await this.storage.exportMaterials();
      
      this.logInfo('Materials exported', { 
        format, 
        count: materials.length, 
        exportedBy: userProfile.id 
      });
      
      return this.formatResponse(exportData, `Materials exported successfully in ${format} format`);
    } catch (error) {
      this.logError('Error exporting materials', error);
      throw createOperationError('Failed to export materials', { error: error.message });
    }
  }

  // Import materials
  async importMaterials(importData, userProfile) {
    try {
      this.validateAdminPermissions(userProfile);

      if (!importData || !importData.materials) {
        throw createValidationError('Invalid import data format');
      }

      await this.storage.importMaterials(importData);
      
      this.logInfo('Materials imported', { 
        count: importData.materials.length, 
        importedBy: userProfile.id 
      });
      
      return this.formatResponse(null, `${importData.materials.length} materials imported successfully`);
    } catch (error) {
      this.logError('Error importing materials', error);
      throw createOperationError('Failed to import materials', { error: error.message });
    }
  }

  // Get materials with advanced filtering
  async getMaterials(filters = {}, userProfile) {
    try {
      this.validateAdminPermissions(userProfile);

      let materials = await this.storage.getAllMaterials();

      // Apply filters
      if (filters.category) {
        materials = materials.filter(m => m.category === filters.category);
      }

      if (filters.lowStock) {
        materials = materials.filter(m => m.isLowStock());
      }

      if (filters.needsReorder) {
        materials = materials.filter(m => m.needsReorder());
      }

      if (filters.active !== undefined) {
        materials = materials.filter(m => m.isActive === filters.active);
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        materials = materials.filter(m => 
          m.getLocalizedName().toLowerCase().includes(searchTerm) ||
          m.getLocalizedDescription().toLowerCase().includes(searchTerm) ||
          m.brand.toLowerCase().includes(searchTerm)
        );
      }

      // Apply sorting
      if (filters.sortBy) {
        materials.sort((a, b) => {
          switch (filters.sortBy) {
            case 'name':
              return a.getLocalizedName().localeCompare(b.getLocalizedName());
            case 'price':
              return a.price - b.price;
            case 'stock':
              return a.stock - b.stock;
            case 'popularity':
              return b.getPopularityScore() - a.getPopularityScore();
            case 'created':
              return new Date(b.createdAt) - new Date(a.createdAt);
            default:
              return 0;
          }
        });
      }

      // Apply pagination
      const pagination = this.validatePagination(filters.page, filters.limit);
      const startIndex = pagination.offset;
      const endIndex = startIndex + pagination.limit;
      const paginatedMaterials = materials.slice(startIndex, endIndex);

      return this.createPaginatedResponse(paginatedMaterials, materials.length, pagination.page, pagination.limit);
    } catch (error) {
      this.logError('Error getting materials', error);
      throw createOperationError('Failed to get materials', { error: error.message });
    }
  }

  // Get material analytics
  async getMaterialAnalytics(userProfile) {
    try {
      this.validateAdminPermissions(userProfile);

      const materials = await this.storage.getAllMaterials();
      
      const analytics = {
        totalMaterials: materials.length,
        activeMaterials: materials.filter(m => m.isActive).length,
        lowStockItems: materials.filter(m => m.isLowStock()).length,
        needsReorderItems: materials.filter(m => m.needsReorder()).length,
        outOfStockItems: materials.filter(m => m.stock === 0).length,
        totalValue: materials.reduce((sum, m) => sum + (m.stock * m.price), 0),
        averagePrice: materials.length > 0 ? materials.reduce((sum, m) => sum + m.price, 0) / materials.length : 0,
        categoryBreakdown: {},
        topSellingMaterials: materials
          .sort((a, b) => b.salesCount - a.salesCount)
          .slice(0, 10)
          .map(m => ({
            id: m.id,
            name: m.getLocalizedName(),
            salesCount: m.salesCount,
            revenue: m.revenue
          })),
        recentlyAdded: materials
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
          .map(m => ({
            id: m.id,
            name: m.getLocalizedName(),
            createdAt: m.createdAt
          }))
      };

      // Calculate category breakdown
      materials.forEach(material => {
        const category = material.category || 'uncategorized';
        if (!analytics.categoryBreakdown[category]) {
          analytics.categoryBreakdown[category] = {
            count: 0,
            totalValue: 0,
            lowStock: 0
          };
        }
        analytics.categoryBreakdown[category].count++;
        analytics.categoryBreakdown[category].totalValue += material.stock * material.price;
        if (material.isLowStock()) {
          analytics.categoryBreakdown[category].lowStock++;
        }
      });

      return this.formatResponse(analytics, 'Material analytics generated successfully');
    } catch (error) {
      this.logError('Error getting material analytics', error);
      throw createOperationError('Failed to get material analytics', { error: error.message });
    }
  }

  // Update supplier information
  async updateSupplier(id, supplierData, userProfile) {
    try {
      this.validateAdminPermissions(userProfile);

      const material = await this.storage.getMaterialById(id);
      if (!material) {
        throw createNotFoundError('Material');
      }

      material.updateSupplier(supplierData);
      const updatedMaterial = await this.storage.updateMaterial(id, material.toJSON());
      
      this.logInfo('Supplier updated', { materialId: id, updatedBy: userProfile.id });
      
      return this.formatResponse(updatedMaterial, 'Supplier information updated successfully');
    } catch (error) {
      this.logError('Error updating supplier', error);
      throw createOperationError('Failed to update supplier', { error: error.message });
    }
  }

  // Manage tags
  async addTag(id, tag, userProfile) {
    try {
      this.validateAdminPermissions(userProfile);

      const material = await this.storage.getMaterialById(id);
      if (!material) {
        throw createNotFoundError('Material');
      }

      material.addTag(tag);
      const updatedMaterial = await this.storage.updateMaterial(id, material.toJSON());
      
      return this.formatResponse(updatedMaterial, 'Tag added successfully');
    } catch (error) {
      this.logError('Error adding tag', error);
      throw createOperationError('Failed to add tag', { error: error.message });
    }
  }

  async removeTag(id, tag, userProfile) {
    try {
      this.validateAdminPermissions(userProfile);

      const material = await this.storage.getMaterialById(id);
      if (!material) {
        throw createNotFoundError('Material');
      }

      material.removeTag(tag);
      const updatedMaterial = await this.storage.updateMaterial(id, material.toJSON());
      
      return this.formatResponse(updatedMaterial, 'Tag removed successfully');
    } catch (error) {
      this.logError('Error removing tag', error);
      throw createOperationError('Failed to remove tag', { error: error.message });
    }
  }

  // Record sale
  async recordSale(id, quantity, unitPrice, userProfile) {
    try {
      this.validateAdminPermissions(userProfile);

      const material = await this.storage.getMaterialById(id);
      if (!material) {
        throw createNotFoundError('Material');
      }

      if (!material.reduceStock(quantity)) {
        throw createValidationError('Insufficient stock for sale');
      }

      material.recordSale(quantity, unitPrice);
      const updatedMaterial = await this.storage.updateMaterial(id, material.toJSON());
      
      this.logInfo('Sale recorded', { 
        materialId: id, 
        quantity, 
        unitPrice, 
        revenue: quantity * unitPrice,
        recordedBy: userProfile.id 
      });
      
      return this.formatResponse(updatedMaterial, 'Sale recorded successfully');
    } catch (error) {
      this.logError('Error recording sale', error);
      throw createOperationError('Failed to record sale', { error: error.message });
    }
  }

  // Health check
  async healthCheck() {
    try {
      const materials = await this.storage.getAllMaterials();
      const lowStockCount = materials.filter(m => m.isLowStock()).length;
      const outOfStockCount = materials.filter(m => m.stock === 0).length;
      
      return {
        status: 'healthy',
        details: {
          totalMaterials: materials.length,
          lowStockItems: lowStockCount,
          outOfStockItems: outOfStockCount,
          alertsNeeded: lowStockCount + outOfStockCount > 0
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message
        }
      };
    }
  }
}

export default MaterialsService;