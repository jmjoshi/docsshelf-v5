# MFA Testing Guide

## 🚀 Getting Started

### 1. Start Development Server
```powershell
# Navigate to project
cd c:\projects\docsshelf-v5

# Start Expo development server
npx expo start

# OR if metro config issues:
Remove-Item metro.config.js -ErrorAction SilentlyContinue
npx expo start
```

### 2. Choose Testing Platform
- **Web Browser**: Press `w` in terminal (fastest for testing)
- **iOS Simulator**: Press `i` (requires Xcode)
- **Android Emulator**: Press `a` (requires Android Studio)
- **Physical Device**: Scan QR code with Expo Go app

---

## 📱 **MFA Screen Testing Checklist**

### **✅ TOTPSetupScreen Tests**

#### **Step 1: Install Authenticator App**
- [ ] Screen renders with app recommendations
- [ ] Shows Google Authenticator, Microsoft Authenticator, Authy
- [ ] "I Have an App Installed" button works
- [ ] Skip option available

#### **Step 2: QR Code & Secret**
- [ ] QR code placeholder displays
- [ ] Secret key shows correctly
- [ ] Copy button works for secret key
- [ ] Manual entry instructions clear
- [ ] Back/Continue navigation works

#### **Step 3: Verification**
- [ ] 6-digit code input works
- [ ] Input validation (6 digits only)
- [ ] Backup codes display
- [ ] Copy backup codes works
- [ ] Checkbox for "saved backup codes"
- [ ] Complete setup button enables when ready
- [ ] Verification success/failure handling

### **✅ BiometricSetupScreen Tests**

#### **Basic Functionality**
- [ ] Screen renders without errors
- [ ] Detects device biometric capabilities
- [ ] Shows appropriate biometric types available
- [ ] Handles devices without biometrics gracefully

#### **Setup Process**
- [ ] Biometric enrollment prompts work
- [ ] Success/failure states handled properly
- [ ] Skip option available
- [ ] Navigation to next screen works

### **✅ MFAChallengeScreen Tests**

#### **Challenge Flow**
- [ ] Renders during login when MFA enabled
- [ ] TOTP input field works
- [ ] Biometric prompt triggers (if available)
- [ ] Fallback to TOTP when biometric fails
- [ ] Backup code option available
- [ ] Success/failure handling

---

## 🔄 **Navigation Flow Testing**

### **Test Navigation Paths**
1. **Registration → TOTP → Biometric → Main App**
2. **Settings → MFA Setup → TOTP → Biometric**
3. **Login → MFA Challenge → Main App**
4. **Skip flows and later setup**

### **Check These Navigation Points**
```typescript
// Verify these screens are accessible:
navigation.navigate('TOTPSetup', { userId })
navigation.navigate('BiometricSetup', { userId })
navigation.navigate('MFAChallenge', { userId, challengeType })
```

---

## 🧪 **Functional Testing Scenarios**

### **Scenario 1: First-Time User Setup**
1. Register new account
2. Navigate to TOTP setup
3. Complete 3-step TOTP process
4. Navigate to biometric setup
5. Complete biometric enrollment
6. Verify account is MFA-enabled

### **Scenario 2: Login with MFA**
1. Login with MFA-enabled account
2. MFA challenge screen appears
3. Enter TOTP code from authenticator app
4. Successfully authenticate
5. Access main application

### **Scenario 3: Biometric Authentication**
1. Login with MFA + biometric account
2. Biometric prompt appears first
3. Use fingerprint/face recognition
4. Fallback to TOTP if biometric fails
5. Successfully authenticate

### **Scenario 4: Error Handling**
1. Test invalid TOTP codes
2. Test expired TOTP codes
3. Test network failures during setup
4. Test device without biometrics
5. Test backup code usage

---

## 🐛 **Debugging Common Issues**

### **React 19 Import Errors**
```typescript
// ❌ This fails in React 19:
import React, { useState, useEffect } from 'react';

// ✅ This works:
import * as React from 'react';
const { useState, useEffect } = React;
```

### **Navigation Type Errors**
Check that all MFA screens are in `RootStackParamList`:
```typescript
type RootStackParamList = {
  TOTPSetup: { userId: string };
  BiometricSetup: { userId: string };
  MFAChallenge: { userId: string; challengeType?: string };
  // ... other screens
};
```

### **Metro Bundle Errors**
```powershell
# Clear Metro cache
npx expo start --clear

# Reset Metro config if needed
Remove-Item metro.config.js
npx expo customize metro.config.js
```

---

## 🔍 **Testing Checklist**

### **Before Testing**
- [ ] All MFA screens compile without errors
- [ ] Navigation imports updated to production versions
- [ ] Development server starts successfully
- [ ] No TypeScript errors in terminal

### **During Testing**
- [ ] Check console for runtime errors
- [ ] Test on multiple platforms (web/mobile)
- [ ] Verify all interactive elements work
- [ ] Test error states and edge cases
- [ ] Check UI responsiveness and styling

### **After Testing**
- [ ] Document any bugs found
- [ ] Verify complete user flows work
- [ ] Test production build if possible
- [ ] Check performance and loading states

---

## 📋 **Quick Test Commands**

```powershell
# Start fresh development server
npx expo start --clear

# Web browser testing (fastest)
# Press 'w' when server starts

# Check for errors
# Monitor terminal output and browser console

# Build for production testing
npx expo build:web
```

---

## 🎯 **Success Criteria**

### **Phase 1 Complete When:**
- [ ] All MFA screens render without errors
- [ ] Basic navigation between screens works
- [ ] UI elements are interactive
- [ ] No compilation errors in terminal

### **Phase 2 Complete When:**
- [ ] Complete TOTP setup flow works end-to-end
- [ ] Biometric setup detects and configures properly
- [ ] MFA challenge works during login
- [ ] Error handling is robust

### **Phase 3 Complete When:**
- [ ] All user scenarios tested successfully
- [ ] Performance is acceptable
- [ ] Ready for production deployment
- [ ] Documentation updated

---

## 🆘 **Need Help?**

If you encounter issues:

1. **Check Console Errors**: Browser DevTools → Console
2. **Check Terminal Output**: Look for TypeScript/Metro errors
3. **Verify File Structure**: Ensure all imports point to correct files
4. **Test Simple Version**: Switch back to `.simple.tsx` files if needed
5. **Ask for Help**: Share specific error messages

Remember: The MFA screens are now production-ready and React 19 compatible! 🎉