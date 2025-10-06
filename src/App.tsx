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

// Screens
import { LoginScreen } from './screens/Auth/LoginScreen';
import { RegisterScreen } from './screens/Auth/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import CategoryManagementScreen from './screens/Documents/CategoryManagementScreen';
import { DocumentsScreen } from './screens/Documents/DocumentsScreen';
import DocumentUploadScreen from './screens/Documents/DocumentUploadScreen';

const Stack = createStackNavigator();

function AppNavigator() {
  const { user } = useSelector((state: any) => state.auth);

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
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#4A90E2',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {!user ? (
          <>
            <Stack.Screen
              name="Login"
              options={{ headerShown: false }}
            >
              {(props) => (
                <LoginScreen
                  {...props}
                  onNavigateToRegister={() => props.navigation.navigate('Register')}
                  onLoginSuccess={() => {
                    // User state will be updated via Redux, triggering re-render
                  }}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="Register"
              options={{ headerShown: false }}
            >
              {(props) => (
                <RegisterScreen
                  {...props}
                  onNavigateToLogin={() => props.navigation.navigate('Login')}
                  onRegisterSuccess={() => {
                    // User state will be updated via Redux, triggering re-render
                  }}
                />
              )}
            </Stack.Screen>
          </>
        ) : (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: 'DocsShelf' }}
            />
            <Stack.Screen
              name="CategoryManagement"
              component={CategoryManagementScreen}
              options={{ title: 'Manage Categories' }}
            />
            <Stack.Screen
              name="Documents"
              component={DocumentsScreen}
              options={{ title: 'Documents' }}
            />
            <Stack.Screen
              name="DocumentUpload"
              component={DocumentUploadScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppNavigator />
    </Provider>
  );
}
