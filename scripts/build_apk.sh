#!/bin/bash
set -e

# MAGHGO Android APK Builder
# Usage: ./scripts/build_apk.sh [--release]

echo "=== MAGHGO Android APK Builder ==="

# 1. Install dependencies
echo ">>> Installing npm dependencies..."
npm install --legacy-peer-deps

# 2. Build Next.js app
echo ">>> Building Next.js app..."
npm run build

# 3. Copy web assets to Android
echo ">>> Copying web assets to Android..."
npx cap copy android

# 4. Sync plugins
echo ">>> Syncing Capacitor plugins..."
npx cap sync android

# 5. Build APK
echo ">>> Building Android APK..."
cd android

if [ "$1" == "--release" ]; then
  echo ">>> Release build..."
  ./gradlew assembleRelease
  echo ">>> APK generated at: android/app/build/outputs/apk/release/app-release.apk"
else
  echo ">>> Debug build..."
  ./gradlew assembleDebug
  echo ">>> APK generated at: android/app/build/outputs/apk/debug/app-debug.apk"
fi

cd ..

echo "=== Done ==="
