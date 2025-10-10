# 🔧 **Native Module Configuration Guide**

## **Issue: Runtime Error - Cannot read property 'getConstants' of null**

### **Root Cause:**
- `react-native-pdf` requires native module linking
- Expo managed workflow has limitations with native modules
- Need proper configuration for production builds

---

## **Solution Options:**

### **✅ Option 1: Current Development Fix (Active)**
- Using fallback PDFViewer component without native modules
- App runs successfully in development
- No native module dependencies

### **🏗️ Option 2: Production Native Module Setup**

#### **Step 1: Configure Expo for Native Modules**
```bash
# Install EAS Build for custom native modules
npm install -g @expo/cli
npx expo install expo-dev-client

# Create custom development build
npx expo run:android
# OR
npx expo run:ios
```

#### **Step 2: Configure app.json/app.config.js**
```javascript
{
  "expo": {
    "plugins": [
      "expo-dev-client",
      ["react-native-pdf", {
        "enablePDFKit": true
      }]
    ]
  }
}
```

#### **Step 3: Generate Native Code**
```bash
# Generate native code for custom builds
npx expo prebuild --clean
```

#### **Step 4: Replace Fallback with Real PDFViewer**
```typescript
// In DocumentViewerScreen.tsx
import PDFViewer from '../../components/documents/DocumentViewer/PDFViewer';
// Remove .fallback when native modules are configured
```

---

## **🎯 Recommended Approach:**

### **For Development (Current):**
✅ **Keep fallback version** - app runs without issues
✅ **Continue Priority 8 development** - all other features work
✅ **Test non-PDF features** - image viewing, annotations, etc.

### **For Production Deployment:**
🏗️ **Implement native module setup** when ready for production
🏗️ **Test PDF viewing** on physical devices
🏗️ **Configure proper build pipeline** with EAS Build

---

## **Current Status:**
- **✅ App Runs**: No more runtime crashes
- **✅ Development Ready**: Can continue building features  
- **⚠️ PDF Viewing**: Shows fallback message (production will have real PDF viewer)
- **✅ All Other Features**: Image viewer, scanner, navigation work perfectly

---

## **Next Steps:**
1. **Continue Priority 8 testing** with current setup
2. **Implement native modules** when ready for production builds
3. **Test on physical devices** for production validation

The app is now **fully functional for development** and **ready for Priority 8 completion!** 🚀