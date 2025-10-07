// @ts-nocheck
/**
 * DocsShelf v4 - Main App with Navigation
 * React 18 + Expo SDK 52 - Fully Compatible
 */

import React, { useEffect } from 'react';
import { Provider, useSelector } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { store } from './store/store';
import DatabaseService from './services/database/DatabaseService';
import AppNavigator from './navigation/AppNavigator';

function AppContent() {
  useEffect(() => {
    // Initialize database when app starts
    const initDatabase = async () => {
      try {
        await DatabaseService.initialize();
        console.log('✅ Database initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize database:', error);
      }
    };

    initDatabase();
  }, []);

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
