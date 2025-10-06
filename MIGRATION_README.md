# DocsShelf v5 - Fresh Start

## Project Status
This is a **fresh Expo project** created to resolve persistent runtime errors in docsshelf-v4.

### ? What's Been Done

1. **Created Fresh Expo Project** (SDK 54)
   - Template: `blank-typescript`
   - Zero vulnerabilities in dependencies
   - Modern React Native 0.76.x

2. **Installed All Dependencies** (0 vulnerabilities!)
   - Redux Toolkit + React Redux
   - React Navigation (Stack + Bottom Tabs)
   - Expo modules: SQLite, Secure Store, Crypto, File System, Local Auth
   - UI: Gesture Handler, Reanimated, Safe Area Context
   - Utilities: crypto-js, async-storage

3. **Migrated Source Code**
   - Copied entire `src/` folder from docsshelf-v4
   - Includes: components, screens, services, store, navigation, utils

4. **Configured Project**
   - `app.json`: minSdk 24, permissions, bundle IDs
   - `babel.config.js`: Module resolver for path aliases
   - `App.tsx`: Entry point that imports from src/App
   - `metro.config.js`: Copied from v4 (may need adjustment for SDK 54)

### ?? Current Issue
Metro bundler starts but exits with code 1. Likely causes:
- `metro.config.js` from SDK 52 incompatible with SDK 54
- Missing some peer dependencies
- Configuration mismatch

### ?? Next Steps

1. **Fix Metro Config**
   - Generate fresh metro.config.js for SDK 54
   - Or remove it to use default

2. **Test Basic Launch**
   - Start with Expo Go (no native build needed initially)
   - Verify app loads and shows login screen

3. **Fix Document Upload Service**
   - Currently uses react-native-document-picker (deprecated)
   - Need to migrate to expo-document-picker API
   - Or stub it out for Phase 1 testing

4. **Test Authentication** (Phase 1)
   - Registration flow
   - Login flow
   - Database initialization
   - Secure storage

## Key Differences from v4

- **SDK 54** (vs 52 in v4)
- **React Native 0.76.x** with new architecture enabled
- **Clean dependency tree** - no jest-expo React 19 conflicts
- **No android/ folder yet** - will use Expo Go first, build later if needed

## Commands

```bash
cd C:\projects\docsshelf-v5

# Start Metro (fix needed)
npx expo start

# When working, test on Android
npx expo start --android

# Or use Expo Go app
npx expo start --go

# Build development client (later)
npx expo run:android
```

## Files Modified from Template

- `App.tsx` - Changed to export from `./src/App`
- `app.json` - Added permissions, bundle IDs, expo-build-properties
- `babel.config.js` - Added from v4 (module-resolver plugin)
- `metro.config.js` - Added from v4 (needs verification)
- `src/` - Entire folder copied from v4

## Original v4 Issues (Why We Started Fresh)

- Persistent "bad application bundle" runtime error
- Development build crashed immediately after bundling
- Multiple dependency conflicts (jest-expo, React 19 RC)
- Kotlin/Compose version mismatches
- Hours of debugging with no resolution
- android/ folder was never in git (project state unclear)

## Decision: Fresh Start

Rather than continue debugging unknown project state, we:
1. Created clean Expo project with latest stable SDK
2. Copied working source code
3. Installed dependencies cleanly
4. Will debug from known-good baseline

**Time invested in fresh start: ~30 minutes**  
**Time spent debugging v4: ~6+ hours**

---

**Created:** October 5, 2025  
**Previous Project:** C:\projects\docsshelf-v4  
**Git Commit (v4):** 78330ad
