# Build MAGHGO Android APK

## Prerequisites
- Node.js >= 18
- Android Studio (with Android SDK 34+)
- Java 17+
- A Firebase project (for push notifications)

## Setup Steps

### 1. Firebase Setup (Push Notifications)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (or use existing)
3. Add Android app with package name `com.goatech.maghgo`
4. Download `google-services.json` and copy to:
   ```
   android/app/google-services.json
   ```
5. Enable **Cloud Messaging** API in Firebase

### 2. Google Sign-In Setup
1. In Firebase project, enable **Authentication > Sign-in method > Google**
2. Copy the **Web client ID** (looks like `123...apps.googleusercontent.com`)
3. Set in your `.env`:
   ```
   NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id_here
   ```
4. Update the web client ID in:
   ```
   android/app/src/main/res/xml/config.xml
   ```

### 3. Environment Variables
Copy `.env.example` to `.env` and fill in all values.

### 4. Razorpay Setup
1. Get your Razorpay API keys from [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Set in `.env`:
   ```
   RAZORPAY_KEY_ID=your_key_id
   RAZORPAY_KEY_SECRET=your_key_secret
   ```

### 5. Build APK

**Debug APK:**
```bash
npm run cap:build:debug
```
Output: `android/app/build/outputs/apk/debug/app-debug.apk`

**Release APK:**
```bash
npm run cap:build:release
```
Or with the build script:
```bash
./scripts/build_apk.sh --release
```
Output: `android/app/build/outputs/apk/release/app-release.apk`

### 6. Run on Device
```bash
npm run cap:open
```
This opens Android Studio. Connect your device and click Run.

## Development Workflow
1. Run Next.js dev server: `npm run dev`
2. In another terminal, sync Capacitor: `npm run cap:sync`
3. The app loads from `https://maghgo.goatecch.tech` (configurable in `capacitor.config.ts`)

## Project Structure
```
android/              # Native Android project (Capacitor)
  app/
    src/main/
      AndroidManifest.xml
      java/com/goatech/maghgo/MainActivity.java
      res/              # Icons, splash screen, themes
public/
  manifest.json         # PWA manifest
  sw.js                 # Service worker (web push fallback)
src/
  lib/
    native-bridge.ts    # Capacitor native API wrapper
  components/
    marketplace/
      AppInitializer.tsx # Push registration, splash hide
      AuthModal.tsx      # Native Google Sign-In integration
```

