import { useState, useEffect, useCallback } from 'react';
import materialsStorage from '../utils/materialsStorage';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useMaterialsCache = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const isCacheValid = useCallback(() => {
    if (!lastFetch) return false;
    return Date.now() - lastFetch < CACHE_DURATION;
  }, [lastFetch]);

  const fetchMaterials = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedMaterials = await materialsStorage.getAllMaterials();
      setMaterials(fetchedMaterials);
      setLastFetch(Date.now());
      
      return fetchedMaterials;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching materials:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshMaterials = useCallback(() => {
    return fetchMaterials(true);
  }, [fetchMaterials]);

  const addMaterialToCache = useCallback((newMaterial) => {
    setMaterials(prev => [newMaterial, ...prev]);
  }, []);

  const updateMaterialInCache = useCallback((materialId, updatedData) => {
    setMaterials(prev => 
      prev.map(material => 
        material.id === materialId 
          ? { ...material, ...updatedData, updatedAt: new Date() }
          : material
      )
    );
  }, []);

  const removeMaterialFromCache = useCallback((materialId) => {
    setMaterials(prev => prev.filter(material => material.id !== materialId));
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, []); // Empty dependency array to run only once on mount

  return {
    materials,
    loading,
    error,
    fetchMaterials,
    refreshMaterials,
    addMaterialToCache,
    updateMaterialInCache,
    removeMaterialFromCache,
    isCacheValid: isCacheValid()
  };
};