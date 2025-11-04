/**
 * Materials Storage Utilities
 * Handles local storage and synchronization of materials data
 */

import { Material } from '../models/Material.js';

const STORAGE_KEY = 'farmtech_materials';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class MaterialsStorage {
  constructor() {
    this.cache = new Map();
    this.lastSync = null;
  }

  // Get all materials from storage
  async getAllMaterials() {
    try {
      const cached = this.getFromCache('all_materials');
      if (cached && this.isCacheValid('all_materials')) {
        return cached.map(data => Material.fromJSON(data));
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const materials = JSON.parse(stored);
        this.setCache('all_materials', materials);
        return materials.map(data => Material.fromJSON(data));
      }

      // Return default materials if none stored
      const defaultMaterials = this.getDefaultMaterials();
      await this.saveMaterials(defaultMaterials);
      return defaultMaterials;
    } catch (error) {
      console.error('Error loading materials:', error);
      return this.getDefaultMaterials();
    }
  }

  // Get material by ID
  async getMaterialById(id) {
    const materials = await this.getAllMaterials();
    return materials.find(material => material.id === id);
  }

  // Save materials to storage
  async saveMaterials(materials) {
    try {
      const materialsData = materials.map(material => 
        material instanceof Material ? material.toJSON() : material
      );
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(materialsData));
      this.setCache('all_materials', materialsData);
      this.lastSync = new Date();
      return true;
    } catch (error) {
      console.error('Error saving materials:', error);
      return false;
    }
  }

  // Add new material
  async addMaterial(materialData) {
    try {
      const materials = await this.getAllMaterials();
      const newMaterial = new Material(materialData);
      
      // Validate material
      const validation = newMaterial.validate();
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      materials.push(newMaterial);
      await this.saveMaterials(materials);
      return newMaterial;
    } catch (error) {
      console.error('Error adding material:', error);
      throw error;
    }
  }

  // Update existing material
  async updateMaterial(id, updateData) {
    try {
      const materials = await this.getAllMaterials();
      const materialIndex = materials.findIndex(material => material.id === id);
      
      if (materialIndex === -1) {
        throw new Error('Material not found');
      }

      const updatedMaterial = materials[materialIndex].update(updateData);
      
      // Validate updated material
      const validation = updatedMaterial.validate();
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      materials[materialIndex] = updatedMaterial;
      await this.saveMaterials(materials);
      return updatedMaterial;
    } catch (error) {
      console.error('Error updating material:', error);
      throw error;
    }
  }

  // Delete material
  async deleteMaterial(id) {
    try {
      const materials = await this.getAllMaterials();
      const filteredMaterials = materials.filter(material => material.id !== id);
      
      if (filteredMaterials.length === materials.length) {
        throw new Error('Material not found');
      }

      await this.saveMaterials(filteredMaterials);
      return true;
    } catch (error) {
      console.error('Error deleting material:', error);
      throw error;
    }
  }

  // Search materials
  async searchMaterials(query, language = 'en') {
    const materials = await this.getAllMaterials();
    const searchTerm = query.toLowerCase();

    return materials.filter(material => {
      const name = material.getLocalizedName(language).toLowerCase();
      const description = material.getLocalizedDescription(language).toLowerCase();
      const category = material.category.toLowerCase();

      return name.includes(searchTerm) || 
             description.includes(searchTerm) || 
             category.includes(searchTerm);
    });
  }

  // Filter materials by category
  async getMaterialsByCategory(category) {
    const materials = await this.getAllMaterials();
    return materials.filter(material => 
      material.category.toLowerCase() === category.toLowerCase()
    );
  }

  // Get available materials only
  async getAvailableMaterials() {
    const materials = await this.getAllMaterials();
    return materials.filter(material => material.isInStock());
  }

  // Update material stock
  async updateStock(materialId, quantity, operation = 'reduce') {
    try {
      const material = await this.getMaterialById(materialId);
      if (!material) {
        throw new Error('Material not found');
      }

      let success = false;
      if (operation === 'reduce') {
        success = material.reduceStock(quantity);
      } else if (operation === 'increase') {
        material.increaseStock(quantity);
        success = true;
      }

      if (success) {
        await this.updateMaterial(materialId, material.toJSON());
      }

      return success;
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  }

  // Cache management
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    return cached ? cached.data : null;
  }

  isCacheValid(key) {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return (Date.now() - cached.timestamp) < CACHE_DURATION;
  }

  clearCache() {
    this.cache.clear();
  }

  // Get default materials for initial setup
  getDefaultMaterials() {
    const materialsData = [
      // Pesticides - Insecticides
      { 
        id: 'mat_1', 
        name: { en: 'Chlorpyrifos 20% EC', mr: 'क्लोरपायरिफॉस २०% ईसी', hi: 'क्लोरपायरिफॉस 20% ईसी' },
        description: { en: 'Broad spectrum insecticide for controlling sucking and chewing pests', mr: 'चूसणारे आणि चावणारे कीड नियंत्रणासाठी व्यापक स्पेक्ट्रम कीटकनाशक', hi: 'चूसने और चबाने वाले कीटों के नियंत्रण के लिए व्यापक स्पेक्ट्रम कीटनाशक' },
        price: 450, 
        marketPrice: 520,
        unit: 'liter', 
        category: 'pesticides',
        subCategory: 'insecticides',
        brand: 'Bayer CropScience',
        specifications: {
          activeIngredient: 'Chlorpyrifos 20%',
          concentration: '20% EC',
          targetPests: ['Aphids', 'Bollworm', 'Thrips', 'Whitefly'],
          safetyInstructions: { 
            en: 'Wear protective clothing. Do not eat, drink or smoke while using. Wash hands after use.',
            mr: 'संरक्षक कपडे घाला. वापरताना खाऊ, पिऊ किंवा धूम्रपान करू नका. वापरानंतर हात धुवा.',
            hi: 'सुरक्षात्मक कपड़े पहनें। उपयोग के दौरान न खाएं, न पिएं और न धूम्रपान करें। उपयोग के बाद हाथ धोएं।'
          },
          usageInstructions: { 
            en: 'Mix 2ml per liter of water. Spray during early morning or evening.',
            mr: '२ मिली प्रति लिटर पाण्यात मिसळा. पहाटे किंवा संध्याकाळी फवारणी करा.',
            hi: '2 मिली प्रति लीटर पानी में मिलाएं। सुबह या शाम के समय छिड़काव करें।'
          }
        },
        stock: 25,
        available: true,
        imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400'
      },
      { 
        id: 'mat_2', 
        name: { en: 'Imidacloprid 17.8% SL', mr: 'इमिडाक्लोप्रिड १७.८% एसएल', hi: 'इमिडाक्लोप्रिड 17.8% एसएल' },
        description: { en: 'Systemic insecticide for sucking pests control', mr: 'चूसणारे कीड नियंत्रणासाठी प्रणालीगत कीटकनाशक', hi: 'चूसने वाले कीटों के नियंत्रण के लिए प्रणालीगत कीटनाशक' },
        price: 380, 
        marketPrice: 420,
        unit: 'liter', 
        category: 'pesticides',
        subCategory: 'insecticides',
        brand: 'Syngenta',
        specifications: {
          activeIngredient: 'Imidacloprid 17.8%',
          concentration: '17.8% SL',
          targetPests: ['Aphids', 'Jassids', 'Whitefly', 'Thrips'],
          safetyInstructions: { 
            en: 'Use protective equipment. Avoid contact with skin and eyes.',
            mr: 'संरक्षक उपकरणे वापरा. त्वचा आणि डोळ्यांशी संपर्क टाळा.',
            hi: 'सुरक्षा उपकरण का उपयोग करें। त्वचा और आंखों के संपर्क से बचें।'
          }
        },
        stock: 30,
        available: true,
        imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400'
      },

      // Pesticides - Herbicides
      { 
        id: 'mat_3', 
        name: { en: 'Glyphosate 41% SL', mr: 'ग्लायफोसेट ४१% एसएल', hi: 'ग्लाइफोसेट 41% एसएल' },
        description: { en: 'Non-selective systemic herbicide for weed control', mr: 'तणनाशासाठी अनिवडक प्रणालीगत तणनाशक', hi: 'खरपतवार नियंत्रण के लिए गैर-चयनात्मक प्रणालीगत शाकनाशी' },
        price: 320, 
        marketPrice: 350,
        unit: 'liter', 
        category: 'pesticides',
        subCategory: 'herbicides',
        brand: 'Monsanto',
        specifications: {
          activeIngredient: 'Glyphosate 41%',
          concentration: '41% SL',
          targetPests: ['All weeds', 'Grasses', 'Broadleaf weeds'],
          safetyInstructions: { 
            en: 'Avoid drift to non-target plants. Use only in calm weather.',
            mr: 'लक्ष्य नसलेल्या वनस्पतींवर वाहून जाणे टाळा. केवळ शांत हवामानात वापरा.',
            hi: 'गैर-लक्षित पौधों पर बहाव से बचें। केवल शांत मौसम में उपयोग करें।'
          }
        },
        stock: 40,
        available: true,
        imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400'
      },
      { 
        id: 'mat_4', 
        name: { en: '2,4-D Amine Salt 58% SL', mr: '२,४-डी अमाइन सॉल्ट ५८% एसएल', hi: '2,4-डी अमाइन साल्ट 58% एसएल' },
        description: { en: 'Selective herbicide for broadleaf weed control in cereals', mr: 'धान्य पिकांमध्ये रुंद पानांच्या तणांच्या नियंत्रणासाठी निवडक तणनाशक', hi: 'अनाज की फसलों में चौड़ी पत्ती के खरपतवार नियंत्रण के लिए चयनात्मक शाकनाशी' },
        price: 280, 
        marketPrice: 310,
        unit: 'liter', 
        category: 'pesticides',
        subCategory: 'herbicides',
        brand: 'Dow AgroSciences',
        specifications: {
          activeIngredient: '2,4-D Amine Salt 58%',
          concentration: '58% SL',
          targetPests: ['Broadleaf weeds', 'Dicot weeds'],
          safetyInstructions: { 
            en: 'Do not spray on windy days. Keep away from water sources.',
            mr: 'वाऱ्याच्या दिवशी फवारणी करू नका. पाण्याच्या स्रोतांपासून दूर ठेवा.',
            hi: 'हवा वाले दिनों में छिड़काव न करें। पानी के स्रोतों से दूर रखें।'
          }
        },
        stock: 35,
        available: true,
        imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400'
      },

      // Pesticides - Fungicides
      { 
        id: 'mat_5', 
        name: { en: 'Mancozeb 75% WP', mr: 'मॅन्कोझेब ७५% डब्ल्यूपी', hi: 'मैंकोजेब 75% डब्ल्यूपी' },
        description: { en: 'Protective fungicide for disease prevention', mr: 'रोग प्रतिबंधासाठी संरक्षक बुरशीनाशक', hi: 'रोग रोकथाम के लिए सुरक्षात्मक ففूंदनाशी' },
        price: 180, 
        marketPrice: 200,
        unit: 'kg', 
        category: 'pesticides',
        subCategory: 'fungicides',
        brand: 'UPL Limited',
        specifications: {
          activeIngredient: 'Mancozeb 75%',
          concentration: '75% WP',
          targetPests: ['Late blight', 'Downy mildew', 'Anthracnose'],
          safetyInstructions: { 
            en: 'Wear mask while mixing. Avoid inhalation of dust.',
            mr: 'मिसळताना मास्क घाला. धूळ श्वास घेणे टाळा.',
            hi: 'मिलाते समय मास्क पहनें। धूल को सांस में लेने से बचें।'
          }
        },
        stock: 50,
        available: true,
        imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400'
      },

      // Pesticides - Fertilizers
      { 
        id: 'mat_6', 
        name: { en: 'NPK 19:19:19', mr: 'एनपीके १९:१९:१९', hi: 'एनपीके 19:19:19' },
        description: { en: 'Balanced water-soluble fertilizer for all crops', mr: 'सर्व पिकांसाठी संतुलित पाण्यात विरघळणारे खत', hi: 'सभी फसलों के लिए संतुलित पानी में घुलनशील उर्वरक' },
        price: 120, 
        marketPrice: 140,
        unit: 'kg', 
        category: 'pesticides',
        subCategory: 'fertilizers',
        brand: 'IFFCO',
        specifications: {
          activeIngredient: 'NPK 19:19:19',
          concentration: '100% water soluble',
          usageInstructions: { 
            en: 'Dissolve 5-10g per liter of water. Apply through drip or foliar spray.',
            mr: '५-१० ग्रॅम प्रति लिटर पाण्यात विरघळवा. ठिबक किंवा पर्णीय फवारणीद्वारे वापरा.',
            hi: '5-10 ग्राम प्रति लीटर पानी में घोलें। ड्रिप या पत्तियों पर छिड़काव के माध्यम से लगाएं।'
          }
        },
        stock: 100,
        available: true,
        imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400'
      },

      // Agricultural Tools - Hand Tools
      { 
        id: 'mat_7', 
        name: { en: 'Garden Hoe', mr: 'बागकाम कुदाळ', hi: 'बागवानी कुदाल' },
        description: { en: 'Heavy-duty steel hoe for weeding and soil cultivation', mr: 'तणनाश आणि मातीची मशागत करण्यासाठी जड स्टील कुदाळ', hi: 'निराई और मिट्टी की खेती के लिए भारी स्टील कुदाल' },
        price: 450, 
        marketPrice: 500,
        unit: 'piece', 
        category: 'tools',
        subCategory: 'hand-tools',
        brand: 'Falcon Tools',
        specifications: {
          dimensions: '25cm x 15cm blade',
          weight: '1.2 kg',
          material: 'High carbon steel',
          usageInstructions: { 
            en: 'Use for weeding, cultivating soil, and making furrows. Keep blade sharp for best results.',
            mr: 'तणनाश, मातीची मशागत आणि उरडे तयार करण्यासाठी वापरा. सर्वोत्तम परिणामांसाठी ब्लेड तीक्ष्ण ठेवा.',
            hi: 'निराई, मिट्टी की खेती और कुंड बनाने के लिए उपयोग करें। सर्वोत्तम परिणामों के लिए ब्लेड को तेज रखें।'
          }
        },
        stock: 20,
        available: true,
        imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400'
      },
      { 
        id: 'mat_8', 
        name: { en: 'Pruning Shears', mr: 'छाटणी कात्री', hi: 'छंटाई कैंची' },
        description: { en: 'Professional bypass pruning shears for fruit trees', mr: 'फळझाडांसाठी व्यावसायिक बायपास छाटणी कात्री', hi: 'फलों के पेड़ों के लिए पेशेवर बायपास छंटाई कैंची' },
        price: 850, 
        marketPrice: 950,
        unit: 'piece', 
        category: 'tools',
        subCategory: 'hand-tools',
        brand: 'Fiskars',
        specifications: {
          dimensions: '20cm length',
          weight: '250g',
          material: 'Stainless steel blades',
          cuttingCapacity: 'Up to 2cm diameter branches',
          usageInstructions: { 
            en: 'Clean blades after use. Oil moving parts regularly. Cut at 45-degree angle.',
            mr: 'वापरानंतर ब्लेड स्वच्छ करा. हलणारे भाग नियमितपणे तेल लावा. ४५ अंशाच्या कोनात कापा.',
            hi: 'उपयोग के बाद ब्लेड साफ करें। चलने वाले हिस्सों में नियमित रूप से तेल लगाएं। 45 डिग्री के कोण पर काटें।'
          }
        },
        stock: 15,
        available: true,
        imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400'
      },

      // Agricultural Tools - Power Tools
      { 
        id: 'mat_9', 
        name: { en: 'Brush Cutter', mr: 'ब्रश कटर', hi: 'ब्रश कटर' },
        description: { en: '2-stroke petrol brush cutter for grass and weed cutting', mr: 'गवत आणि तण कापण्यासाठी २-स्ट्रोक पेट्रोल ब्रश कटर', hi: 'घास और खरपतवार काटने के लिए 2-स्ट्रोक पेट्रोल ब्रश कटर' },
        price: 12500, 
        marketPrice: 14000,
        unit: 'piece', 
        category: 'tools',
        subCategory: 'power-tools',
        brand: 'Stihl',
        specifications: {
          powerSource: '2-stroke petrol engine',
          engineCapacity: '25.4cc',
          weight: '4.5 kg',
          cuttingWidth: '40cm',
          fuelTankCapacity: '0.33 liters',
          safetyInstructions: { 
            en: 'Wear safety goggles and protective clothing. Check fuel mixture ratio.',
            mr: 'सुरक्षा चष्मा आणि संरक्षक कपडे घाला. इंधन मिश्रणाचे प्रमाण तपासा.',
            hi: 'सुरक्षा चश्मा और सुरक्षात्मक कपड़े पहनें। ईंधन मिश्रण अनुपात की जांच करें।'
          }
        },
        stock: 8,
        available: true,
        imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400'
      },

      // Agricultural Tools - Irrigation Equipment
      { 
        id: 'mat_10', 
        name: { en: 'Drip Irrigation Kit', mr: 'ठिबक सिंचन किट', hi: 'ड्रिप सिंचाई किट' },
        description: { en: 'Complete drip irrigation system for 1 acre', mr: '१ एकर क्षेत्रासाठी संपूर्ण ठिबक सिंचन प्रणाली', hi: '1 एकड़ क्षेत्र के लिए पूर्ण ड्रिप सिंचाई प्रणाली' },
        price: 25000, 
        marketPrice: 28000,
        unit: 'set', 
        category: 'tools',
        subCategory: 'irrigation',
        brand: 'Netafim',
        specifications: {
          coverage: '1 acre (4000 sq meters)',
          components: 'Main line, laterals, drippers, filters, pressure regulators',
          waterSaving: 'Up to 50% compared to flood irrigation',
          installation: 'Professional installation recommended',
          usageInstructions: { 
            en: 'Install main line first, then laterals. Clean filters regularly. Monitor water pressure.',
            mr: 'प्रथम मुख्य पाईप बसवा, नंतर बाजूच्या पाईप. फिल्टर नियमितपणे स्वच्छ करा. पाण्याचा दाब तपासा.',
            hi: 'पहले मुख्य लाइन स्थापित करें, फिर साइड लाइन। फिल्टर नियमित रूप से साफ करें। पानी के दबाव की निगरानी करें।'
          }
        },
        stock: 5,
        available: true,
        imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400'
      },

      // Agricultural Tools - Harvesting Tools
      { 
        id: 'mat_11', 
        name: { en: 'Harvesting Sickle', mr: 'कापणी विळा', hi: 'कटाई दरांती' },
        description: { en: 'Sharp steel sickle for crop harvesting', mr: 'पीक कापणीसाठी तीक्ष्ण स्टील विळा', hi: 'फसल कटाई के लिए तेज स्टील दरांती' },
        price: 180, 
        marketPrice: 200,
        unit: 'piece', 
        category: 'tools',
        subCategory: 'harvesting',
        brand: 'Kamco',
        specifications: {
          bladeLength: '15cm curved blade',
          weight: '300g',
          material: 'High carbon steel',
          handleMaterial: 'Wooden handle with grip',
          usageInstructions: { 
            en: 'Hold crop with one hand, cut with smooth motion. Keep blade sharp.',
            mr: 'एका हाताने पीक धरा, गुळगुळीत हालचालीने कापा. ब्लेड तीक्ष्ण ठेवा.',
            hi: 'एक हाथ से फसल पकड़ें, चिकनी गति से काटें। ब्लेड को तेज रखें।'
          }
        },
        stock: 30,
        available: true,
        imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400'
      },
      { 
        id: 'mat_12', 
        name: { en: 'Combine Harvester (Mini)', mr: 'कंबाइन हार्वेस्टर (मिनी)', hi: 'कंबाइन हार्वेस्टर (मिनी)' },
        description: { en: 'Compact combine harvester for small farms', mr: 'लहान शेतांसाठी कॉम्पॅक्ट कंबाइन हार्वेस्टर', hi: 'छोटे खेतों के लिए कॉम्पैक्ट कंबाइन हार्वेस्टर' },
        price: 450000, 
        marketPrice: 500000,
        unit: 'piece', 
        category: 'tools',
        subCategory: 'harvesting',
        brand: 'Mahindra',
        specifications: {
          powerSource: 'Diesel engine 35HP',
          cuttingWidth: '1.2 meters',
          grainTankCapacity: '500 kg',
          fuelTankCapacity: '45 liters',
          operatingSpeed: '3-5 km/hr',
          dimensions: '4.5m x 2.1m x 2.8m',
          weight: '2500 kg',
          safetyInstructions: { 
            en: 'Trained operator required. Regular maintenance essential. Check safety guards.',
            mr: 'प्रशिक्षित ऑपरेटर आवश्यक. नियमित देखभाल आवश्यक. सुरक्षा गार्ड तपासा.',
            hi: 'प्रशिक्षित ऑपरेटर आवश्यक। नियमित रखरखाव जरूरी। सुरक्षा गार्ड की जांच करें।'
          }
        },
        stock: 2,
        available: true,
        imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400'
      }
    ];

    return materialsData.map(data => new Material(data));
  }

  // Export materials data
  async exportMaterials() {
    const materials = await this.getAllMaterials();
    return {
      materials: materials.map(material => material.toJSON()),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
  }

  // Import materials data
  async importMaterials(importData) {
    try {
      if (!importData.materials || !Array.isArray(importData.materials)) {
        throw new Error('Invalid import data format');
      }

      const materials = importData.materials.map(data => Material.fromJSON(data));
      
      // Validate all materials
      for (const material of materials) {
        const validation = material.validate();
        if (!validation.isValid) {
          throw new Error(`Invalid material data: ${validation.errors.join(', ')}`);
        }
      }

      await this.saveMaterials(materials);
      return true;
    } catch (error) {
      console.error('Error importing materials:', error);
      throw error;
    }
  }
}

// Create singleton instance
const materialsStorage = new MaterialsStorage();

export default materialsStorage;
export { MaterialsStorage };