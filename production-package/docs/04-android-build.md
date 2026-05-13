# Android App Build Guide

Build the Pinnacle Academic Classes Android APK / AAB using Expo EAS Build.

## Prerequisites
- Node.js 22 and pnpm installed
- Expo account (https://expo.dev) — free tier is sufficient
- EAS CLI: `npm install -g eas-cli`
- (For local builds) Android Studio with SDK 34+

---

## App Details
| Field | Value |
|-------|-------|
| Package name | `com.kck.pinnacleac` |
| Bundle identifier | `com.kck.pinnacleac` |
| Version | 1.0.0 |
| Version code | 1 |
| Min SDK | 24 (Android 7.0) |

---

## Option A — EAS Cloud Build (Recommended)

No Android SDK required on your machine — builds run in Expo's cloud.

### 1. Install dependencies
```bash
cd artifacts/pinnacle-mobile
pnpm install
```

### 2. Configure environment
Create `artifacts/pinnacle-mobile/.env`:
```env
EXPO_PUBLIC_API_URL=https://yourdomain.com/api
EXPO_PUBLIC_WEBSITE_URL=https://yourdomain.com
```

### 3. Log in to Expo
```bash
eas login
```

### 4. Configure EAS (first time only)
```bash
eas build:configure
```
This creates `eas.json` in the project root.

### 5. Build APK (for testing / sideloading)
```bash
eas build -p android --profile preview
```

### 6. Build AAB (for Google Play Store)
```bash
eas build -p android --profile production
```

### 7. Download and install
Once the build completes, EAS provides a download link for the APK/AAB.

For direct device install:
```bash
adb install pinnacle.apk
```

---

## Option B — Local Build

Requires Android Studio and a connected device or emulator.

```bash
cd artifacts/pinnacle-mobile
pnpm install
npx expo run:android
```

For a release APK:
```bash
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

---

## Signing for Play Store

1. Generate a keystore:
```bash
keytool -genkey -v -keystore pinnacle-release.keystore \
  -alias pinnacle -keyalg RSA -keysize 2048 -validity 10000
```

2. Add to `android/gradle.properties`:
```properties
MYAPP_UPLOAD_STORE_FILE=pinnacle-release.keystore
MYAPP_UPLOAD_KEY_ALIAS=pinnacle
MYAPP_UPLOAD_STORE_PASSWORD=yourpassword
MYAPP_UPLOAD_KEY_PASSWORD=yourpassword
```

3. Build signed AAB:
```bash
cd android && ./gradlew bundleRelease
```

---

## Updating the app version

Edit `artifacts/pinnacle-mobile/app.json`:
```json
{
  "expo": {
    "version": "1.1.0",
    "android": {
      "versionCode": 2
    }
  }
}
```
