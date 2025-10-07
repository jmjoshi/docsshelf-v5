# DocsShelf Mobile App

DocsShelf is a cross-platform (iOS/Android) document management solution focused on strict local storage, end-to-end encryption, and offline functionality. It provides secure, efficient document handling with features like OCR, categorization, search, and local sharing.

## Features

- **Secure Local Storage**: All documents stored locally with AES-256 encryption
- **User Authentication**: Secure login/signup with biometric MFA support
- **Document Management**: Upload, scan, categorize, and search documents
- **OCR Integration**: Extract text from images using ML Kit
- **Offline Functionality**: Full app operation without internet
- **Zero-Knowledge Architecture**: No server access to user data

## Tech Stack

- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **Database**: SQLite (react-native-sqlite-storage)
- **State Management**: Redux Toolkit with Redux Persist
- **UI**: React Native Paper
- **Navigation**: React Navigation
- **Encryption**: React Native Keychain + crypto libraries
- **OCR**: React Native ML Kit

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18+ (Download from [nodejs.org](https://nodejs.org/))
- **Expo CLI**: Install globally with `npm install -g @expo/cli`
- **Android Studio**: For Android development (with Android SDK)
- **Xcode**: For iOS development (macOS only)
- **Git**: For version control

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/jmjoshi/docsshelf.git
cd docsshelf
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Install iOS Dependencies (macOS only)

```bash
cd ios
pod install
cd ..
```

### 4. Configure Environment

Create a `.env` file in the root directory (optional for basic setup):

```env
# Add environment variables if needed
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### 5. Start the Development Server

```bash
npm start
```

This will start the Expo development server. You can then:

- Press `a` to open on Android emulator/device
- Press `i` to open on iOS simulator (macOS only)
- Press `w` to open in web browser

### 6. Build for Production

#### Android APK

```bash
npx expo build:android
```

#### iOS IPA

```bash
npx expo build:ios
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Shared components
│   ├── forms/          # Form components
│   └── ui/             # UI-specific components
├── screens/            # Screen components
│   ├── Auth/           # Authentication screens
│   ├── Home/           # Home dashboard
│   ├── Documents/      # Document management
│   └── Settings/       # App settings
├── services/           # Business logic and APIs
│   ├── api/            # API services
│   ├── database/       # SQLite operations
│   ├── encryption/     # Encryption utilities
│   ├── ocr/            # OCR processing
│   └── storage/        # File storage
├── store/              # Redux state management
│   ├── slices/         # Redux slices
│   └── store.ts        # Store configuration
├── types/              # TypeScript definitions
├── navigation/         # Navigation setup
├── utils/              # Utility functions
├── hooks/              # Custom React hooks
├── i18n/               # Internationalization
└── config/             # Configuration files
```

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Use functional components with hooks
- Follow React Native and Redux best practices

### Testing

```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e
```

### Linting

```bash
# Check for linting errors
npm run lint

# Fix linting issues
npm run lint:fix
```

## Security Features

- **End-to-End Encryption**: All data encrypted with AES-256-GCM
- **Biometric Authentication**: Fingerprint/face ID support
- **Secure Key Storage**: Keys stored in device keystore using React Native Keychain
- **Zero-Knowledge**: No server-side data access
- **Password Security**: PBKDF2 key derivation with strong password requirements
- **Audit Logging**: All user actions logged locally in SQLite database
- **Secure Registration**: Email/password with validation and secure hashing

## Authentication Setup

The app implements a comprehensive authentication system:

### User Registration

- Email and password registration
- Strong password requirements (12+ chars, mixed case, numbers, symbols)
- Phone number collection (optional multiple numbers)
- Secure password hashing with PBKDF2
- Automatic encryption key generation and storage

### User Login

- Email/password authentication
- Biometric authentication support (fingerprint/face ID)
- Failed login attempt logging
- Session management with Redux

### Biometric Setup

- Optional biometric authentication
- Device keystore integration
- Fallback to password authentication

### Security Implementation

- **Encryption Service**: AES-256-GCM encryption/decryption
- **Key Management**: Secure key storage in device keystore
- **Database Security**: SQLite with encrypted metadata
- **Audit System**: Comprehensive logging of all user actions

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For questions or support, please contact the development team or create an issue in the repository.

## Roadmap

See [roadmap.md](documents/roadmap.md) for detailed development roadmap and milestones.</content>
<parameter name="filePath">c:\Users\Jayant\Documents\projects\docsshelf\README.md
