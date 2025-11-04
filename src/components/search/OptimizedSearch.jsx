import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { debounce } from '../../utils/performanceOptimization';
import { useLanguage } from '../../contexts/LanguageContext';

const OptimizedSearch = ({ 
  materials, 
  onFilteredResults, 
  placeholder = "Search materials...",
  showFilters = true 
}) => {
  const { t, currentLanguage } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    priceRange: { min: '', max: '' },
    inStock: false
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Memoized categories for better performance
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(materials.map(m => m.category))];
    return uniqueCategories.filter(Boolean);
  }, [materials]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query, currentFilters) => {
      let filtered = [...materials];

      // Text search
      if (query.trim()) {
        const searchTerm = query.toLowerCase();
        filtered = filtered.filter(material => {
          const name = material.getLocalizedName(currentLanguage).toLowerCase();
          const description = material.getLocalizedDescription(currentLanguage).toLowerCase();
          const category = material.category.toLowerCase();
          
          return name.includes(searchTerm) || 
                 description.includes(searchTerm) || 
                 category.includes(searchTerm);
        });
      }

      // Category filter
      if (currentFilters.category) {
        filtered = filtered.filter(m => m.category === currentFilters.category);
      }

      // Price range filter
      if (currentFilters.priceRange.min) {
        filtered = filtered.filter(m => m.price >= parseFloat(currentFilters.priceRange.min));
      }
      if (currentFilters.priceRange.max) {
        filtered = filtered.filter(m => m.price <= parseFloat(currentFilters.priceRange.max));
      }

      // Stock filter
      if (currentFilters.inStock) {
        filtered = filtered.filter(m => m.isInStock());
      }

      onFilteredResults(filtered);
    }, 300),
    [materials, currentLanguage, onFilteredResults]
  );

  // Effect to trigger search when query or filters change
  useEffect(() => {
    debouncedSearch(searchQuery, filters);
  }, [searchQuery, filters, debouncedSearch]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handlePriceRangeChange = (type, value) => {
    setFilters(prev => ({
      ...prev,
      priceRange: {
        ...prev.priceRange,
        [type]: value
      }
    }));
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      priceRange: { min: '', max: '' },
      inStock: false
    });
    setSearchQuery('');
  };

  const hasActiveFilters = filters.category || 
                          filters.priceRange.min || 
                          filters.priceRange.max || 
                          filters.inStock ||
                          searchQuery;

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {showFilters && (
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded ${
              showAdvancedFilters || hasActiveFilters
                ? 'text-primary-600 bg-primary-50'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Filter className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && showAdvancedFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('category', 'Category')}
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
              >
                <option value="">{t('allCategories', 'All Categories')}</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('priceRange', 'Price Range')}
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.priceRange.min}
                  onChange={(e) => handlePriceRangeChange('min', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.priceRange.max}
                  onChange={(e) => handlePriceRangeChange('max', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Stock Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('availability', 'Availability')}
              </label>
              <label className="flex items-center space-x-2 p-2">
                <input
                  type="checkbox"
                  checked={filters.inStock}
                  onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">
                  {t('inStockOnly', 'In Stock Only')}
                </span>
              </label>
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
              >
                {t('clearFilters', 'Clear Filters')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchQuery && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800">
              Search: "{searchQuery}"
              <button
                onClick={clearSearch}
                className="ml-2 text-primary-600 hover:text-primary-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.category && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              Category: {filters.category}
              <button
                onClick={() => handleFilterChange('category', '')}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {(filters.priceRange.min || filters.priceRange.max) && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
              Price: ₹{filters.priceRange.min || '0'} - ₹{filters.priceRange.max || '∞'}
              <button
                onClick={() => handlePriceRangeChange('min', '') || handlePriceRangeChange('max', '')}
                className="ml-2 text-green-600 hover:text-green-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.inStock && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
              In Stock Only
              <button
                onClick={() => handleFilterChange('inStock', false)}
                className="ml-2 text-yellow-600 hover:text-yellow-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default OptimizedSearch;