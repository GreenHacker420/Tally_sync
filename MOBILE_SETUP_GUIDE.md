# 📱 Mobile App Setup Guide - FinSync360

This guide covers setting up, building, and distributing the React Native mobile application.

## 📋 Prerequisites

### 1. Development Environment Setup

**For iOS Development (macOS only):**
```bash
# Install Xcode from App Store
# Install Xcode Command Line Tools
xcode-select --install

# Install CocoaPods
sudo gem install cocoapods
```

**For Android Development:**
```bash
# Install Android Studio
# Download from: https://developer.android.com/studio

# Set up Android SDK and environment variables
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

**React Native CLI:**
```bash
npm install -g @react-native-community/cli
```

### 2. Install Dependencies

```bash
cd mobile
npm install

# For iOS (macOS only)
cd ios && pod install && cd ..
```

## 🔧 Configuration

### 1. API Configuration

Create or update the API configuration file:

```javascript
// mobile/src/config/api.js
const API_CONFIG = {
  // Development
  DEV_BASE_URL: 'http://localhost:5000/api',
  
  // Production (replace with your Heroku backend URL)
  PROD_BASE_URL: 'https://your-app-name-backend.herokuapp.com/api',
  
  // Current environment
  BASE_URL: __DEV__ 
    ? 'http://localhost:5000/api' 
    : 'https://your-app-name-backend.herokuapp.com/api',
    
  TIMEOUT: 10000,
  
  // WebSocket configuration
  WS_URL: __DEV__ 
    ? 'ws://localhost:5000' 
    : 'wss://your-app-name-backend.herokuapp.com'
};

export default API_CONFIG;
```

### 2. Environment Configuration

Create environment configuration:

```javascript
// mobile/src/config/environment.js
export const ENV = {
  API_URL: __DEV__ 
    ? 'http://localhost:5000/api' 
    : 'https://your-app-name-backend.herokuapp.com/api',
  
  APP_NAME: 'FinSync360',
  VERSION: '1.0.0',
  
  // Feature flags
  FEATURES: {
    OFFLINE_MODE: true,
    BIOMETRIC_AUTH: true,
    PUSH_NOTIFICATIONS: true,
    TALLY_SYNC: true,
  },
  
  // Database configuration
  DB_NAME: 'finsync360.db',
  DB_VERSION: '1.0',
};
```

## 🚀 Running the App

### Development Mode

**Start Metro bundler:**
```bash
cd mobile
npm start
```

**Run on iOS Simulator:**
```bash
npm run ios
# Or specify simulator
npm run ios -- --simulator="iPhone 14 Pro"
```

**Run on Android Emulator:**
```bash
npm run android
```

**Run on Physical Device:**
```bash
# iOS (requires Apple Developer account)
npm run ios -- --device

# Android
npm run android -- --deviceId=<device-id>
```

### Debugging

**Enable debugging:**
```bash
# Shake device or press Cmd+D (iOS) / Cmd+M (Android)
# Select "Debug" from the menu
```

**View logs:**
```bash
# iOS
npx react-native log-ios

# Android
npx react-native log-android
```

## 🏗️ Building for Production

### iOS Production Build

1. **Configure signing in Xcode:**
   - Open `mobile/ios/FinSync360Mobile.xcworkspace`
   - Select your team and signing certificate
   - Configure provisioning profiles

2. **Build for release:**
```bash
cd mobile
npm run build:ios

# Or manually in Xcode:
# Product → Archive
```

3. **Upload to App Store:**
   - Use Xcode Organizer
   - Or use Application Loader
   - Or use `xcrun altool`

### Android Production Build

1. **Generate signing key:**
```bash
cd mobile/android/app
keytool -genkeypair -v -storetype PKCS12 -keystore finsync360-release-key.keystore -alias finsync360-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. **Configure signing in gradle:**
```gradle
// mobile/android/app/build.gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            ...
            signingConfig signingConfigs.release
        }
    }
}
```

3. **Build APK:**
```bash
cd mobile
npm run build:android

# Or manually:
cd android
./gradlew assembleRelease
```

4. **Build AAB (for Play Store):**
```bash
cd mobile/android
./gradlew bundleRelease
```

