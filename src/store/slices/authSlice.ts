import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, User, AuthToken, BiometricType } from '../../types';

/**
 * Authentication State Management
 * 
 * Handles user authentication, MFA, biometrics, and session management
 * with secure token storage and biometric authentication support.
 */

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  biometricAvailable: false,
  mfaRequired: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Authentication Actions
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; token: AuthToken }>) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
      state.mfaRequired = false;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.mfaRequired = false;
      state.error = null;
    },

    // Registration Actions
    registerStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    registerSuccess: (state, action: PayloadAction<{ user: User; token: AuthToken }>) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
    },
    registerFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // MFA Actions
    setMfaRequired: (state, action: PayloadAction<boolean>) => {
      state.mfaRequired = action.payload;
    },
    mfaSuccess: (state, action: PayloadAction<AuthToken>) => {
      state.token = action.payload;
      state.mfaRequired = false;
      state.isAuthenticated = true;
    },
    mfaFailure: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },

    // Biometric Actions
    setBiometricAvailable: (state, action: PayloadAction<BiometricType | false>) => {
      state.biometricAvailable = action.payload !== false;
    },
    
    // User Profile Actions
    updateUserProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    
    // Token Management
    updateToken: (state, action: PayloadAction<AuthToken>) => {
      state.token = action.payload;
    },
    clearToken: (state) => {
      state.token = null;
      state.isAuthenticated = false;
    },

    // Error Handling
    clearError: (state) => {
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },

    // Loading State
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Session Management
    refreshSession: (state) => {
      // Reset session timeout and update last activity
      if (state.user && state.token) {
        state.user.updatedAt = new Date().toISOString();
      }
    },
    sessionExpired: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.error = 'Session expired. Please login again.';
    },
  },
});

// Export actions
export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  registerStart,
  registerSuccess,
  registerFailure,
  setMfaRequired,
  mfaSuccess,
  mfaFailure,
  setBiometricAvailable,
  updateUserProfile,
  updateToken,
  clearToken,
  clearError,
  setError,
  setLoading,
  refreshSession,
  sessionExpired,
} = authSlice.actions;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectAuthToken = (state: { auth: AuthState }) => state.auth.token;
export const selectBiometricAvailable = (state: { auth: AuthState }) => state.auth.biometricAvailable;
export const selectMfaRequired = (state: { auth: AuthState }) => state.auth.mfaRequired;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;

// Export reducer
export default authSlice.reducer;