/**
 * DocsShelf v5 - Main App with Navigation
 * React 19 + Expo SDK 54 - Simplified Compatible Version
 */

import React from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { store } from './store/store';
import DatabaseService from './services/database/DatabaseService';
import AppNavigator from './navigation/AppNavigator';

// Initialize database immediately
(async () => {
  try {
    await DatabaseService.getInstance().initialize();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
  }
})();

export default function App() {
  return (
    <Provider store={store} children={
      <NavigationContainer children={
        <AppNavigator />
      } />
    } />
  );
}
