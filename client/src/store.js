import { configureStore } from '@reduxjs/toolkit';


// Example product reducer (expand as needed)
const initialState = {};
function productReducer(state = initialState, action) {
  switch (action.type) {
    case 'PRODUCT_CREATE_REQUEST':
      return { ...state, loading: true };
    case 'PRODUCT_CREATE_SUCCESS':
      return { ...state, loading: false, product: action.payload };
    case 'PRODUCT_CREATE_FAIL':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

const store = configureStore({
  reducer: {
    product: productReducer,
  },
});

export default store;
