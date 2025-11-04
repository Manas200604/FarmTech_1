/**
 * Materials Service Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import MaterialsService from '../materialsService.js';
import { Material } from '../../models/Material.js';
import materialsStorage from '../../utils/materialsStorage.js';

// Mock the materials storage
vi.mock('../../utils/materialsStorage.js', () => ({
  default: {
    getAllMaterials: vi.fn(),
    addMaterial: vi.fn(),
    updateMaterial: vi.fn(),
    deleteMaterial: vi.fn(),
    getMaterialById: vi.fn(),
    exportMaterials: vi.fn(),
    importMaterials: vi.fn()
  }
}));

describe('MaterialsService', () => {
  let materialsService;
  let mockUserProfile;

  beforeEach(() => {
    materialsService = new MaterialsService();
    mockUserProfile = {
      id: 'admin-1',
      role: 'admin',
      name: 'Test Admin'
    };
    
    vi.clearAllMocks();
  });

  describe('createMaterial', () => {
    it('should create a new material successfully', async () => {
      const materialData = {
        name: { en: 'Test Material', mr: 'टेस्ट मटेरियल', hi: 'टेस्ट सामग्री' },
        price: 100,
        unit: 'kg',
        category: 'pesticides',
        stock: 50
      };

      const mockMaterial = new Material({ ...materialData, id: 'mat-1' });
      materialsStorage.addMaterial.mockResolvedValue(mockMaterial);

      const result = await materialsService.createMaterial(materialData, mockUserProfile);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Material created successfully');
      expect(materialsStorage.addMaterial).toHaveBeenCalledWith(
        expect.objectContaining({
          ...materialData,
          createdBy: mockUserProfile.id,
          priceHistory: expect.arrayContaining([
            expect.objectContaining({
              price: materialData.price,
              updatedBy: mockUserProfile.id,
              reason: 'Initial price'
            })
          ])
        })
      );
    });

    it('should validate required fields', async () => {
      const invalidData = {
        name: { en: 'Test Material' },
        // Missing required fields: price, unit, category
      };

      await expect(materialsService.createMaterial(invalidData, mockUserProfile))
        .rejects.toThrow('Validation failed');
    });

    it('should require admin permissions', async () => {
      const nonAdminUser = { ...mockUserProfile, role: 'farmer' };
      const materialData = {
        name: { en: 'Test Material' },
        price: 100,
        unit: 'kg',
        category: 'pesticides'
      };

      await expect(materialsService.createMaterial(materialData, nonAdminUser))
        .rejects.toThrow('Insufficient permissions');
    });
  });

  describe('updateMaterial', () => {
    it('should update material successfully', async () => {
      const materialId = 'mat-1';
      const updateData = { price: 150, priceChangeReason: 'Market adjustment' };
      
      const mockMaterial = new Material({
        id: materialId,
        name: { en: 'Test Material' },
        price: 100,
        unit: 'kg',
        category: 'pesticides'
      });

      const updatedMaterial = new Material({ ...mockMaterial.toJSON(), price: 150 });

      materialsStorage.getMaterialById.mockResolvedValue(mockMaterial);
      materialsStorage.updateMaterial.mockResolvedValue(updatedMaterial);

      const result = await materialsService.updateMaterial(materialId, updateData, mockUserProfile);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Material updated successfully');
      expect(materialsStorage.updateMaterial).toHaveBeenCalled();
    });

    it('should handle material not found', async () => {
      const materialId = 'non-existent';
      const updateData = { price: 150 };

      materialsStorage.getMaterialById.mockResolvedValue(null);

      await expect(materialsService.updateMaterial(materialId, updateData, mockUserProfile))
        .rejects.toThrow('Material not found');
    });

    it('should handle price updates with history', async () => {
      const materialId = 'mat-1';
      const updateData = { price: 150, priceChangeReason: 'Market adjustment' };
      
      const mockMaterial = new Material({
        id: materialId,
        name: { en: 'Test Material' },
        price: 100,
        unit: 'kg',
        category: 'pesticides'
      });

      materialsStorage.getMaterialById.mockResolvedValue(mockMaterial);
      materialsStorage.updateMaterial.mockResolvedValue(mockMaterial);

      await materialsService.updateMaterial(materialId, updateData, mockUserProfile);

      // Verify that updatePrice was called on the material
      expect(mockMaterial.priceHistory.length).toBeGreaterThan(0);
    });
  });

  describe('deleteMaterial', () => {
    it('should delete material successfully', async () => {
      const materialId = 'mat-1';
      const mockMaterial = new Material({ id: materialId, name: { en: 'Test Material' } });

      materialsStorage.getMaterialById.mockResolvedValue(mockMaterial);
      materialsStorage.deleteMaterial.mockResolvedValue(true);

      const result = await materialsService.deleteMaterial(materialId, mockUserProfile);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Material deleted successfully');
      expect(materialsStorage.deleteMaterial).toHaveBeenCalledWith(materialId);
    });

    it('should handle material not found for deletion', async () => {
      const materialId = 'non-existent';

      materialsStorage.getMaterialById.mockResolvedValue(null);

      await expect(materialsService.deleteMaterial(materialId, mockUserProfile))
        .rejects.toThrow('Material not found');
    });
  });

  describe('updateStock', () => {
    it('should update stock with set operation', async () => {
      const materialId = 'mat-1';
      const quantity = 100;
      const operation = 'set';

      const mockMaterial = new Material({
        id: materialId,
        name: { en: 'Test Material' },
        stock: 50
      });

      materialsStorage.getMaterialById.mockResolvedValue(mockMaterial);
      materialsStorage.updateMaterial.mockResolvedValue({ ...mockMaterial, stock: quantity });

      const result = await materialsService.updateStock(materialId, quantity, operation, mockUserProfile);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Stock updated successfully');
      expect(mockMaterial.stock).toBe(quantity);
    });

    it('should update stock with add operation', async () => {
      const materialId = 'mat-1';
      const quantity = 25;
      const operation = 'add';

      const mockMaterial = new Material({
        id: materialId,
        name: { en: 'Test Material' },
        stock: 50
      });

      materialsStorage.getMaterialById.mockResolvedValue(mockMaterial);
      materialsStorage.updateMaterial.mockResolvedValue(mockMaterial);

      await materialsService.updateStock(materialId, quantity, operation, mockUserProfile);

      expect(mockMaterial.stock).toBe(75); // 50 + 25
    });

    it('should update stock with subtract operation', async () => {
      const materialId = 'mat-1';
      const quantity = 20;
      const operation = 'subtract';

      const mockMaterial = new Material({
        id: materialId,
        name: { en: 'Test Material' },
        stock: 50
      });

      materialsStorage.getMaterialById.mockResolvedValue(mockMaterial);
      materialsStorage.updateMaterial.mockResolvedValue(mockMaterial);

      await materialsService.updateStock(materialId, quantity, operation, mockUserProfile);

      expect(mockMaterial.stock).toBe(30); // 50 - 20
    });

    it('should handle insufficient stock for subtraction', async () => {
      const materialId = 'mat-1';
      const quantity = 100; // More than available stock
      const operation = 'subtract';

      const mockMaterial = new Material({
        id: materialId,
        name: { en: 'Test Material' },
        stock: 50
      });

      materialsStorage.getMaterialById.mockResolvedValue(mockMaterial);

      await expect(materialsService.updateStock(materialId, quantity, operation, mockUserProfile))
        .rejects.toThrow('Insufficient stock for reduction');
    });

    it('should validate quantity is positive', async () => {
      const materialId = 'mat-1';
      const quantity = -10;
      const operation = 'set';

      await expect(materialsService.updateStock(materialId, quantity, operation, mockUserProfile))
        .rejects.toThrow('Quantity must be a positive number');
    });

    it('should validate operation type', async () => {
      const materialId = 'mat-1';
      const quantity = 10;
      const operation = 'invalid';

      const mockMaterial = new Material({ id: materialId, stock: 50 });
      materialsStorage.getMaterialById.mockResolvedValue(mockMaterial);

      await expect(materialsService.updateStock(materialId, quantity, operation, mockUserProfile))
        .rejects.toThrow('Invalid operation. Use: set, add, or subtract');
    });
  });

  describe('getLowStockItems', () => {
    it('should return low stock items', async () => {
      const materials = [
        new Material({ id: 'mat-1', stock: 5, lowStockThreshold: 10 }), // Low stock
        new Material({ id: 'mat-2', stock: 20, lowStockThreshold: 10 }), // Normal stock
        new Material({ id: 'mat-3', stock: 2, lowStockThreshold: 5 })   // Low stock
      ];

      materialsStorage.getAllMaterials.mockResolvedValue(materials);

      const result = await materialsService.getLowStockItems(mockUserProfile);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.message).toBe('Found 2 low stock items');
    });
  });

  describe('updatePricing', () => {
    it('should update price with history', async () => {
      const materialId = 'mat-1';
      const newPrice = 150;
      const reason = 'Market price increase';

      const mockMaterial = new Material({
        id: materialId,
        name: { en: 'Test Material' },
        price: 100
      });

      materialsStorage.getMaterialById.mockResolvedValue(mockMaterial);
      materialsStorage.updateMaterial.mockResolvedValue(mockMaterial);

      const result = await materialsService.updatePricing(materialId, newPrice, reason, mockUserProfile);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Price updated successfully');
      expect(mockMaterial.price).toBe(newPrice);
      expect(mockMaterial.priceHistory.length).toBeGreaterThan(0);
    });

    it('should validate price is positive', async () => {
      const materialId = 'mat-1';
      const newPrice = -50;
      const reason = 'Invalid price';

      await expect(materialsService.updatePricing(materialId, newPrice, reason, mockUserProfile))
        .rejects.toThrow('Price must be a positive number');
    });
  });

  describe('bulkUpdatePrices', () => {
    it('should update multiple prices successfully', async () => {
      const updates = [
        { id: 'mat-1', price: 150, reason: 'Market adjustment' },
        { id: 'mat-2', price: 200, reason: 'Cost increase' }
      ];

      const materials = [
        new Material({ id: 'mat-1', price: 100 }),
        new Material({ id: 'mat-2', price: 180 })
      ];

      materialsStorage.getMaterialById
        .mockResolvedValueOnce(materials[0])
        .mockResolvedValueOnce(materials[1]);
      materialsStorage.updateMaterial
        .mockResolvedValueOnce(materials[0])
        .mockResolvedValueOnce(materials[1]);

      const result = await materialsService.bulkUpdatePrices(updates, mockUserProfile);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Bulk price update completed: 2/2 successful');
      expect(result.data).toHaveLength(2);
      expect(result.data.every(r => r.status === 'success')).toBe(true);
    });

    it('should handle partial failures in bulk update', async () => {
      const updates = [
        { id: 'mat-1', price: 150, reason: 'Market adjustment' },
        { id: 'non-existent', price: 200, reason: 'Cost increase' }
      ];

      const material1 = new Material({ id: 'mat-1', price: 100 });

      materialsStorage.getMaterialById
        .mockResolvedValueOnce(material1)
        .mockResolvedValueOnce(null); // Material not found
      materialsStorage.updateMaterial.mockResolvedValueOnce(material1);

      const result = await materialsService.bulkUpdatePrices(updates, mockUserProfile);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Bulk price update completed: 1/2 successful');
      expect(result.data).toHaveLength(2);
      expect(result.data[0].status).toBe('success');
      expect(result.data[1].status).toBe('failed');
    });

    it('should validate updates array', async () => {
      await expect(materialsService.bulkUpdatePrices([], mockUserProfile))
        .rejects.toThrow('Updates must be a non-empty array');

      await expect(materialsService.bulkUpdatePrices(null, mockUserProfile))
        .rejects.toThrow('Updates must be a non-empty array');
    });
  });

  describe('getMaterials', () => {
    it('should get materials with filters', async () => {
      const materials = [
        new Material({ id: 'mat-1', category: 'pesticides', stock: 5, lowStockThreshold: 10 }),
        new Material({ id: 'mat-2', category: 'tools', stock: 20, lowStockThreshold: 10 }),
        new Material({ id: 'mat-3', category: 'pesticides', stock: 15, lowStockThreshold: 10 })
      ];

      materialsStorage.getAllMaterials.mockResolvedValue(materials);

      const filters = {
        category: 'pesticides',
        lowStock: true,
        page: 1,
        limit: 10
      };

      const result = await materialsService.getMaterials(filters, mockUserProfile);

      expect(result.success).toBe(true);
      expect(result.data.data).toHaveLength(1); // Only mat-1 matches (pesticides + low stock)
    });

    it('should apply search filter', async () => {
      const materials = [
        new Material({ 
          id: 'mat-1', 
          name: { en: 'Pesticide A' },
          description: { en: 'For crops' }
        }),
        new Material({ 
          id: 'mat-2', 
          name: { en: 'Tool B' },
          description: { en: 'For farming' }
        })
      ];

      materialsStorage.getAllMaterials.mockResolvedValue(materials);

      const filters = { search: 'pesticide', page: 1, limit: 10 };
      const result = await materialsService.getMaterials(filters, mockUserProfile);

      expect(result.data.data).toHaveLength(1);
      expect(result.data.data[0].id).toBe('mat-1');
    });

    it('should apply sorting', async () => {
      const materials = [
        new Material({ id: 'mat-1', name: { en: 'B Material' }, price: 200 }),
        new Material({ id: 'mat-2', name: { en: 'A Material' }, price: 100 })
      ];

      materialsStorage.getAllMaterials.mockResolvedValue(materials);

      const filters = { sortBy: 'name', page: 1, limit: 10 };
      const result = await materialsService.getMaterials(filters, mockUserProfile);

      expect(result.data.data[0].name.en).toBe('A Material');
      expect(result.data.data[1].name.en).toBe('B Material');
    });
  });

  describe('getMaterialAnalytics', () => {
    it('should generate material analytics', async () => {
      const materials = [
        new Material({ 
          id: 'mat-1', 
          category: 'pesticides', 
          stock: 5, 
          lowStockThreshold: 10,
          price: 100,
          salesCount: 50,
          revenue: 5000
        }),
        new Material({ 
          id: 'mat-2', 
          category: 'tools', 
          stock: 20, 
          lowStockThreshold: 10,
          price: 200,
          salesCount: 30,
          revenue: 6000
        })
      ];

      materialsStorage.getAllMaterials.mockResolvedValue(materials);

      const result = await materialsService.getMaterialAnalytics(mockUserProfile);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('totalMaterials', 2);
      expect(result.data).toHaveProperty('lowStockItems', 1);
      expect(result.data).toHaveProperty('totalValue', 3000); // (5*100) + (20*200)
      expect(result.data).toHaveProperty('categoryBreakdown');
      expect(result.data).toHaveProperty('topSellingMaterials');
      expect(result.data.categoryBreakdown).toHaveProperty('pesticides');
      expect(result.data.categoryBreakdown).toHaveProperty('tools');
    });
  });

  describe('recordSale', () => {
    it('should record sale successfully', async () => {
      const materialId = 'mat-1';
      const quantity = 5;
      const unitPrice = 100;

      const mockMaterial = new Material({
        id: materialId,
        name: { en: 'Test Material' },
        stock: 20,
        salesCount: 10,
        revenue: 1000
      });

      materialsStorage.getMaterialById.mockResolvedValue(mockMaterial);
      materialsStorage.updateMaterial.mockResolvedValue(mockMaterial);

      const result = await materialsService.recordSale(materialId, quantity, unitPrice, mockUserProfile);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Sale recorded successfully');
      expect(mockMaterial.stock).toBe(15); // 20 - 5
      expect(mockMaterial.salesCount).toBe(15); // 10 + 5
      expect(mockMaterial.revenue).toBe(1500); // 1000 + (5 * 100)
    });

    it('should handle insufficient stock for sale', async () => {
      const materialId = 'mat-1';
      const quantity = 25; // More than available stock
      const unitPrice = 100;

      const mockMaterial = new Material({
        id: materialId,
        stock: 20
      });

      materialsStorage.getMaterialById.mockResolvedValue(mockMaterial);

      await expect(materialsService.recordSale(materialId, quantity, unitPrice, mockUserProfile))
        .rejects.toThrow('Insufficient stock for sale');
    });
  });

  describe('exportMaterials', () => {
    it('should export materials successfully', async () => {
      const materials = [
        new Material({ id: 'mat-1', name: { en: 'Material 1' } }),
        new Material({ id: 'mat-2', name: { en: 'Material 2' } })
      ];

      const exportData = {
        materials: materials.map(m => m.toJSON()),
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      materialsStorage.getAllMaterials.mockResolvedValue(materials);
      materialsStorage.exportMaterials.mockResolvedValue(exportData);

      const result = await materialsService.exportMaterials('json', mockUserProfile);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Materials exported successfully in json format');
      expect(result.data).toEqual(exportData);
    });
  });

  describe('importMaterials', () => {
    it('should import materials successfully', async () => {
      const importData = {
        materials: [
          { id: 'mat-1', name: { en: 'Imported Material 1' } },
          { id: 'mat-2', name: { en: 'Imported Material 2' } }
        ]
      };

      materialsStorage.importMaterials.mockResolvedValue(true);

      const result = await materialsService.importMaterials(importData, mockUserProfile);

      expect(result.success).toBe(true);
      expect(result.message).toBe('2 materials imported successfully');
      expect(materialsStorage.importMaterials).toHaveBeenCalledWith(importData);
    });

    it('should validate import data format', async () => {
      const invalidImportData = { invalid: 'data' };

      await expect(materialsService.importMaterials(invalidImportData, mockUserProfile))
        .rejects.toThrow('Invalid import data format');
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status', async () => {
      const materials = [
        new Material({ stock: 20, lowStockThreshold: 10 }),
        new Material({ stock: 15, lowStockThreshold: 10 }),
        new Material({ stock: 5, lowStockThreshold: 10 }) // Low stock
      ];

      materialsStorage.getAllMaterials.mockResolvedValue(materials);

      const health = await materialsService.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.details.totalMaterials).toBe(3);
      expect(health.details.lowStockItems).toBe(1);
      expect(health.details.outOfStockItems).toBe(0);
      expect(health.details.alertsNeeded).toBe(true);
    });

    it('should return unhealthy status on error', async () => {
      materialsStorage.getAllMaterials.mockRejectedValue(new Error('Storage error'));

      const health = await materialsService.healthCheck();

      expect(health.status).toBe('unhealthy');
      expect(health.details.error).toBe('Storage error');
    });
  });
});