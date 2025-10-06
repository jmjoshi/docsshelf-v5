/**
 * Validation Schemas for Authentication
 * Using Zod for comprehensive form validation with security rules
 */

import { z } from 'zod';

// ==================== COMMON         return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));ALIDATORS ====================

const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .toLowerCase()
  .refine(
    (email) => {
      // Additional email validation rules
      const validDomainRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return validDomainRegex.test(email);
    },
    { message: 'Email format is invalid' }
  );

const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters long')
  .max(128, 'Password cannot exceed 128 characters')
  .refine(
    (password) => /[A-Z]/.test(password),
    { message: 'Password must contain at least one uppercase letter' }
  )
  .refine(
    (password) => /[a-z]/.test(password),
    { message: 'Password must contain at least one lowercase letter' }
  )
  .refine(
    (password) => /\d/.test(password),
    { message: 'Password must contain at least one number' }
  )
  .refine(
    (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
    { message: 'Password must contain at least one special character' }
  )
  .refine(
    (password) => {
      // Check for repeating characters (no more than 2 in a row)
      const repeatingRegex = /(.)\\1{2,}/;
      return !repeatingRegex.test(password);
    },
    { message: 'Password cannot contain more than 2 repeating characters in a row' }
  )
  .refine(
    (password) => {
      // Check against common patterns
      const commonPatterns = [
        /123456/,
        /password/i,
        /qwerty/i,
        /abc123/i,
        /111111/,
        /admin/i,
        /letmein/i,
      ];
      return !commonPatterns.some(pattern => pattern.test(password));
    },
    { message: 'Password contains common patterns and is not secure' }
  );

const phoneNumberSchema = z
  .string()
  .optional()
  .refine(
    (phone) => {
      if (!phone) return true;
      // International phone number format
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      return phoneRegex.test(phone.replace(/[\s-()]/g, ''));
    },
    { message: 'Please enter a valid phone number' }
  );

const nameSchema = z
  .string()
  .min(1, 'This field is required')
  .min(2, 'Must be at least 2 characters long')
  .max(50, 'Cannot exceed 50 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Only letters, spaces, hyphens, and apostrophes are allowed');

// ==================== REGISTRATION SCHEMAS ====================

export const registrationSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phoneNumber: phoneNumberSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions'
  }),
  privacyAccepted: z.boolean().refine(val => val === true, {
    message: 'You must accept the privacy policy'
  }),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

export type RegistrationFormData = z.infer<typeof registrationSchema>;

// ==================== LOGIN SCHEMAS ====================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
  trustDevice: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ==================== FORGOT PASSWORD SCHEMAS ====================

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  newPassword: passwordSchema,
  confirmPassword: z.string(),
  resetToken: z.string().min(1, 'Reset token is required'),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ==================== MFA SCHEMAS ====================

export const mfaCodeSchema = z.object({
  code: z
    .string()
    .min(6, 'Code must be 6 digits')
    .max(6, 'Code must be 6 digits')
    .regex(/^\\d{6}$/, 'Code must contain only numbers'),
  trustDevice: z.boolean().optional(),
});

export type MFACodeFormData = z.infer<typeof mfaCodeSchema>;

export const totpSetupSchema = z.object({
  verificationCode: z
    .string()
    .min(6, 'Verification code must be 6 digits')
    .max(6, 'Verification code must be 6 digits')
    .regex(/^\\d{6}$/, 'Code must contain only numbers'),
  backupCodesAcknowledged: z.boolean().refine(val => val === true, {
    message: 'You must acknowledge that you have saved your backup codes'
  }),
});

export type TOTPSetupFormData = z.infer<typeof totpSetupSchema>;

// ==================== PHONE VERIFICATION SCHEMAS ====================

export const phoneVerificationSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .refine(
      (phone) => {
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
      },
      { message: 'Please enter a valid phone number' }
    ),
});

export type PhoneVerificationFormData = z.infer<typeof phoneVerificationSchema>;

export const smsCodeSchema = z.object({
  code: z
    .string()
    .min(4, 'Code must be at least 4 digits')
    .max(8, 'Code cannot exceed 8 digits')
    .regex(/^\\d+$/, 'Code must contain only numbers'),
});

export type SMSCodeFormData = z.infer<typeof smsCodeSchema>;

// ==================== PROFILE UPDATE SCHEMAS ====================

export const profileUpdateSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phoneNumbers: z.array(z.object({
    id: z.string(),
    type: z.enum(['mobile', 'home', 'work']),
    number: z.string(),
    verified: z.boolean(),
  })).optional(),
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;

// ==================== PASSWORD CHANGE SCHEMAS ====================

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmNewPassword: z.string(),
}).refine(
  (data) => data.newPassword === data.confirmNewPassword,
  {
    message: 'New passwords do not match',
    path: ['confirmNewPassword'],
  }
).refine(
  (data) => data.currentPassword !== data.newPassword,
  {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  }
);

