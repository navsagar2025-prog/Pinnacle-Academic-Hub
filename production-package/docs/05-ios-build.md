# iOS App Build Guide

Build the Pinnacle Academic Classes iOS app (.ipa) using Expo EAS Build.

## Prerequisites
- Node.js 22 and pnpm
- Apple Developer account (https://developer.apple.com) — $99/year required for App Store distribution
- EAS CLI: `npm install -g eas-cli`
- (For local builds) macOS with Xcode 15+

---

## App Details
| Field | Value |
|-------|-------|
| Bundle identifier | `com.kck.pinnacleac` |
| Build number | 1 |
| Deployment target | iOS 16+ |
| Orientation | Portrait only |
| Supports Tablet | No |

---

## Option A — EAS Cloud Build (Recommended)

Expo's cloud handles code signing — no Mac required for the build itself.

### 1. Install dependencies
```bash
cd artifacts/pinnacle-mobile
pnpm install
```

### 2. Configure environment
```env
EXPO_PUBLIC_API_URL=https://yourdomain.com/api
EXPO_PUBLIC_WEBSITE_URL=https://yourdomain.com
```

### 3. Log in and configure
```bash
eas login
eas build:configure
```

### 4. Build for TestFlight (internal testing)
```bash
eas build -p ios --profile preview
```

### 5. Build for App Store (production)
```bash
eas build -p ios --profile production
```

EAS automatically handles:
- Provisioning profiles
- Code signing certificates
- Entitlements

### 6. Submit to App Store
```bash
eas submit -p ios
```

---

## Option B — Local Build (macOS only)

```bash
cd artifacts/pinnacle-mobile
pnpm install
npx expo run:ios
```

For a release build:
```bash
npx expo prebuild --platform ios
cd ios
xcodebuild -workspace PinnacleAcademicClasses.xcworkspace \
  -scheme PinnacleAcademicClasses \
  -configuration Release \
  -archivePath PinnacleAcademicClasses.xcarchive archive
```

Then export the archive using Xcode → Organizer → Distribute App.

---

## Required Apple Developer Setup

1. Log in to https://developer.apple.com
2. Create an App ID: `com.kck.pinnacleac`
3. Enable capabilities:
   - Push Notifications
   - Associated Domains (if using universal links)
4. Create a Distribution Certificate
5. Create an App Store Provisioning Profile

EAS handles steps 4–5 automatically via `eas build`.

---

## Permissions Configured
The app already declares the following permissions in `app.json`:

| Permission | Purpose |
|------------|---------|
| NSCameraUsageDescription | OCR scanning of question papers |
| NSPhotoLibraryUsageDescription | Attach documents and images |
| NSMicrophoneUsageDescription | Live class audio |
| NSLocationWhenInUseUsageDescription | Show nearest centre |

---

## Updating the app version

Edit `artifacts/pinnacle-mobile/app.json`:
```json
{
  "expo": {
    "version": "1.1.0",
    "ios": {
      "buildNumber": "2"
    }
  }
}
```
