import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Screens
import HomeScreen from '../screens/HomeScreen';
import { DocumentsScreen } from '../screens/Documents/DocumentsScreen';
import { SettingsScreen } from '../screens/Settings/SettingsScreen';
import CategoryManagementScreen from '../screens/Documents/CategoryManagementScreen';
import DocumentUploadScreen from '../screens/Documents/DocumentUploadScreen';
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
        tabBarActiveTintColor: '#1976D2',
        tabBarInactiveTintColor: '#757575',
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Documents" component={DocumentsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
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
      <Stack.Screen name="Main" component={MainTabs} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
