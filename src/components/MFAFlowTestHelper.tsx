/**
 * Quick MFA Flow Test Helper
 * Add this to your testing dashboard to quickly set up MFA scenarios
 */

// @ts-nocheck
import * as React from 'react';
const { useState } = React;
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AuthService from '../services/auth/AuthService';

export const MFAFlowTestHelper = () => {
  const navigation = useNavigation();
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('testpassword123');

  const createTestUser = async () => {
    try {
      // Create a test user
      const result = await AuthService.register({
        email: testEmail,
        password: testPassword,
        firstName: 'Test',
        lastName: 'User',
      });

      Alert.alert(
        'Test User Created!',
        `User created successfully. Now you can:
        
1. Complete TOTP setup (will navigate automatically)
2. Then test login with MFA challenge`,
        [{ text: 'Continue to TOTP Setup' }]
      );

      // This should automatically navigate to TOTP setup
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create test user');
    }
  };

  const testLoginWithMFA = async () => {
    try {
      const result = await AuthService.login({
        email: testEmail,
        password: testPassword,
      });

      if (result.mfaRequired) {
        Alert.alert('Success!', 'MFA is required - will show MFA Challenge screen');
        navigation.navigate('MFAChallenge', { userId: result.user.id });
      } else {
        Alert.alert('Info', 'This user does not have MFA enabled yet');
      }
    } catch (error: any) {
      Alert.alert('Login Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 MFA Flow Test Helper</Text>
      
      <Text style={styles.label}>Test User Credentials:</Text>
      <TextInput
        style={styles.input}
        value={testEmail}
        onChangeText={setTestEmail}
        placeholder="Test email"
      />
      <TextInput
        style={styles.input}
        value={testPassword}
        onChangeText={setTestPassword}
        placeholder="Test password"
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={createTestUser}>
        <Text style={styles.buttonText}>1. Create Test User + Setup MFA</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={testLoginWithMFA}>
        <Text style={styles.buttonText}>2. Test Login with MFA</Text>
      </TouchableOpacity>

      <Text style={styles.instructions}>
        Steps to see MFA flow:
        {'\n'}1. Create test user (auto-navigates to TOTP setup)
        {'\n'}2. Complete TOTP setup process
        {'\n'}3. Use "Test Login" to trigger MFA challenge
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F0F4FF',
    borderRadius: 8,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1565C0',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#1976D2',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  instructions: {
    fontSize: 12,
    color: '#666',
    marginTop: 12,
    lineHeight: 16,
  },
});

export default MFAFlowTestHelper;