import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const CartContext = createContext();

// Cart actions
const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  REMOVE_ITEM: 'REMOVE_ITEM',
  CLEAR_CART: 'CLEAR_CART',
  LOAD_CART: 'LOAD_CART',
  SET_SHIPPING: 'SET_SHIPPING'
};

// Cart reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.ADD_ITEM: {
      const { item } = action.payload;
      const existingItem = state.items.find(cartItem => cartItem.id === item.id);
      
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(cartItem =>
            cartItem.id === item.id
              ? { ...cartItem, quantity: cartItem.quantity + 1, subtotal: (cartItem.quantity + 1) * cartItem.unitPrice }
              : cartItem
          )
        };
      } else {
        const newItem = {
          id: item.id,
          productId: item.id,
          productName: item.getLocalizedName ? item.getLocalizedName('en') : item.name?.en || item.name,
          productImage: item.imageUrl || '',
          quantity: 1,
          unitPrice: item.price,
          subtotal: item.price,
          unit: item.unit,
          category: item.category
        };
        
        return {
          ...state,
          items: [...state.items, newItem]
        };
      }
    }
    
    case CART_ACTIONS.UPDATE_QUANTITY: {
      const { itemId, quantity } = action.payload;
      
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.id !== itemId)
        };
      }
      
      return {
        ...state,
        items: state.items.map(item =>
          item.id === itemId
            ? { ...item, quantity, subtotal: quantity * item.unitPrice }
            : item
        )
      };
    }
    
    case CART_ACTIONS.REMOVE_ITEM: {
      const { itemId } = action.payload;
      return {
        ...state,
        items: state.items.filter(item => item.id !== itemId)
      };
    }
    
    case CART_ACTIONS.CLEAR_CART: {
      return {
        ...state,
        items: []
      };
    }
    
    case CART_ACTIONS.LOAD_CART: {
      const { cartData } = action.payload;
      return {
        ...state,
        ...cartData
      };
    }
    
    case CART_ACTIONS.SET_SHIPPING: {
      const { shipping } = action.payload;
      return {
        ...state,
        shipping
      };
    }
    
    default:
      return state;
  }
};

// Initial cart state
const initialCartState = {
  items: [],
  subtotal: 0,
  tax: 0,
  shipping: 0,
  totalAmount: 0,
  lastUpdated: new Date()
};

// Cart storage key
const CART_STORAGE_KEY = 'farmtech_cart';

export const CartProvider = ({ children }) => {
  const [cartState, dispatch] = useReducer(cartReducer, initialCartState);

  // Calculate totals whenever items change
  const calculatedTotals = React.useMemo(() => {
    const subtotal = cartState.items.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = subtotal * 0.05; // 5% tax
    const totalAmount = subtotal + tax + cartState.shipping;
    
    return {
      subtotal,
      tax,
      totalAmount
    };
  }, [cartState.items, cartState.shipping]);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const cartData = JSON.parse(savedCart);
        dispatch({ type: CART_ACTIONS.LOAD_CART, payload: { cartData } });
      }
    } catch (error) {
      console.error('Error loading cart from storage:', error);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      const cartToSave = {
        ...cartState,
        ...calculatedTotals,
        lastUpdated: new Date()
      };
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartToSave));
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  }, [cartState, calculatedTotals]);

  // Cart actions
  const addToCart = (item) => {
    dispatch({ type: CART_ACTIONS.ADD_ITEM, payload: { item } });
    toast.success(`${item.getLocalizedName ? item.getLocalizedName('en') : item.name} added to cart`);
  };

  const updateQuantity = (itemId, quantity) => {
    dispatch({ type: CART_ACTIONS.UPDATE_QUANTITY, payload: { itemId, quantity } });
  };

  const removeFromCart = (itemId) => {
    const item = cartState.items.find(item => item.id === itemId);
    if (item) {
      dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: { itemId } });
      toast.success(`${item.productName} removed from cart`);
    }
  };

  const clearCart = () => {
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
    toast.success('Cart cleared');
  };

  const setShipping = (shipping) => {
    dispatch({ type: CART_ACTIONS.SET_SHIPPING, payload: { shipping } });
  };

  const getCartItemCount = () => {
    return cartState.items.reduce((count, item) => count + item.quantity, 0);
  };

  const getCartItem = (itemId) => {
    return cartState.items.find(item => item.id === itemId);
  };

  const isInCart = (itemId) => {
    return cartState.items.some(item => item.id === itemId);
  };

  const getItemQuantity = (itemId) => {
    const item = cartState.items.find(item => item.id === itemId);
    return item ? item.quantity : 0;
  };

  // Create order data for checkout
  const createOrderData = (userId) => {
    return {
      id: `order_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      farmerId: userId,
      items: cartState.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal
      })),
      subtotal: calculatedTotals.subtotal,
      tax: calculatedTotals.tax,
      shipping: cartState.shipping,
      totalAmount: calculatedTotals.totalAmount,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  };

  const contextValue = {
    // State
    cartItems: cartState.items,
    itemCount: getCartItemCount(),
    subtotal: calculatedTotals.subtotal,
    tax: calculatedTotals.tax,
    shipping: cartState.shipping,
    totalAmount: calculatedTotals.totalAmount,
    
    // Actions
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    setShipping,
    
    // Utilities
    getCartItem,
    isInCart,
    getItemQuantity,
    createOrderData
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;