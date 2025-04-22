import React, { createContext, useContext, useReducer, useEffect } from "react";

// Helper function to fix image URLs in cart items
const fixImageUrls = (cartItems) => {
  return cartItems.map((item) => {
    // Check if the image URL already starts with http
    if (item.image && !item.image.startsWith("http")) {
      // Add the server base URL
      item.image = `${
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
      }${item.image}`;
    }
    return item;
  });
};

// Initial state
const initialState = {
  cartItems: localStorage.getItem("cartItems")
    ? fixImageUrls(JSON.parse(localStorage.getItem("cartItems")))
    : [],
  totalItems: 0,
  totalPrice: 0,
};

// Create context
const CartContext = createContext(initialState);

// Cart reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case "ADD_TO_CART":
      const item = action.payload;
      const existItem = state.cartItems.find((x) => x._id === item._id);

      let newCartItems;
      if (existItem) {
        newCartItems = state.cartItems.map((x) =>
          x._id === existItem._id
            ? { ...x, quantity: x.quantity + item.quantity }
            : x
        );
      } else {
        newCartItems = [...state.cartItems, item];
      }

      return {
        ...state,
        cartItems: newCartItems,
        totalItems: newCartItems.reduce((acc, item) => acc + item.quantity, 0),
        totalPrice: newCartItems.reduce(
          (acc, item) => acc + item.price * item.quantity,
          0
        ),
      };

    case "REMOVE_FROM_CART":
      const filteredItems = state.cartItems.filter(
        (item) => item._id !== action.payload
      );
      return {
        ...state,
        cartItems: filteredItems,
        totalItems: filteredItems.reduce((acc, item) => acc + item.quantity, 0),
        totalPrice: filteredItems.reduce(
          (acc, item) => acc + item.price * item.quantity,
          0
        ),
      };

    case "UPDATE_QUANTITY":
      const updatedItems = state.cartItems.map((item) =>
        item._id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
      return {
        ...state,
        cartItems: updatedItems,
        totalItems: updatedItems.reduce((acc, item) => acc + item.quantity, 0),
        totalPrice: updatedItems.reduce(
          (acc, item) => acc + item.price * item.quantity,
          0
        ),
      };

    case "CLEAR_CART":
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

  // Calculate totals on initialization
  useEffect(() => {
    if (state.cartItems.length > 0) {
      const totalItems = state.cartItems.reduce(
        (acc, item) => acc + item.quantity,
        0
      );
      const totalPrice = state.cartItems.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );

      if (totalItems !== state.totalItems || totalPrice !== state.totalPrice) {
        dispatch({
          type: "UPDATE_QUANTITY",
          payload: {
            id: state.cartItems[0]._id,
            quantity: state.cartItems[0].quantity,
          },
        });
      }
    }
  }, []);

  // Save cart items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(state.cartItems));
  }, [state.cartItems]);

  // Add item to cart
  const addToCart = (product, quantity = 1) => {
    // Process image URL to ensure it has the full server URL
    let imageUrl = "";
    if (product.images && product.images.length > 0) {
      // Check if the image URL already starts with http
      if (product.images[0].startsWith("http")) {
        imageUrl = product.images[0];
      } else {
        // Add the server base URL
        imageUrl = `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
        }${product.images[0]}`;
      }
    } else {
      // Use a placeholder if no image is available
      imageUrl =
        "https://via.placeholder.com/300x300?text=" +
        encodeURIComponent(product.name || "Product");
    }

    dispatch({
      type: "ADD_TO_CART",
      payload: {
        _id: product._id,
        name: product.name,
        image: imageUrl,
        price: product.price,
        quantity,
      },
    });
  };

  // Remove item from cart
  const removeFromCart = (id) => {
    dispatch({
      type: "REMOVE_FROM_CART",
      payload: id,
    });
  };

  // Update item quantity
  const updateQuantity = (id, quantity) => {
    dispatch({
      type: "UPDATE_QUANTITY",
      payload: { id, quantity },
    });
  };

  // Clear cart
  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" });
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
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export default CartContext;
