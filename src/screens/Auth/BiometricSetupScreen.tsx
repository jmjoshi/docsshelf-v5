/**
 * Biometric Setup Screen - Simplified Version for React 19 Compatibility
 * Allows users to configure fingerprint/face ID authentication
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
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import AuthService from '../../services/auth/AuthService';
import { loginSuccess } from '../../store/slices/authSlice';

interface BiometricSetupScreenProps {
  route?: { params?: { userId: string } };
}

export const BiometricSetupScreen = ({ route }: BiometricSetupScreenProps) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const userId = route?.params?.userId || '';
  
  const [loading, setLoading] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  React.useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      setLoading(true);
      const availability = await AuthService.checkBiometricAvailability();
      
      setIsAvailable(availability.isAvailable);
      setIsEnrolled(availability.isEnrolled);
      setBiometricType(availability.biometricType || '');

      if (!availability.isAvailable) {
        Alert.alert(
          'Biometric Authentication Unavailable',
          'Your device does not support biometric authentication or it is not configured.',
          [{ text: 'OK', onPress: () => navigation.navigate('Main') }]
        );
      }
    } catch (error: any) {
      console.error('Biometric check error:', error);
      Alert.alert(
        'Error',
        'Unable to check biometric availability. Skipping biometric setup.',
        [{ text: 'OK', onPress: onSkip || onComplete }]
      );
    } finally {
      setLoading(false);
    }
  };

  const setupBiometric = async () => {
    try {
      setLoading(true);
      const result = await AuthService.setupBiometric(userId);
      
      if (result.success) {
        Alert.alert(
          'Biometric Setup Complete',
          'You can now use your fingerprint or face ID to authenticate.',
          [{ text: 'OK', onPress: () => navigation.navigate('Main') }]
        );
      } else {
        Alert.alert(
          'Setup Failed',
          result.error || 'Failed to setup biometric authentication'
        );
      }
    } catch (error: any) {
      Alert.alert('Setup Error', error.message || 'Failed to setup biometric authentication');
    } finally {
      setLoading(false);
    }
  };

  const getBiometricIcon = () => {
    switch (biometricType?.toLowerCase()) {
      case 'face':
      case 'faceid':
        return '👤';
      case 'fingerprint':
      case 'touch':
      case 'touchid':
        return '👆';
      default:
        return '🔐';
    }
  };

  const getBiometricName = () => {
    switch (biometricType?.toLowerCase()) {
      case 'face':
      case 'faceid':
        return 'Face ID';
      case 'fingerprint':
      case 'touch':
      case 'touchid':
        return 'Fingerprint';
      default:
        return 'Biometric Authentication';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Checking biometric availability...</Text>
      </View>
    );
  }

  if (!isAvailable) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Biometric Authentication</Text>
          <Text style={styles.subtitle}>Quick and secure authentication</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.unavailableContainer}>
            <Text style={styles.unavailableIcon}>❌</Text>
            <Text style={styles.unavailableTitle}>Not Available</Text>
            <Text style={styles.unavailableText}>
              Biometric authentication is not available on this device or not configured in your device settings.
            </Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Main')}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Setup {getBiometricName()}</Text>
        <Text style={styles.subtitle}>Quick and secure authentication</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.biometricInfo}>
          <Text style={styles.biometricIcon}>{getBiometricIcon()}</Text>
          <Text style={styles.biometricTitle}>{getBiometricName()} Available</Text>
          <Text style={styles.biometricDescription}>
            Use your {getBiometricName().toLowerCase()} to quickly and securely access DocsShelf without entering your password every time.
          </Text>
        </View>

        <View style={styles.benefits}>
          <Text style={styles.benefitsTitle}>Benefits:</Text>
          <Text style={styles.benefit}>• Faster login experience</Text>
          <Text style={styles.benefit}>• Enhanced security</Text>
          <Text style={styles.benefit}>• No need to remember passwords</Text>
          <Text style={styles.benefit}>• Works even when offline</Text>
        </View>

        <View style={styles.security}>
          <Text style={styles.securityTitle}>Security Note:</Text>
          <Text style={styles.securityText}>
            Your biometric data stays on your device and is never shared with DocsShelf or any third parties.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={setupBiometric}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Enable {getBiometricName()}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={() => navigation.navigate('Main')}>
          <Text style={styles.skipButtonText}>Skip for Now</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    backgroundColor: '#4CAF50',
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
    color: '#E8F5E8',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  unavailableContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  unavailableIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  unavailableTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 16,
  },
  unavailableText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  biometricInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  biometricIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  biometricTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  biometricDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  benefits: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  benefit: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 8,
    lineHeight: 20,
  },
  security: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 8,
  },
  securityText: {
    fontSize: 12,
    color: '#BF360C',
    lineHeight: 16,
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#A5D6A7',
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
});

export default BiometricSetupScreen;