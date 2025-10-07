/**
 * TOTP Setup Screen - Production Version with React 19 Compatibility
 * Comprehensive TOTP authenticator setup with QR codes, backup codes, and validation
 */

// @ts-nocheck
import * as React from 'react';

const { useState, useEffect } = React;
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Clipboard,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AuthService from '../../services/auth/AuthService';

interface TOTPSetupScreenProps {
  route?: { params?: { userId: string } };
}

interface TOTPSetupData {
  secret: string;
  qrCode: string;
  backupCodes: string[];
  appName: string;
  accountName: string;
}

export const TOTPSetupScreen = ({ route }: TOTPSetupScreenProps) => {
  const navigation = useNavigation();
  const userId = route?.params?.userId || '';
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [setupData, setSetupData] = useState<TOTPSetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [secretCopied, setSecretCopied] = useState(false);
  const [backupCodesSaved, setBackupCodesSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeTOTPSetup();
  }, []);

  const initializeTOTPSetup = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await AuthService.setupTOTP(userId);
      
      setSetupData({
        secret: result.secret,
        qrCode: result.qrCode,
        backupCodes: result.backupCodes || [],
        appName: 'DocsShelf',
        accountName: 'User Account'
      });
      
    } catch (err: any) {
      setError(err.message || 'Failed to initialize TOTP setup');
      Alert.alert('Setup Error', err.message || 'Failed to initialize TOTP setup');
    } finally {
      setLoading(false);
    }
  };

  const copySecret = async () => {
    if (setupData?.secret) {
      try {
        await Clipboard.setString(setupData.secret);
        setSecretCopied(true);
        Alert.alert('Copied!', 'Secret key copied to clipboard');
        setTimeout(() => setSecretCopied(false), 3000);
      } catch (err) {
        Alert.alert('Error', 'Failed to copy secret key');
      }
    }
  };

  const copyBackupCodes = async () => {
    if (setupData?.backupCodes) {
      try {
        const codesText = setupData.backupCodes.join('\n');
        await Clipboard.setString(codesText);
        setBackupCodesSaved(true);
        Alert.alert('Copied!', 'Backup codes copied to clipboard');
      } catch (err) {
        Alert.alert('Error', 'Failed to copy backup codes');
      }
    }
  };

  const verifyTOTP = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-digit verification code');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const isValid = await AuthService.completeTOTPSetup(userId, verificationCode);
      
      if (isValid) {
        Alert.alert(
          'TOTP Setup Complete!',
          'Two-factor authentication has been successfully enabled for your account.',
          [
            {
              text: 'Continue to App',
              onPress: () => navigation.navigate('Main'),
            }
          ]
        );
      } else {
        Alert.alert('Verification Failed', 'The code you entered is incorrect.');
        setVerificationCode('');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
      Alert.alert('Verification Error', err.message || 'Failed to verify TOTP code');
      setVerificationCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip TOTP Setup?',
      'You can set up two-factor authentication later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: () => navigation.navigate('Main'),
        }
      ]
    );
  };

  if (loading && !setupData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Setting up authenticator...</Text>
      </View>
    );
  }

  if (error && !setupData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Setup Failed</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={initializeTOTPSetup}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip TOTP Setup</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🔐</Text>
        <Text style={styles.title}>Setup Two-Factor Authentication</Text>
        <Text style={styles.subtitle}>Add extra security to your account</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressStep, currentStep >= 1 && styles.progressStepActive]} />
          <View style={[styles.progressStep, currentStep >= 2 && styles.progressStepActive]} />
          <View style={[styles.progressStep, currentStep >= 3 && styles.progressStepActive]} />
        </View>
        <Text style={styles.progressText}>Step {currentStep} of 3</Text>
      </View>

      <View style={styles.content}>
        {currentStep === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Step 1: Install Authenticator App</Text>
            <Text style={styles.stepDescription}>
              Download an authenticator app on your mobile device:
            </Text>

            <View style={styles.appsList}>
              <View style={styles.appItem}>
                <Text style={styles.appIcon}>📱</Text>
                <View style={styles.appInfo}>
                  <Text style={styles.appName}>Google Authenticator</Text>
                  <Text style={styles.appDescription}>Free and widely supported</Text>
                </View>
              </View>

              <View style={styles.appItem}>
                <Text style={styles.appIcon}>🔒</Text>
                <View style={styles.appInfo}>
                  <Text style={styles.appName}>Microsoft Authenticator</Text>
                  <Text style={styles.appDescription}>Includes backup features</Text>
                </View>
              </View>

              <View style={styles.appItem}>
                <Text style={styles.appIcon}>🔑</Text>
                <View style={styles.appInfo}>
                  <Text style={styles.appName}>Authy</Text>
                  <Text style={styles.appDescription}>Multi-device support</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => setCurrentStep(2)}
            >
              <Text style={styles.continueButtonText}>I Have an App Installed</Text>
            </TouchableOpacity>
          </View>
        )}

        {currentStep === 2 && setupData && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Step 2: Scan QR Code</Text>
            <Text style={styles.stepDescription}>
              Open your authenticator app and scan this QR code:
            </Text>

            <View style={styles.qrContainer}>
              <Text style={styles.qrPlaceholder}>📱 QR Code</Text>
              <Text style={styles.qrNote}>QR: {setupData.qrCode}</Text>
            </View>

            <Text style={styles.alternativeTitle}>Manual Entry</Text>
            <Text style={styles.alternativeDescription}>
              Or enter this secret key manually:
            </Text>

            <View style={styles.secretContainer}>
              <Text style={styles.secretLabel}>Secret Key:</Text>
              <View style={styles.secretRow}>
                <Text style={styles.secretText}>{setupData.secret}</Text>
                <TouchableOpacity
                  style={[styles.copyButton, secretCopied && styles.copyButtonSuccess]}
                  onPress={copySecret}
                >
                  <Text style={styles.copyButtonText}>
                    {secretCopied ? '✓' : 'Copy'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.stepNavigation}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentStep(1)}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={() => setCurrentStep(3)}
              >
                <Text style={styles.continueButtonText}>Continue →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {currentStep === 3 && setupData && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Step 3: Verify Setup</Text>
            <Text style={styles.stepDescription}>
              Enter the 6-digit code from your authenticator app:
            </Text>

            <View style={styles.codeInputContainer}>
              <TextInput
                style={[styles.codeInput, error && styles.codeInputError]}
                value={verificationCode}
                onChangeText={(text) => {
                  setVerificationCode(text);
                  setError(null);
                }}
                placeholder="000000"
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
                editable={!loading}
                autoFocus
              />
              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>

            <View style={styles.backupSection}>
              <Text style={styles.backupTitle}>📋 Backup Codes</Text>
              <Text style={styles.backupDescription}>
                Save these codes for account recovery:
              </Text>
              
              <View style={styles.backupCodesContainer}>
                <ScrollView style={styles.backupCodesList}>
                  {setupData.backupCodes.map((code: string, index: number) => (
                    <Text key={index} style={styles.backupCodeText}>{code}</Text>
                  ))}
                </ScrollView>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={copyBackupCodes}
                >
                  <Text style={styles.copyButtonText}>Copy All</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setBackupCodesSaved(!backupCodesSaved)}
                >
                  <Text style={styles.checkboxIcon}>
                    {backupCodesSaved ? '✓' : '○'}
                  </Text>
                  <Text style={styles.checkboxText}>
                    I have saved these backup codes
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.stepNavigation}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentStep(2)}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  (!verificationCode || !backupCodesSaved || loading) && styles.verifyButtonDisabled
                ]}
                onPress={verifyTOTP}
                disabled={!verificationCode || !backupCodesSaved || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.verifyButtonText}>Complete Setup ✓</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip for Now</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  contentContainer: {
    paddingBottom: 40,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F5F7FA',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#1976D2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    minWidth: 120,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#1976D2',
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 16,
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
  progressContainer: {
    padding: 24,
    alignItems: 'center',
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressStep: {
    width: 60,
    height: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: '#1976D2',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    padding: 24,
  },
  stepContainer: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 24,
  },
  appsList: {
    marginBottom: 32,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  appIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  appDescription: {
    fontSize: 14,
    color: '#666',
  },
  qrContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  qrPlaceholder: {
    fontSize: 64,
    marginBottom: 16,
  },
  qrNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  alternativeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  alternativeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  secretContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  secretLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 12,
  },
  secretRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secretText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#1976D2',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 4,
    marginRight: 12,
  },
  copyButton: {
    backgroundColor: '#1976D2',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  copyButtonSuccess: {
    backgroundColor: '#4CAF50',
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  codeInputContainer: {
    marginBottom: 32,
  },
  codeInput: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1976D2',
    borderRadius: 8,
    padding: 20,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 4,
    textAlign: 'center',
  },
  codeInputError: {
    borderColor: '#F44336',
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  backupSection: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  backupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 8,
  },
  backupDescription: {
    fontSize: 14,
    color: '#BF360C',
    marginBottom: 16,
    lineHeight: 20,
  },
  backupCodesContainer: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  backupCodesList: {
    maxHeight: 120,
    marginBottom: 12,
  },
  backupCodeText: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#424242',
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
    textAlign: 'center',
  },
  checkboxContainer: {
    marginTop: 8,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxIcon: {
    fontSize: 18,
    marginRight: 12,
    color: '#4CAF50',
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: '#BF360C',
    lineHeight: 20,
  },
  stepNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },
  backButton: {
    padding: 12,
  },
  backButtonText: {
    color: '#1976D2',
    fontSize: 16,
  },
  continueButton: {
    backgroundColor: '#1976D2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginLeft: 16,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  verifyButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginLeft: 16,
  },
  verifyButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    padding: 16,
    marginTop: 16,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 14,
  },
});

export default TOTPSetupScreen;