/**
 * TOTP Setup Screen - Simplified Version for React 19 Compatibility
 * Allows users to configure TOTP authentication using authenticator apps
 */

// @ts-nocheck
import * as React from 'react';

const { useState } = React;
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AuthService from '../../services/auth/AuthService';

interface TOTPSetupScreenProps {
  route?: { params?: { userId: string } };
}

export const TOTPSetupScreen = ({ route }: TOTPSetupScreenProps) => {
  const navigation = useNavigation();
  const userId = route?.params?.userId || '';
  
  const [loading, setLoading] = useState(false);
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState(1); // 1: setup, 2: verify

  React.useEffect(() => {
    setupTOTP();
  }, []);

  const setupTOTP = async () => {
    try {
      setLoading(true);
      const result = await AuthService.setupTOTP(userId);
      setSecret(result.secret);
      setQrCode(result.qrCode);
    } catch (error: any) {
      Alert.alert('Setup Error', error.message || 'Failed to setup TOTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyTOTP = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-digit verification code');
      return;
    }

    try {
      setLoading(true);
      const isValid = await AuthService.verifyTOTP(userId, verificationCode);
      
      if (isValid) {
        Alert.alert(
          'TOTP Setup Complete',
          'Your authenticator has been successfully configured!',
          [{ text: 'OK', onPress: () => navigation.navigate('BiometricSetup', { userId }) }]
        );
      } else {
        Alert.alert('Verification Failed', 'The code you entered is incorrect. Please try again.');
        setVerificationCode('');
      }
    } catch (error: any) {
      Alert.alert('Verification Error', error.message || 'Failed to verify TOTP code');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !secret) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Setting up authenticator...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Setup Two-Factor Authentication</Text>
        <Text style={styles.subtitle}>Add an extra layer of security to your account</Text>
      </View>

      {step === 1 ? (
        <View style={styles.content}>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepTitle}>Install an Authenticator App</Text>
            <Text style={styles.stepDescription}>
              Download and install an authenticator app like Google Authenticator or Microsoft Authenticator.
            </Text>
          </View>

          <View style={styles.step}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepTitle}>Add DocsShelf to Your App</Text>
            <Text style={styles.stepDescription}>
              Use your authenticator app to scan this QR code or enter the secret key manually:
            </Text>
            
            <View style={styles.qrContainer}>
              <Text style={styles.qrPlaceholder}>📱 QR Code</Text>
              <Text style={styles.qrNote}>QR Code: {qrCode}</Text>
            </View>

            <View style={styles.secretContainer}>
              <Text style={styles.secretLabel}>Secret Key:</Text>
              <Text style={styles.secretText}>{secret}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={() => setStep(2)}
            disabled={loading}
          >
            <Text style={styles.buttonText}>I've Added the Account</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={() => navigation.navigate('BiometricSetup', { userId })}>
            <Text style={styles.skipButtonText}>Skip for Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepTitle}>Verify Your Setup</Text>
            <Text style={styles.stepDescription}>
              Enter the 6-digit code from your authenticator app to complete the setup:
            </Text>
            
            <TextInput
              style={styles.codeInput}
              value={verificationCode}
              onChangeText={setVerificationCode}
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={6}
              textAlign="center"
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={verifyTOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify & Complete Setup</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep(1)}
            disabled={loading}
          >
            <Text style={styles.backButtonText}>Back to Setup</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#1976D2',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#E3F2FD',
    textAlign: 'center',
  },
  content: {
    padding: 24,
  },
  step: {
    marginBottom: 32,
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
    backgroundColor: '#E3F2FD',
    width: 32,
    height: 32,
    borderRadius: 16,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  qrContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  qrPlaceholder: {
    fontSize: 48,
    marginBottom: 8,
  },
  qrNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  secretContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  secretLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
  },
  secretText: {
    fontSize: 16,
    fontFamily: 'monospace',
    color: '#1976D2',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 4,
    textAlign: 'center',
  },
  codeInput: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1976D2',
    borderRadius: 8,
    padding: 16,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  button: {
    backgroundColor: '#1976D2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#90CAF9',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    padding: 16,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 14,
  },
  backButton: {
    alignItems: 'center',
    padding: 16,
  },
  backButtonText: {
    color: '#1976D2',
    fontSize: 14,
  },
});

export default TOTPSetupScreen;