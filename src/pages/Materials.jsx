import { useState, useMemo } from 'react';
import { useAuth } from '../contexts/FastAuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useMaterialsCache } from '../hooks/useMaterialsCache';
import { toast } from 'react-hot-toast';
import AdminMaterialsManager from '../components/admin/AdminMaterialsManager';
import PaymentVerificationForm from '../components/payment/PaymentVerificationForm';
import CropFormSubmission from '../components/forms/CropFormSubmission';
import { 
  ShoppingCart, 
  Package, 
  Grid,
  List,
  Droplets,
  Wrench,
  Search,
  Filter,
  Tag,
  Plus,
  Minus,
  X,
  CreditCard,
  ArrowLeft,
  FileText
} from 'lucide-react';

const Materials = () => {
  const { userProfile } = useAuth();
  const { t } = useLanguage();
  const { materials, loading, error } = useMaterialsCache();
  
  // Cart state
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showCropForm, setShowCropForm] = useState(false);
  
  // Filter and view state
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  // Check if user is admin
  const isAdmin = userProfile?.role === 'admin';

  // Cart calculations
  const cartTotal = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.05; // 5% tax
    const shipping = subtotal > 1000 ? 0 : 50; // Free shipping over ₹1000
    return {
      subtotal,
      tax,
      shipping,
      total: subtotal + tax + shipping
    };
  }, [cartItems]);

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    let filtered = [...materials];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(material => {
        const name = material.getLocalizedName('en').toLowerCase();
        const description = material.getLocalizedDescription('en').toLowerCase();
        const category = material.category.toLowerCase();
        return name.includes(query) || description.includes(query) || category.includes(query);
      });
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(material => material.category === selectedCategory);
    }

    // Price range filter
    if (priceRange.min !== '') {
      filtered = filtered.filter(material => material.price >= parseFloat(priceRange.min));
    }
    if (priceRange.max !== '') {
      filtered = filtered.filter(material => material.price <= parseFloat(priceRange.max));
    }

    // Sort materials
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.getLocalizedName('en').localeCompare(b.getLocalizedName('en'));
        case 'price_low':
          return a.price - b.price;
        case 'price_high':
          return b.price - a.price;
        case 'category':
          return a.category.localeCompare(b.category);
        case 'stock':
          return b.stock - a.stock;
        default:
          return 0;
      }
    });

    return filtered;
  }, [materials, searchQuery, selectedCategory, priceRange, sortBy]);

  // Cart functions
  const addToCart = (material) => {
    if (!material.isInStock()) {
      toast.error('Out of stock');
      return;
    }

    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === material.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === material.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, {
          id: material.id,
          name: material.getLocalizedName('en'),
          price: material.price,
          unit: material.unit,
          imageUrl: material.imageUrl,
          quantity: 1
        }];
      }
    });
    toast.success(`${material.getLocalizedName('en')} added to cart`);
  };

  const updateCartQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (itemId) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
    toast.success('Item removed from cart');
  };

  const clearCart = () => {
    setCartItems([]);
    toast.success('Cart cleared');
  };

  const getCartQuantity = (materialId) => {
    const cartItem = cartItems.find(item => item.id === materialId);
    return cartItem ? cartItem.quantity : 0;
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
    setSortBy('name');
  };

  // Show admin interface for admin users
  if (isAdmin) {
    return <AdminMaterialsManager />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading materials...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error loading materials</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Cart Button */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Agricultural Store</h1>
              <p className="text-gray-600">Quality materials for your farming needs</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowCropForm(true)}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center space-x-2"
              >
                <FileText className="h-5 w-5" />
                <span>Submit Crop Form</span>
              </button>
              <button
                onClick={() => setShowCart(true)}
                className="relative bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 flex items-center space-x-2"
              >
                <ShoppingCart className="h-5 w-5" />
                <span>Cart</span>
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Store Header */}
        <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-6 rounded-lg mb-6">
          <h2 className="text-3xl font-bold mb-2">Agricultural Materials</h2>
          <p className="text-green-100">Pesticides, tools, and equipment for modern farming</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search materials..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setSelectedCategory('')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium ${
                !selectedCategory ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Package className="h-4 w-4" />
              <span>All Products</span>
            </button>
            
            <button
              onClick={() => setSelectedCategory('pesticides')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium ${
                selectedCategory === 'pesticides' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Droplets className="h-4 w-4" />
              <span>Pesticides</span>
            </button>
            
            <button
              onClick={() => setSelectedCategory('tools')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium ${
                selectedCategory === 'tools' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Wrench className="h-4 w-4" />
              <span>Tools</span>
            </button>
          </div>

          {/* Price Range and Clear Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Tag className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Price Range:</span>
            </div>
            <input
              type="number"
              placeholder="Min ₹"
              value={priceRange.min}
              onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
              className="px-3 py-1 border rounded text-sm w-24"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              placeholder="Max ₹"
              value={priceRange.max}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
              className="px-3 py-1 border rounded text-sm w-24"
            />
            {(searchQuery || selectedCategory || priceRange.min || priceRange.max) && (
              <button
                onClick={clearFilters}
                className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-800"
              >
                <Filter className="h-4 w-4" />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* View Controls */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            {filteredMaterials.length} materials found
          </p>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="p-2 border rounded text-sm"
              >
                <option value="name">Name</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="category">Category</option>
                <option value="stock">Stock</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'bg-gray-100'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'bg-gray-100'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Materials Grid/List */}
        {filteredMaterials.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No materials found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {filteredMaterials.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                viewMode={viewMode}
                cartQuantity={getCartQuantity(material.id)}
                onAddToCart={() => addToCart(material)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Crop Form Submission Modal */}
      {showCropForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-6xl max-h-[95vh] overflow-y-auto">
            <CropFormSubmission
              onClose={() => setShowCropForm(false)}
              onSuccess={(submission) => {
                setShowCropForm(false);
                toast.success('Crop form submitted successfully! Admin will review it soon.');
              }}
            />
          </div>
        </div>
      )}

      {/* Payment Verification Form Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            <PaymentVerificationForm
              orderDetails={cartItems}
              totalAmount={cartTotal.total}
              onBack={() => {
                setShowPaymentForm(false);
                setShowCart(true);
              }}
              onSuccess={(submission) => {
                setShowPaymentForm(false);
                clearCart();
                toast.success('Payment verification submitted! You will be notified once verified.');
              }}
            />
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Cart Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Shopping Cart</h2>
              <button 
                onClick={() => setShowCart(false)} 
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Cart Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {cartItems.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                  <p className="text-gray-600">Add some materials to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      {item.imageUrl && (
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{item.name}</h4>
                        <p className="text-gray-600">₹{item.price} per {item.unit}</p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-primary-600">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cartItems.length > 0 && (
              <div className="border-t p-6">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>₹{cartTotal.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax (5%):</span>
                    <span>₹{cartTotal.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping:</span>
                    <span>{cartTotal.shipping === 0 ? 'Free' : `₹${cartTotal.shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-primary-600">₹{cartTotal.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={clearCart}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 font-medium"
                  >
                    Clear Cart
                  </button>
                  <button
                    onClick={() => {
                      setShowCart(false);
                      setShowPaymentForm(true);
                    }}
                    className="flex-1 bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 font-medium flex items-center justify-center space-x-2"
                  >
                    <CreditCard className="h-5 w-5" />
                    <span>Proceed to Payment</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Material Card Component
const MaterialCard = ({ material, viewMode, cartQuantity, onAddToCart }) => {
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-4">
          {material.imageUrl && (
            <img
              src={material.imageUrl}
              alt={material.getLocalizedName('en')}
              className="w-20 h-20 object-cover rounded-lg"
            />
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {material.getLocalizedName('en')}
            </h3>
            <p className="text-gray-600 text-sm mt-1 line-clamp-2">
              {material.getLocalizedDescription('en')}
            </p>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-sm text-gray-500">{material.category}</span>
              <span className="text-sm text-gray-500">Stock: {material.stock}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-xl font-bold text-primary-600">₹{material.price}</div>
              <div className="text-sm text-gray-500">per {material.unit}</div>
            </div>

            <div className="flex items-center space-x-2">
              {cartQuantity > 0 && (
                <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded-full text-sm">
                  {cartQuantity} in cart
                </span>
              )}
              <button
                onClick={onAddToCart}
                disabled={!material.isInStock()}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium ${
                  material.isInStock()
                    ? 'bg-primary-500 text-white hover:bg-primary-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <ShoppingCart className="h-4 w-4" />
                <span>{material.isInStock() ? 'Add to Cart' : 'Out of Stock'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
      {material.imageUrl && (
        <img
          src={material.imageUrl}
          alt={material.getLocalizedName('en')}
          className="w-full h-48 object-cover"
        />
      )}
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {material.getLocalizedName('en')}
          </h3>
          {cartQuantity > 0 && (
            <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded-full text-xs ml-2">
              {cartQuantity}
            </span>
          )}
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-3">
          {material.getLocalizedDescription('en')}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Category</span>
            <span className="font-medium">{material.getCategoryDisplayName('en')}</span>
          </div>
          
          {material.brand && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Brand</span>
              <span className="font-medium">{material.brand}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Stock</span>
            <span className={`font-medium ${material.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {material.stock} {material.unit}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            {material.marketPrice && material.marketPrice !== material.price && (
              <div className="text-sm text-gray-500 line-through">
                ₹{material.marketPrice}
              </div>
            )}
            <div className="text-xl font-bold text-primary-600">₹{material.price}</div>
            <div className="text-sm text-gray-500">per {material.unit}</div>
            {material.marketPrice && material.marketPrice !== material.price && (
              <div className="text-xs text-green-600 font-medium">
                Save ₹{(material.marketPrice - material.price).toFixed(2)}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onAddToCart}
          disabled={!material.isInStock()}
          className={`w-full flex items-center justify-center space-x-2 py-2 rounded-lg font-medium ${
            material.isInStock()
              ? 'bg-primary-500 text-white hover:bg-primary-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          <span>{material.isInStock() ? 'Add to Cart' : 'Out of Stock'}</span>
        </button>
      </div>
    </div>
  );
};

export default Materials;