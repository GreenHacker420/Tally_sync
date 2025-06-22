# FinSync360 Mobile App Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the FinSync360 mobile application to both iOS and Android platforms.

## Prerequisites

### Development Environment

- **Node.js**: Version 16 or higher
- **React Native CLI**: Latest version
- **Xcode**: Version 14+ (for iOS)
- **Android Studio**: Latest version (for Android)
- **Java**: JDK 11 or higher
- **CocoaPods**: Latest version (for iOS dependencies)

### Accounts Required

- **Apple Developer Account**: For iOS App Store deployment
- **Google Play Console Account**: For Android Play Store deployment
- **Firebase Account**: For push notifications and analytics
- **Sentry Account**: For error tracking (optional)

## Environment Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd finsync360-mobile
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install iOS dependencies (macOS only)
cd ios && pod install && cd ..

# Install Android dependencies
cd android && ./gradlew clean && cd ..
```

### 3. Environment Configuration

Create environment files for different stages:

#### `.env.development`
```
API_BASE_URL=http://localhost:3000/api
WS_BASE_URL=ws://localhost:3000
ENVIRONMENT=development
SENTRY_DSN=your_sentry_dsn_here
FIREBASE_CONFIG=your_firebase_config_here
```

#### `.env.staging`
```
API_BASE_URL=https://staging-api.finsync360.com/api
WS_BASE_URL=wss://staging-api.finsync360.com
ENVIRONMENT=staging
SENTRY_DSN=your_sentry_dsn_here
FIREBASE_CONFIG=your_firebase_config_here
```

#### `.env.production`
```
API_BASE_URL=https://api.finsync360.com/api
WS_BASE_URL=wss://api.finsync360.com
ENVIRONMENT=production
SENTRY_DSN=your_sentry_dsn_here
FIREBASE_CONFIG=your_firebase_config_here
```

## iOS Deployment

### 1. Xcode Configuration

1. Open `ios/FinSync360.xcworkspace` in Xcode
2. Select your development team
3. Configure bundle identifier
4. Set deployment target (iOS 12.0+)
5. Configure signing certificates

### 2. Build Configuration

#### Debug Build
```bash
npx react-native run-ios --configuration Debug
```

#### Release Build
```bash
npx react-native run-ios --configuration Release
```

### 3. App Store Deployment

#### Prepare for Archive
1. Set scheme to Release
2. Select "Any iOS Device" as target
3. Product → Archive

#### Upload to App Store Connect
1. Open Organizer
2. Select your archive
3. Click "Distribute App"
4. Choose "App Store Connect"
5. Follow the upload wizard

#### App Store Connect Configuration
1. Create new app version
2. Upload screenshots and metadata
3. Set pricing and availability
4. Submit for review

### 4. TestFlight Distribution

1. Upload build to App Store Connect
2. Add external testers
3. Provide test information
4. Submit for beta review

## Android Deployment

### 1. Keystore Generation

```bash
# Generate release keystore
keytool -genkeypair -v -storetype PKCS12 -keystore finsync360-release-key.keystore -alias finsync360-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Gradle Configuration

#### `android/gradle.properties`
```properties
MYAPP_RELEASE_STORE_FILE=finsync360-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=finsync360-key-alias
MYAPP_RELEASE_STORE_PASSWORD=your_store_password
MYAPP_RELEASE_KEY_PASSWORD=your_key_password
```

#### `android/app/build.gradle`
```gradle
android {
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
            signingConfig signingConfigs.release
        }
    }
}
```

### 3. Build APK/AAB

#### Debug APK
```bash
cd android && ./gradlew assembleDebug
```

#### Release APK
```bash
cd android && ./gradlew assembleRelease
```

#### Release AAB (recommended for Play Store)
```bash
cd android && ./gradlew bundleRelease
```

### 4. Play Store Deployment

1. Create app in Google Play Console
2. Upload AAB file
3. Configure store listing
4. Set content rating
5. Configure pricing and distribution
6. Submit for review

### 5. Internal Testing

1. Upload AAB to Play Console
2. Create internal testing track
3. Add test users
4. Share testing link

## CI/CD Pipeline

### GitHub Actions Configuration

#### `.github/workflows/ios.yml`
```yaml
name: iOS Build and Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: macos-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '16'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install CocoaPods
      run: cd ios && pod install
    
    - name: Build iOS
      run: npx react-native build-ios --mode Release
    
    - name: Upload to TestFlight
      if: github.ref == 'refs/heads/main'
      run: |
        # Add TestFlight upload script
```

#### `.github/workflows/android.yml`
```yaml
name: Android Build and Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '16'
        cache: 'npm'
    
    - name: Setup Java
      uses: actions/setup-java@v3
      with:
        distribution: 'temurin'
        java-version: '11'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build Android
      run: cd android && ./gradlew bundleRelease
    
    - name: Upload to Play Store
      if: github.ref == 'refs/heads/main'
      run: |
        # Add Play Store upload script
```

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
# iOS
npm run test:e2e:ios

# Android
npm run test:e2e:android
```

## Monitoring and Analytics

### Crash Reporting (Sentry)

1. Install Sentry SDK
2. Configure Sentry in app initialization
3. Set up error boundaries
4. Monitor crash reports

### Analytics (Firebase)

1. Configure Firebase project
2. Add Firebase SDK
3. Implement event tracking
4. Monitor user behavior

### Performance Monitoring

1. Enable Flipper for development
2. Use React Native Performance Monitor
3. Monitor API response times
4. Track app startup time

## Security Checklist

- [ ] Enable code obfuscation
- [ ] Remove debug logs in production
- [ ] Secure API keys and secrets
- [ ] Enable certificate pinning
- [ ] Implement biometric authentication
- [ ] Encrypt sensitive data
- [ ] Enable app transport security

## Post-Deployment

### Monitoring

1. Monitor crash reports
2. Track user feedback
3. Monitor API performance
4. Review analytics data

### Updates

1. Plan regular updates
2. Test thoroughly before release
3. Use staged rollouts
4. Monitor update adoption

### Support

1. Set up user support channels
2. Create troubleshooting guides
3. Monitor app store reviews
4. Respond to user feedback

## Troubleshooting

### Common Build Issues

#### iOS
- Clean build folder: Product → Clean Build Folder
- Reset Metro cache: `npx react-native start --reset-cache`
- Reinstall pods: `cd ios && pod deintegrate && pod install`

#### Android
- Clean project: `cd android && ./gradlew clean`
- Reset Metro cache: `npx react-native start --reset-cache`
- Check Java version compatibility

### Common Deployment Issues

- Verify signing certificates
- Check bundle identifiers
- Validate app permissions
- Review store listing requirements

## Support

For deployment support:
- Check React Native documentation
- Review platform-specific guides
- Contact development team
- Submit issues with detailed logs
