import * as React from 'react';
import { Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Screens
import HomeScreen from '../screens/HomeScreen';
import { DocumentsScreen } from '../screens/Documents/DocumentsScreen.simple';
import { DocumentDashboard } from '../screens/Documents/DocumentDashboard';
import { DocumentReviewHub } from '../screens/Documents/DocumentReviewHub';
import { DocumentStorageScreen } from '../screens/Documents/DocumentStorageScreen';
import { SettingsScreen } from '../screens/Settings/SettingsScreen';
import CategoryManagementScreen from '../screens/Documents/CategoryManagementScreen.simple';
import DocumentUploadScreen from '../screens/Documents/DocumentUploadScreen';
import DocumentScannerScreen from '../screens/Documents/DocumentScannerScreen';
import OCRResultsScreen from '../screens/Documents/OCRResultsScreen';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { RegisterScreen } from '../screens/Auth/RegisterScreen';
import TOTPSetupScreen from '../screens/Auth/TOTPSetupScreen';
import BiometricSetupScreen from '../screens/Auth/BiometricSetupScreen';
import MFAChallengeScreen from '../screens/Auth/MFAChallengeScreen';

import type { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#6c757d',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e1e5e9',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DocumentDashboard} 
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📱</Text>,
        }}
      />
      <Tab.Screen 
        name="Documents" 
        component={DocumentsScreen}
        options={{
          tabBarLabel: 'Documents',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📄</Text>,
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings', 
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚙️</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Auth"
      screenOptions={{
        headerShown: true,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Auth" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="MFAChallenge" component={MFAChallengeScreen} />
      <Stack.Screen name="TOTPSetup" component={TOTPSetupScreen} />
      <Stack.Screen name="BiometricSetup" component={BiometricSetupScreen} />
      <Stack.Screen name="CategoryManagement" component={CategoryManagementScreen} options={{ title: 'Manage Categories' }} />
      <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} options={{ title: 'Upload Document' }} />
      <Stack.Screen name="DocumentScanner" component={DocumentScannerScreen} options={{ headerShown: false }} />
      <Stack.Screen name="DocumentReviewHub" component={DocumentReviewHub} options={{ headerShown: false }} />
      <Stack.Screen name="DocumentStorage" component={DocumentStorageScreen} options={{ headerShown: false }} />
      <Stack.Screen name="OCRResults" component={OCRResultsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Main" component={MainTabs} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