## 📦 Distribution

### iOS App Store

1. **Prepare app metadata:**
   - App name, description, keywords
   - Screenshots for all device sizes
   - App icon (1024x1024)

2. **Upload to App Store Connect:**
   - Use Xcode or Application Loader
   - Fill in app information
   - Submit for review

### Google Play Store

1. **Prepare app metadata:**
   - App title, description
   - Screenshots for phones and tablets
   - Feature graphic (1024x500)
   - App icon (512x512)

2. **Upload to Play Console:**
   - Create new app
   - Upload AAB file
   - Fill in store listing
   - Submit for review

### Internal Distribution

**iOS (TestFlight):**
```bash
# Upload to TestFlight via Xcode
# Add internal/external testers
# Distribute builds
```

**Android (Internal Testing):**
```bash
# Upload to Play Console
# Create internal testing track
# Add testers via email
```

## 🔐 Security Configuration

### 1. API Security

```javascript
// mobile/src/services/apiService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

class ApiService {
  constructor() {
    this.baseURL = ENV.API_URL;
    this.timeout = 10000;
  }

  async getAuthToken() {
    return await AsyncStorage.getItem('authToken');
  }

  async makeRequest(endpoint, options = {}) {
    const token = await this.getAuthToken();
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers,
      },
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
}

export default new ApiService();
```

### 2. Secure Storage

```javascript
// mobile/src/services/secureStorage.js
import EncryptedStorage from 'react-native-encrypted-storage';

export const SecureStorage = {
  async setItem(key, value) {
    try {
      await EncryptedStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('SecureStorage setItem error:', error);
    }
  },

  async getItem(key) {
    try {
      const value = await EncryptedStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('SecureStorage getItem error:', error);
      return null;
    }
  },

  async removeItem(key) {
    try {
      await EncryptedStorage.removeItem(key);
    } catch (error) {
      console.error('SecureStorage removeItem error:', error);
    }
  },

  async clear() {
    try {
      await EncryptedStorage.clear();
    } catch (error) {
      console.error('SecureStorage clear error:', error);
    }
  },
};
```

## 🔄 Offline Sync Configuration

The app includes offline capabilities. Configure sync settings:

```javascript
// mobile/src/config/sync.js
export const SYNC_CONFIG = {
  // Sync intervals (in milliseconds)
  AUTO_SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutes
  BACKGROUND_SYNC_INTERVAL: 15 * 60 * 1000, // 15 minutes
  
  // Retry configuration
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000, // 2 seconds
  
  // Batch sizes
  SYNC_BATCH_SIZE: 50,
  MAX_PENDING_CHANGES: 1000,
  
  // Conflict resolution
  CONFLICT_RESOLUTION: 'server_wins', // 'server_wins', 'client_wins', 'manual'
};
```

## 🧪 Testing

### Unit Tests
```bash
cd mobile
npm test
```

### E2E Tests (Detox)
```bash
# Install Detox CLI
npm install -g detox-cli

# Build for testing
detox build --configuration ios.sim.debug

# Run tests
detox test --configuration ios.sim.debug
```

## 🚨 Troubleshooting

### Common Issues

**Metro bundler issues:**
```bash
cd mobile
npm start -- --reset-cache
```

**iOS build issues:**
```bash
cd mobile/ios
pod deintegrate && pod install
```

**Android build issues:**
```bash
cd mobile/android
./gradlew clean
```

**Network issues in development:**
```bash
# For Android emulator, use 10.0.2.2 instead of localhost
# For iOS simulator, localhost should work
```

## 📊 Performance Optimization

### 1. Bundle Size Optimization
```bash
# Analyze bundle
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android-bundle.js --analyze
```

### 2. Image Optimization
- Use WebP format for images
- Implement lazy loading
- Use appropriate image sizes

### 3. Memory Management
- Implement proper cleanup in useEffect
- Use FlatList for large lists
- Optimize re-renders with React.memo

---

**🎉 Your mobile app is now ready for development and distribution!**

For additional help:
- React Native Documentation: https://reactnative.dev/
- iOS Distribution: https://developer.apple.com/
- Android Distribution: https://developer.android.com/
