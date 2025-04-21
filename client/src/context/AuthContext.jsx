import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

// Initial state
const initialState = {
  user: localStorage.getItem('user')
    ? JSON.parse(localStorage.getItem('user'))
    : null,
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null,
  isAuthenticated: localStorage.getItem('token') ? true : false,
};

// Create context
const AuthContext = createContext(initialState);

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_REQUEST':
    case 'REGISTER_REQUEST':
    case 'USER_DETAILS_REQUEST':
      return {
        ...state,
        loading: true,
        error: null,
      };
      
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.data,
        token: action.payload.token,
        error: null,
      };
      
    case 'USER_DETAILS_SUCCESS':
      return {
        ...state,
        loading: false,
        user: action.payload,
      };
      
    case 'LOGIN_FAIL':
    case 'REGISTER_FAIL':
    case 'USER_DETAILS_FAIL':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
      
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
      };
      
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
      
    default:
      return state;
  }
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  // Set auth token in axios headers
  useEffect(() => {
    if (state.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
      localStorage.setItem('token', state.token);
      localStorage.setItem('user', JSON.stringify(state.user));
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, [state.token, state.user]);
  
  // Login user
  const login = async (email, password) => {
    try {
      dispatch({ type: 'LOGIN_REQUEST' });
      
      const { data } = await axios.post('/api/auth/login', { email, password });
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: data,
      });
      
      return data;
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAIL',
        payload: error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
      });
      throw error;
    }
  };
  
  // Register user
  const register = async (name, email, password) => {
    try {
      dispatch({ type: 'REGISTER_REQUEST' });
      
      const { data } = await axios.post('/api/auth/register', { name, email, password });
      
      dispatch({
        type: 'REGISTER_SUCCESS',
        payload: data,
      });
      
      return data;
    } catch (error) {
      dispatch({
        type: 'REGISTER_FAIL',
        payload: error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
      });
      throw error;
    }
  };
  
  // Logout user
  const logout = async () => {
    try {
      await axios.get('/api/auth/logout');
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout error:', error);
      dispatch({ type: 'LOGOUT' });
    }
  };
  
  // Get user details
  const getUserDetails = async () => {
    try {
      dispatch({ type: 'USER_DETAILS_REQUEST' });
      
      const { data } = await axios.get('/api/auth/me');
      
      dispatch({
        type: 'USER_DETAILS_SUCCESS',
        payload: data.data,
      });
      
      return data;
    } catch (error) {
      dispatch({
        type: 'USER_DETAILS_FAIL',
        payload: error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
      });
      throw error;
    }
  };
  
  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };
  
  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        loading: state.loading,
        error: state.error,
        login,
        register,
        logout,
        getUserDetails,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
