import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Initial state
const initialState = {
  cartItems: localStorage.getItem('cartItems')
    ? JSON.parse(localStorage.getItem('cartItems'))
    : [],
  totalItems: 0,
  totalPrice: 0,
};

// Create context
const CartContext = createContext(initialState);

// Cart reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART':
      const item = action.payload;
      const existItem = state.cartItems.find(x => x._id === item._id);
      
      let newCartItems;
      if (existItem) {
        newCartItems = state.cartItems.map(x =>
          x._id === existItem._id ? { ...x, quantity: x.quantity + item.quantity } : x
        );
      } else {
        newCartItems = [...state.cartItems, item];
      }
      
      return {
        ...state,
        cartItems: newCartItems,
        totalItems: newCartItems.reduce((acc, item) => acc + item.quantity, 0),
        totalPrice: newCartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
      };
      
    case 'REMOVE_FROM_CART':
      const filteredItems = state.cartItems.filter(item => item._id !== action.payload);
      return {
        ...state,
        cartItems: filteredItems,
        totalItems: filteredItems.reduce((acc, item) => acc + item.quantity, 0),
        totalPrice: filteredItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
      };
      
    case 'UPDATE_QUANTITY':
      const updatedItems = state.cartItems.map(item =>
        item._id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
      return {
        ...state,
        cartItems: updatedItems,
        totalItems: updatedItems.reduce((acc, item) => acc + item.quantity, 0),
        totalPrice: updatedItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
      };
      
    case 'CLEAR_CART':
      return {
        ...state,
        cartItems: [],
        totalItems: 0,
        totalPrice: 0,
      };
      
    default:
      return state;
  }
};

// Provider component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  
  // Save cart items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
  }, [state.cartItems]);
  
  // Add item to cart
  const addToCart = (product, quantity = 1) => {
    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        _id: product._id,
        name: product.name,
        image: product.images[0],
        price: product.price,
        quantity,
      },
    });
  };
  
  // Remove item from cart
  const removeFromCart = (id) => {
    dispatch({
      type: 'REMOVE_FROM_CART',
      payload: id,
    });
  };
  
  // Update item quantity
  const updateQuantity = (id, quantity) => {
    dispatch({
      type: 'UPDATE_QUANTITY',
      payload: { id, quantity },
    });
  };
  
  // Clear cart
  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };
  
  return (
    <CartContext.Provider
      value={{
        cartItems: state.cartItems,
        totalItems: state.totalItems,
        totalPrice: state.totalPrice,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