export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

// ==================== SECURITY SETTINGS SCHEMAS ====================

export const securitySettingsSchema = z.object({
  mfaEnabled: z.boolean(),
  biometricEnabled: z.boolean(),
  totpEnabled: z.boolean(),
  smsEnabled: z.boolean(),
  sessionTimeout: z.number().min(5).max(480), // 5 minutes to 8 hours
  autoLockEnabled: z.boolean(),
  autoLockTime: z.number().min(1).max(60), // 1 to 60 minutes
});

export type SecuritySettingsFormData = z.infer<typeof securitySettingsSchema>;

// ==================== DEVICE MANAGEMENT SCHEMAS ====================

export const trustedDeviceSchema = z.object({
  name: z.string().min(1, 'Device name is required').max(100, 'Device name too long'),
  deviceId: z.string().min(1, 'Device ID is required'),
  platform: z.enum(['ios', 'android', 'web']),
});

export type TrustedDeviceFormData = z.infer<typeof trustedDeviceSchema>;

// ==================== BACKUP CODE SCHEMAS ====================

export const backupCodeSchema = z.object({
  code: z
    .string()
    .min(8, 'Backup code must be at least 8 characters')
    .max(12, 'Backup code cannot exceed 12 characters')
    .regex(/^[A-Z0-9]+$/, 'Backup code format is invalid'),
});

export type BackupCodeFormData = z.infer<typeof backupCodeSchema>;

// ==================== EMAIL VERIFICATION SCHEMAS ====================

export const emailVerificationSchema = z.object({
  verificationCode: z
    .string()
    .min(6, 'Verification code must be 6 characters')
    .max(6, 'Verification code must be 6 characters')
    .regex(/^[A-Z0-9]{6}$/, 'Code must contain only letters and numbers'),
});

export type EmailVerificationFormData = z.infer<typeof emailVerificationSchema>;

// ==================== UTILITY FUNCTIONS ====================

/**
 * Calculate password strength score
 */
export const calculatePasswordStrength = (password: string): {
  score: number;
  level: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong';
  feedback: string[];
} => {
  let score = 0;
  const feedback: string[] = [];

  // Length check
  if (password.length >= 12) {
    score += 25;
  } else if (password.length >= 8) {
    score += 15;
    feedback.push('Consider using a longer password');
  } else {
    feedback.push('Password is too short');
  }

  // Character variety
  if (/[a-z]/.test(password)) score += 15;
  else feedback.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score += 15;
  else feedback.push('Add uppercase letters');

  if (/\\d/.test(password)) score += 15;
  else feedback.push('Add numbers');

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 15;
  else feedback.push('Add special characters');

  // Complexity bonuses
  if (password.length >= 16) score += 10;
  if (/[^\\w\\s]/.test(password) && password.length >= 12) score += 5;

  // Penalties
  if (/(.)\\1{2,}/.test(password)) {
    score -= 10;
    feedback.push('Avoid repeating characters');
  }

  const commonPatterns = [/123/, /abc/, /password/i, /qwerty/i];
  if (commonPatterns.some(pattern => pattern.test(password))) {
    score -= 15;
    feedback.push('Avoid common patterns');
  }

  score = Math.max(0, Math.min(100, score));

  let level: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong';
  if (score < 30) level = 'very-weak';
  else if (score < 50) level = 'weak';
  else if (score < 70) level = 'fair';
  else if (score < 90) level = 'good';
  else level = 'strong';

  return { score, level, feedback };
};

/**
 * Validate email format with additional security checks
 */
export const validateEmailSecurity = (email: string): {
  isValid: boolean;
  isDisposable: boolean;
  suggestions: string[];
} => {
  const disposableEmailDomains = [
    '10minutemail.com',
    'guerrillamail.com',
    'mailinator.com',
    'tempmail.org',
    // Add more disposable email domains
  ];

  const commonTypos: Record<string, string> = {
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'yahooo.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com',
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);
  
  const domain = email.split('@')[1]?.toLowerCase();
  const isDisposable = domain ? disposableEmailDomains.includes(domain) : false;
  
  const suggestions: string[] = [];
  if (domain && commonTypos[domain]) {
    suggestions.push(`Did you mean ${email.replace(domain, commonTypos[domain])}?`);
  }

  return { isValid, isDisposable, suggestions };
};

/**
 * Format phone number for international use
 */
export const formatPhoneNumber = (phone: string, countryCode: string = 'US'): string => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Add country code if missing (simplified for US)
  if (countryCode === 'US' && cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  if (cleaned.startsWith('1') && cleaned.length === 11) {
    return `+${cleaned}`;
  }
  
  return phone.startsWith('+') ? phone : `+${cleaned}`;
};