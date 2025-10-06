/**
 * Global Type Declarations for DocsShelf v4
 * 
 * This file provides global type declarations and environment variables
 * that are used throughout the React Native application.
 */

// React Native Global Types
declare var __DEV__: boolean;

// Global Console (for React Native)
declare var console: {
  log(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
  info(...args: any[]): void;
  debug(...args: any[]): void;
  trace(...args: any[]): void;
};

// React Native Fetch API
declare function fetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response>;

// Global Navigator (for React Native)
declare var navigator: any;

// HermesJS Global (if using Hermes engine)
declare var HermesInternal: any;

// React Navigation Types Extension
declare global {
  namespace ReactNavigation {
    interface RootParamList {
      Splash: undefined;
      Onboarding: undefined;
      Auth: undefined;
      Main: undefined;
      DocumentViewer: { documentId: string };
      Scanner: { categoryId?: string; folderId?: string };
      Settings: undefined;
    }
  }
}

// Module Declarations for Libraries (temporary until dependencies are installed)
declare module 'react' {
  import * as React from 'react';
  export = React;
}

declare module 'react-native' {
  export * from 'react-native';
}

declare module '@reduxjs/toolkit' {
  export * from '@reduxjs/toolkit';
}

declare module 'react-redux' {
  export * from 'react-redux';
}

declare module 'redux-persist' {
  export * from 'redux-persist';
}

declare module '@react-navigation/native' {
  export * from '@react-navigation/native';
}

declare module '@react-navigation/native-stack' {
  export * from '@react-navigation/native-stack';
}

declare module '@react-navigation/bottom-tabs' {
  export * from '@react-navigation/bottom-tabs';
}

declare module 'react-native-paper' {
  export * from 'react-native-paper';
}

declare module 'react-native-safe-area-context' {
  export * from 'react-native-safe-area-context';
}

declare module '@react-native-async-storage/async-storage' {
  export * from '@react-native-async-storage/async-storage';
}

declare module 'redux-persist/integration/react' {
  export * from 'redux-persist/integration/react';
}

declare module 'redux-persist-transform-encrypt' {
  export * from 'redux-persist-transform-encrypt';
}

// Environment Variables
declare module '@/config/env' {
  interface Env {
    NODE_ENV: 'development' | 'production' | 'test';
    API_BASE_URL: string;
    APP_VERSION: string;
    BUILD_NUMBER: string;
  }
  
  const env: Env;
  export default env;
}

// Asset Types
declare module '*.png' {
  const value: any;
  export default value;
}

declare module '*.jpg' {
  const value: any;
  export default value;
}

declare module '*.jpeg' {
  const value: any;
  export default value;
}

declare module '*.svg' {
  const value: any;
  export default value;
}

declare module '*.json' {
  const value: any;
  export default value;
}

// JSX Runtime
declare module 'react/jsx-runtime' {
  export * from 'react/jsx-runtime';
}

declare module 'react/jsx-dev-runtime' {
  export * from 'react/jsx-dev-runtime';
}

export {};