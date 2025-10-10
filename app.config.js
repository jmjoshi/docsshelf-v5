export default {
  expo: {
    name: "DocShelf v5",
    slug: "docsshelf-v5",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.docsshelf.v5"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      },
      package: "com.docsshelf.v5",
      permissions: [
        "CAMERA",
        "RECORD_AUDIO",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      // OCR Configuration - Set these for production
      googleVisionApiKey: process.env.GOOGLE_VISION_API_KEY || "",
      enableRealOCR: process.env.ENABLE_REAL_OCR === "true" || false,
      
      // For development, you can enable real OCR by setting:
      // ENABLE_REAL_OCR=true in your environment
      // GOOGLE_VISION_API_KEY=your_api_key_here
    },
    plugins: [
      "expo-camera",
      "expo-media-library",
      "expo-document-picker"
    ]
  }
};