/**
 * Register Screen - User Registration
 * Implements secure user registration with validation
 */

// @ts-nocheck
import * as React from 'react';

const { useState, useRef } = React;
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import AuthService from '../../services/auth/AuthService';
import { registerSuccess } from '../../store/slices/authSlice';
import type { User, AuthToken } from '../../types/minimal';

interface RegisterScreenProps {
  onRegisterSuccess?: (user: User, token: AuthToken) => void;
  onNavigateToLogin?: () => void;
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 12) {
    return { valid: false, message: 'Password must be at least 12 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }
  return { valid: true };
};

export const RegisterScreen = ({ onRegisterSuccess, onNavigateToLogin }: RegisterScreenProps) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Refs for form navigation
  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const updateField = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
    
    // If password is changed and confirm password exists, re-validate confirm password
    if (field === 'password' && formData.confirmPassword) {
      setTimeout(() => validateField('confirmPassword', formData.confirmPassword), 0);
    }
  };

  const isFieldValid = (field: string, value: string) => {
    switch (field) {
      case 'firstName':
      case 'lastName':
        return value.trim().length > 0;
      case 'email':
        return value.trim().length > 0 && validateEmail(value);
      case 'password':
        return validatePassword(value).valid;
      case 'confirmPassword':
        return value.length > 0 && formData.password === value;
      case 'phoneNumber':
        // Optional field - valid if empty or matches pattern
        return !value.trim() || /^\+?[\d\s\-\(\)]{7,20}$/.test(value);
      default:
        return false;
    }
  };

  const getInputStyle = (field: string, value: string) => {
    if (errors[field]) {
      return [styles.input, styles.inputError];
    } else if (value && isFieldValid(field, value)) {
      return [styles.input, styles.inputValid];
    }
    return styles.input;
  };

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };

    switch (field) {
      case 'firstName':
        if (!value.trim()) {
          newErrors.firstName = 'First name is required';
        } else {
          delete newErrors.firstName;
        }
        break;

      case 'lastName':
        if (!value.trim()) {
          newErrors.lastName = 'Last name is required';
        } else {
          delete newErrors.lastName;
        }
        break;

      case 'email':
        if (!value.trim()) {
          newErrors.email = 'Email is required';
        } else if (!validateEmail(value)) {
          newErrors.email = 'Invalid email format';
        } else {
          delete newErrors.email;
        }
        break;

      case 'password':
        if (!value) {
          newErrors.password = 'Password is required';
        } else {
          const passwordValidation = validatePassword(value);
          if (!passwordValidation.valid) {
            newErrors.password = passwordValidation.message || 'Invalid password';
          } else {
            delete newErrors.password;
          }
        }
        break;

      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== value) {
          newErrors.confirmPassword = 'Passwords do not match';
        } else {
          delete newErrors.confirmPassword;
        }
        break;

      case 'phoneNumber':
        // Phone number is optional, so only validate if provided
        if (value.trim()) {
          // More comprehensive phone number validation
          const phoneRegex = /^\+?[\d\s\-\(\)]{7,20}$/;
          if (!phoneRegex.test(value)) {
            newErrors.phoneNumber = 'Invalid phone number format (e.g., +1234567890)';
          } else {
            delete newErrors.phoneNumber;
          }
        } else {
          delete newErrors.phoneNumber;
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleRegister = async () => {
    // Validate form
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    const passwordValidation = validatePassword(formData.password);
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.message || 'Invalid password';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const result = await AuthService.register({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: formData.phoneNumber.trim() || undefined,
      });

      // Dispatch Redux actions
      dispatch(registerSuccess({ user: result.user, token: result.token }));

      Alert.alert(
        'Registration Successful!',
        'Your account has been created successfully. Let\'s set up two-factor authentication for enhanced security.',
        [
          {
            text: 'Set Up MFA',
            onPress: () => {
              navigation.navigate('TOTPSetup', { userId: result.user.id });
            },
          },
          {
            text: 'Skip for Now',
            style: 'cancel',
            onPress: () => {
              if (onRegisterSuccess) {
                onRegisterSuccess(result.user, result.token);
              } else {
                navigation.navigate('Main');
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Registration Failed',
        error instanceof Error ? error.message : 'An error occurred during registration',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join DocsShelf for secure document management</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={getInputStyle('firstName', formData.firstName)}
              placeholder="John"
              value={formData.firstName}
              onChangeText={(text) => updateField('firstName', text)}
              onBlur={() => validateField('firstName', formData.firstName)}
              autoCapitalize="words"
              textContentType="givenName"
              editable={!loading}
              returnKeyType="next"
              onSubmitEditing={() => lastNameRef.current?.focus()}
              blurOnSubmit={false}
            />
            {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              ref={lastNameRef}
              style={getInputStyle('lastName', formData.lastName)}
              placeholder="Doe"
              value={formData.lastName}
              onChangeText={(text) => updateField('lastName', text)}
              onBlur={() => validateField('lastName', formData.lastName)}
              autoCapitalize="words"
              textContentType="familyName"
              editable={!loading}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              blurOnSubmit={false}
            />
            {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              ref={emailRef}
              style={getInputStyle('email', formData.email)}
              placeholder="email@example.com"
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              onBlur={() => validateField('email', formData.email)}
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              keyboardType="email-address"
              editable={!loading}
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
              blurOnSubmit={false}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number (Optional)</Text>
            <TextInput
              ref={phoneRef}
              style={getInputStyle('phoneNumber', formData.phoneNumber)}
              placeholder="+1234567890"
              value={formData.phoneNumber}
              onChangeText={(text) => updateField('phoneNumber', text)}
              onBlur={() => validateField('phoneNumber', formData.phoneNumber)}
              textContentType="telephoneNumber"
              keyboardType="phone-pad"
              editable={!loading}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
            />
            {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password *</Text>
            <TextInput
              ref={passwordRef}
              style={getInputStyle('password', formData.password)}
              placeholder="Create a strong password"
              value={formData.password}
              onChangeText={(text) => updateField('password', text)}
              onBlur={() => validateField('password', formData.password)}
              secureTextEntry
              autoCapitalize="none"
              textContentType="newPassword"
              editable={!loading}
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              blurOnSubmit={false}
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            <Text style={styles.hintText}>
              Password must be at least 12 characters with uppercase, lowercase, numbers, and special characters
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password *</Text>
            <TextInput
              ref={confirmPasswordRef}
              style={getInputStyle('confirmPassword', formData.confirmPassword)}
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChangeText={(text) => updateField('confirmPassword', text)}
              onBlur={() => validateField('confirmPassword', formData.confirmPassword)}
              secureTextEntry
              autoCapitalize="none"
              textContentType="newPassword"
              editable={!loading}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.linkText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            🔒 Your data is encrypted end-to-end
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#616161',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#212121',
  },
  inputError: {
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  inputValid: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8E9',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
  },
  hintText: {
    color: '#757575',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  button: {
    backgroundColor: '#1976D2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#90CAF9',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 16,
    padding: 8,
    alignItems: 'center',
  },
  linkText: {
    color: '#1976D2',
    fontSize: 14,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    color: '#9E9E9E',
    fontSize: 12,
  },
});
