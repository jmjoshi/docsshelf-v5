/**
 * MFA Challenge Screen - Handles TOTP and Biometric authentication challenges
 * Used during login when user has MFA enabled
 */

// @ts-nocheck
import * as React from 'react';

const { useState } = React;
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import AuthService from '../../services/auth/AuthService';
import { loginSuccess } from '../../store/slices/authSlice';

interface MFAChallengeScreenProps {
  route?: { params?: { userId: string } };
}

export const MFAChallengeScreen = ({ route }: MFAChallengeScreenProps) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const userId = route?.params?.userId || '';
  
  const [loading, setLoading] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [preferredMethod, setPreferredMethod] = useState<'totp' | 'biometric'>('totp');

  React.useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const availability = await AuthService.checkBiometricAvailability();
      setBiometricAvailable(availability.isAvailable && availability.isEnrolled);
      
      // Default to biometric if available, otherwise TOTP
      if (availability.isAvailable && availability.isEnrolled) {
        setPreferredMethod('biometric');
        // Auto-trigger biometric prompt
        setTimeout(() => authenticateWithBiometric(), 500);
      }
    } catch (error) {
      console.error('Biometric availability check failed:', error);
      setBiometricAvailable(false);
    }
  };

  const authenticateWithTOTP = async () => {
    if (!totpCode || totpCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-digit verification code');
      return;
    }

    try {
      setLoading(true);
      const isValid = await AuthService.verifyTOTP(userId, totpCode);
      
      if (isValid) {
        // MFA successful, complete login
        dispatch(loginSuccess({ user: { id: userId }, token: null }));
        navigation.navigate('Main');
      } else {
        Alert.alert('Invalid Code', 'The verification code is incorrect. Please try again.');
        setTotpCode('');
      }
    } catch (error: any) {
      Alert.alert('Verification Error', error.message || 'Failed to verify code');
      setTotpCode('');
    } finally {
      setLoading(false);
    }
  };

  const authenticateWithBiometric = async () => {
    try {
      setLoading(true);
      const result = await AuthService.authenticateWithBiometric();
      
      if (result.success) {
        // Biometric authentication successful, complete login
        dispatch(loginSuccess({ user: { id: userId }, token: null }));
        navigation.navigate('Main');
      } else {
        Alert.alert(
          'Authentication Failed', 
          result.error || 'Biometric authentication failed',
          [
            { text: 'Try Again', onPress: () => setLoading(false) },
            { text: 'Use Code Instead', onPress: () => {
                setPreferredMethod('totp');
                setLoading(false);
              }
            }
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Authentication Error', error.message || 'Failed to authenticate');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Two-Factor Authentication</Text>
        <Text style={styles.subtitle}>Please verify your identity to continue</Text>
      </View>

      <View style={styles.content}>
        {preferredMethod === 'biometric' && biometricAvailable ? (
          <View style={styles.biometricSection}>
            <Text style={styles.biometricIcon}>🔐</Text>
            <Text style={styles.sectionTitle}>Biometric Authentication</Text>
            <Text style={styles.sectionDescription}>
              Use your fingerprint or face ID to authenticate
            </Text>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={authenticateWithBiometric}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Authenticate</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setPreferredMethod('totp')}
              disabled={loading}
            >
              <Text style={styles.switchButtonText}>Use Authenticator Code Instead</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.totpSection}>
            <Text style={styles.totpIcon}>📱</Text>
            <Text style={styles.sectionTitle}>Authenticator Code</Text>
            <Text style={styles.sectionDescription}>
              Enter the 6-digit code from your authenticator app
            </Text>

            <TextInput
              style={styles.codeInput}
              value={totpCode}
              onChangeText={setTotpCode}
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={6}
              textAlign="center"
              editable={!loading}
              autoFocus={preferredMethod === 'totp'}
            />

            <TouchableOpacity
              style={[styles.button, (!totpCode || loading) && styles.buttonDisabled]}
              onPress={authenticateWithTOTP}
              disabled={!totpCode || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify Code</Text>
              )}
            </TouchableOpacity>

            {biometricAvailable && (
              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => {
                  setPreferredMethod('biometric');
                  setTimeout(() => authenticateWithBiometric(), 100);
                }}
                disabled={loading}
              >
                <Text style={styles.switchButtonText}>Use Biometric Instead</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} disabled={loading}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <Text style={styles.helpText}>
            Having trouble? Contact support for assistance.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#FF5722',
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
    color: '#FFCCBC',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  biometricSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  totpSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  biometricIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  totpIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
    textAlign: 'center',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  codeInput: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#FF5722',
    borderRadius: 8,
    padding: 16,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 4,
    width: '80%',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#FF5722',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    width: '80%',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#FFAB91',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    padding: 12,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#FF5722',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  helpText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default MFAChallengeScreen;