# MAGHGO — Complete Developer Setup Guide

> **Welcome!** This guide will help you set up Google Login and build an Android APK for the MAGHGO app.
> **No experience? No problem.** Every step is explained in plain English. If you get stuck, there's a Troubleshooting section at the end.

---

## 📖 Table of Contents

1. [What Are We Building?](#1-what-are-we-building)
2. [What You Need Before Starting](#2-what-you-need-before-starting)
3. [Part A: Set Up Google Login](#part-a-set-up-google-login)
   - [A1: Create a Supabase Project](#a1-create-a-supabase-project)
   - [A2: Create a Google Cloud Project](#a2-create-a-google-cloud-project)
   - [A3: Connect Google to Supabase](#a3-connect-google-to-supabase)
   - [A4: Create Your .env File](#a4-create-your-env-file)
   - [A5: Test Google Login](#a5-test-google-login)
4. [Part B: Build the Android APK](#part-b-build-the-android-apk)
   - [B1: Install Android Studio](#b1-install-android-studio)
   - [B2: Install Java 17](#b2-install-java-17)
   - [B3: Create a Firebase Project](#b3-create-a-firebase-project)
   - [B4: Download google-services.json](#b4-download-google-servicesjson)
   - [B5: Set Environment Variables](#b5-set-environment-variables)
   - [B6: Build the APK](#b6-build-the-apk)
   - [B7: Install the APK on Your Phone](#b7-install-the-apk-on-your-phone)
5. [Troubleshooting](#5-troubleshooting)
6. [File Reference](#6-file-reference)

---

## 1. What Are We Building?

**MAGHGO** is a marketplace for AI prompts (text instructions you give to AI tools like ChatGPT, Midjourney, etc.).

This project has two parts:

### Part A: Google Login
Instead of typing email + password, users can click **"Continue with Google"** to sign in instantly. This works in two ways:
- **On the website** (desktop browser) — redirects to Google, then back to the app
- **On the Android app** — opens a Google popup inside the app

### Part B: Android APK
An **APK** is the file format Android uses to install apps (like `.exe` for Windows). We'll convert the MAGHGO website into a real Android app using a tool called **Capacitor**.

---

## 2. What You Need Before Starting

### Required Accounts (all free)

| Account | Why? | Link |
|---------|------|------|
| **Supabase** | Stores user data & handles login | [supabase.com](https://supabase.com) — Sign up with GitHub |
| **Google Cloud** | Creates the "Sign in with Google" button | [console.cloud.google.com](https://console.cloud.google.com) |
| **Firebase** | Sends push notifications to Android phones | [console.firebase.google.com](https://console.firebase.google.com) |

### Required Software

| Software | Why? | Download |
|----------|------|----------|
| **Node.js** (v18+) | Runs the code | [nodejs.org](https://nodejs.org) — download LTS version |
| **Visual Studio Code** | Edits the code files | [code.visualstudio.com](https://code.visualstudio.com) |
| **Android Studio** | Builds the Android app | [developer.android.com/studio](https://developer.android.com/studio) |
| **Java 17** | Android needs Java to compile | Included with Android Studio, or download separately |

---

## Part A: Set Up Google Login

---

### A1: Create a Supabase Project

Supabase is like a backend-in-a-box. It stores user accounts and handles passwords securely so you don't have to build all that yourself.

**Step 1: Go to Supabase**
1. Open your browser and go to [supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign in with your GitHub account (create one if needed — it's free)

**Step 2: Create a new project**
1. Click **"New project"**
2. **Name**: `MAGHGO` (or anything you like)
3. **Database Password**: Click **"Generate a secure password"** — copy it somewhere safe! You'll need it later.
4. **Region**: Pick the closest to you (e.g., `Singapore` for India, `US East` for USA)
5. **Pricing Plan**: **Free** is fine
6. Click **"Create new project"**
7. Wait 1-2 minutes while Supabase sets up your database

**Step 3: Find your Supabase keys**
1. In the left sidebar, click **"Project Settings"** (gear icon)
2. Click **"API"** in the menu
3. You'll see three important values:

   | Value | What it is | Looks like |
   |-------|------------|------------|
   | **Project URL** | Your project's address | `https://abcdefghijkl.supabase.co` |
   | **anon public key** | Public key for the website | `eyJhbGciOiJIUzI1NiIs...` (long text) |
   | **service_role key** | Secret key for admin tasks | `eyJhbGciOiJIUzI1NiIs...` (different long text) |

   > ⚠️ **Keep the service_role key secret!** Never share it or put it in your website code.

4. Copy these three values into a text file — you'll use them in [Section A4](#a4-create-your-env-file).

---

### A2: Create a Google Cloud Project

This lets you use Google's login system. When a user clicks "Sign in with Google", Google sends us their email and name.

**Step 1: Go to Google Cloud Console**
1. Open [console.cloud.google.com](https://console.cloud.google.com)
2. Sign in with your Google account
3. Accept the terms if prompted

**Step 2: Create a new project**
1. At the top, click the project dropdown (next to "Google Cloud" logo)
2. Click **"New Project"**
3. **Project name**: `MAGHGO Login`
4. Click **"Create"**
5. Wait a few seconds, then click the notification bell icon (top right) and click the project name to open it

**Step 3: Enable the OAuth consent screen**
1. In the left sidebar, go to **"APIs & Services"** → **"OAuth consent screen"**
2. **User Type**: Select **"External"** (this lets anyone with a Google account sign in)
3. Click **"CREATE"**
4. **App name**: `MAGHGO`
5. **User support email**: Your email address
6. **Developer contact information**: Your email address
7. Click **"SAVE AND CONTINUE"**
8. **Scopes page**: Just click **"SAVE AND CONTINUE"** (don't change anything)
9. **Test users page**: Click **"SAVE AND CONTINUE"**
10. Click **"BACK TO DASHBOARD"**

**Step 4: Create OAuth credentials**
1. In the left sidebar, click **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Choose **"OAuth client ID"**
4. **Application type**: **"Web application"**
5. **Name**: `MAGHGO Supabase`
6. **Authorized JavaScript origins**: Click **"+ ADD URI"** and add:
   ```
   https://<your-project>.supabase.co
   ```
   (Replace `<your-project>` with your actual Supabase project URL — e.g., `https://abcdefghijkl.supabase.co`)

7. **Authorized redirect URIs**: Click **"+ ADD URI"** and add:
   ```
   https://<your-project>.supabase.co/auth/v1/callback
   ```
   (Same substitution — use your Supabase project URL)

8. Click **"CREATE"**
9. A popup will show your **Client ID** and **Client Secret**

   | Value | What it is | Looks like |
   |-------|------------|------------|
   | **Client ID** | Google identifies your app | `1234567890-abc123.apps.googleusercontent.com` |
   | **Client Secret** | Secret key for Google | `GOCSPX-...` (starts with GOCSPX) |

10. Copy your **Client ID** into your text file. You don't need the Client Secret for this setup.

---

### A3: Connect Google to Supabase

Now we tell Supabase: "Hey, users can sign in with Google, and here's the key to make it work."

**Step 1: Open Supabase Authentication Settings**
1. Go back to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click your MAGHGO project
3. In the left sidebar, click **"Authentication"** (shield icon)
4. Click **"Providers"**

**Step 2: Enable Google**
1. Find **"Google"** in the list and click the toggle switch to turn it **ON** (it will turn blue)
2. **Client ID**: Paste the **Client ID** you copied from Google Cloud Console
3. **Client Secret**: Paste the **Client Secret** from Google Cloud Console
4. Click **"Save"**

✅ **Google Login is now connected!** When the app's "Continue with Google" button is clicked, Supabase handles the rest.

---

### A4: Create Your .env File

The `.env` file stores secret keys and configuration. It's like a settings file that the code reads when it starts.

**Step 1: Find the example file**
1. Open the MAGHGO project folder on your computer
2. Look for a file named `.env.example`
3. Right-click it → **Copy**
4. Right-click in the same folder → **Paste**
5. Rename the copy to `.env`

   > 💡 **Note**: Files starting with a dot (`.env`) are hidden on some systems. In VS Code, you can see them in the file explorer.

**Step 2: Fill in the values**

Open `.env` in VS Code (right-click → "Open with Code"). It will look like this:

```env
# ── Database ──
DATABASE_URL=postgresql://user:password@host:5432/dbname
DIRECT_URL=postgresql://user:password@host:5432/dbname?sslmode=require
```

Now fill in each value using the information you saved:

| Variable | What to put | Where to get it |
|----------|-------------|-----------------|
| `DATABASE_URL` | Database connection string | Supabase → Project Settings → Database → Connection string (use "URI" version, replace `[YOUR-PASSWORD]` with the password you saved) |
| `DIRECT_URL` | Same as DATABASE_URL + `?sslmode=require` at the end | Add `?sslmode=require` to the end of your DATABASE_URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The "anon public" key | Supabase → Project Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | The "service_role" key | Supabase → Project Settings → API → service_role key |
| `NEXT_PUBLIC_SITE_URL` | Your website address | For testing: `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | Same as above | `http://localhost:3000` |
| `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google Client ID | Google Cloud Console → Credentials → OAuth client ID |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay public key | [dashboard.razorpay.com](https://dashboard.razorpay.com) → API Keys |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key | Same page as above |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | [cloudinary.com](https://cloudinary.com) console |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Same page |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Same page |

> 💡 **For testing**, you only **need** these to work:
> - `DATABASE_URL` and `DIRECT_URL`
> - `NEXT_PUBLIC_SUPABASE_URL`
> - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
> - `SUPABASE_SERVICE_ROLE_KEY`
> - `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID`
> - `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_APP_URL`
>
> Razorpay, Cloudinary, and others can be left as-is if you're just testing Google Login.

---

### A5: Test Google Login

**Step 1: Start the development server**
1. Open Terminal (VS Code: `View` → `Terminal`, or Ctrl+`)
2. Type this command and press Enter:
   ```bash
   npm run dev
   ```
3. Wait until you see: `▲ Next.js 16.x.x` and `Local: http://localhost:3000`

**Step 2: Open the app**
1. Open your browser
2. Go to `http://localhost:3000`
3. Click **"Get Started"** or any button that shows the login popup

**Step 3: Try Google Login**
1. In the login popup, click **"Continue with Google"**
2. Select your Google account
3. You'll be redirected back to the app
4. ✅ You should be logged in! Your name/email should appear in the top right.

> ❌ **Doesn't work?** See [Troubleshooting](#5-troubleshooting) at the bottom.

---

## Part B: Build the Android APK

---

### B1: Install Android Studio

Android Studio is the program that compiles your code into an Android app file (APK).

**Step 1: Download**
1. Go to [developer.android.com/studio](https://developer.android.com/studio)
2. Click the big **"Download Android Studio"** button
3. Accept the terms

**Step 2: Install**
1. Run the downloaded installer
2. Click **Next** through the wizard (default settings are fine)
3. When it asks about components, make sure **"Android Virtual Device"** is checked (optional)
4. Click **Finish** when done

**Step 3: Install Android SDK**
1. Open Android Studio
2. You'll see a welcome screen — click **"More Actions"** → **"SDK Manager"**
3. Make sure **"Android 14.0 (API 34)"** is checked
4. Click **"Apply"** → **"OK"**
5. Wait for the download to finish

**Step 4: Find your SDK location**
1. In SDK Manager, look at the top — there's an **"Android SDK Location"** path
2. It's usually:
   - **Windows**: `C:\Users\YourName\AppData\Local\Android\Sdk`
   - **Mac**: `~/Library/Android/sdk`
   - **Linux**: `~/Android/Sdk`
3. Write this down — you'll need it in [Section B5](#b5-set-environment-variables)

---

### B2: Install Java 17

Android needs Java Development Kit (JDK) version 17.

**Check if you have Java:**
1. Open Terminal
2. Type: `java -version`
3. If you see `openjdk version "17.x.x"` — you're good! Skip to [Section B3](#b3-create-a-firebase-project)

**If you don't have Java 17:**

**Windows:**
1. Android Studio already includes Java! Find it at:
   `C:\Program Files\Android\Android Studio\jre`
   This IS Java 17.

**Mac/Linux:**
1. Install via terminal:
   ```bash
   # Mac
   brew install openjdk@17

   # Linux (Ubuntu/Debian)
   sudo apt install openjdk-17-jdk
   ```

---

### B3: Create a Firebase Project

Firebase sends push notifications (alerts) to Android phones. We need it for the Google Sign-In to work on Android.

**Step 1: Go to Firebase**
1. Open [console.firebase.google.com](https://console.firebase.google.com)
2. Sign in with your Google account
3. Click **"Create a project"** (or **"Add project"**)

**Step 2: Create the project**
1. **Project name**: `MAGHGO`
2. **Google Analytics**: Toggle it **OFF** (we don't need it)
3. Click **"Create project"**
4. Wait 10-20 seconds
5. Click **"Continue"**

**Step 3: Add Android app**
1. On the project overview page, click the **Android icon** (it says "Add an app to get started")
2. **Android package name**: Type exactly: `com.maghgo.app`
   > ⚠️ **This must match exactly!** Check `android/app/build.gradle` → `applicationId "com.maghgo.app"` — it should be the same.
3. **App nickname**: `MAGHGO Android`
4. Click **"Register app"**

**Step 4: Download google-services.json**
1. Click **"Download google-services.json"**
2. Save the file somewhere you can find it (Downloads folder is fine)
3. Click **"Next"** (skip the other instructions)
4. Click **"Next"** again
5. Click **"Continue to console"**

---

### B4: Replace google-services.json

The `google-services.json` file tells Android how to connect to Firebase.

**Step 1: Find the old file**
1. In the MAGHGO project folder, go to: `android/app/`
2. You'll see a file named `google-services.json`

**Step 2: Replace it**
1. Open the file you downloaded from Firebase
2. Copy it
3. Go to `android/app/` in the MAGHGO folder
4. **Paste** and **overwrite** the existing `google-services.json`

> 💡 **How to check if it worked**: Open the new `google-services.json` in VS Code. If you see real values (not `YOUR_PROJECT_NUMBER`), you're good.

---

### B5: Set Environment Variables

Your computer needs to know where Android SDK and Java are installed.

#### Windows

**Step 1: Find your paths**
1. **Android SDK**: Usually `C:\Users\YourName\AppData\Local\Android\Sdk`
2. **Java**: Usually `C:\Program Files\Android\Android Studio\jre`

**Step 2: Set them**
1. Press **Windows Key** → type **"Environment Variables"**
2. Click **"Edit the system environment variables"**
3. Click **"Environment Variables..."** (bottom right)
4. Under **"User variables"**, click **"New"**:

   Create TWO variables:

   | Variable | Value |
   |----------|-------|
   | `ANDROID_HOME` | `C:\Users\YourName\AppData\Local\Android\Sdk` (use YOUR username) |
   | `JAVA_HOME` | `C:\Program Files\Android\Android Studio\jre` |

5. Click **"OK"** on each window to save

#### Mac / Linux

Add to your `~/.zshrc` or `~/.bashrc`:

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk  # Mac: /usr/local/opt/openjdk@17
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools
```

Then run: `source ~/.zshrc` (or restart terminal)

---

### B6: Build the APK

Now we finally build the actual Android app file!

**Step 1: Build the website first**
1. Open Terminal in VS Code (make sure it's in the MAGHGO project folder)
2. Type:
   ```bash
   npm run build
   ```
3. Wait for it to finish (1-2 minutes). You should see: `✓ Compiled successfully`

**Step 2: Copy to Android**
```bash
npx cap copy android
```
This copies the built website into the Android project.

**Step 3: Sync plugins**
```bash
npx cap sync android
```
This makes sure all the plugins (Google Auth, Push Notifications, etc.) are installed.

**Step 4: Build the APK**
```bash
npm run cap:build:debug
```

This will:
1. Go into the `android` folder
2. Use Gradle (Android's builder) to compile everything
3. Output the APK file

**Step 5: Find your APK**
After it finishes successfully (no errors), your APK is at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

### B7: Install the APK on Your Phone

**Method 1: Direct download (easiest)**
1. Connect your phone to your computer via USB
2. Copy the `app-debug.apk` file to your phone
3. On your phone, open the **Files** app
4. Find the APK and tap it
5. Allow installation from unknown sources (your phone will guide you)
6. Tap **"Install"**

**Method 2: Using the development server**
1. Run `npm run cap:open` — this opens Android Studio
2. In Android Studio, connect your phone via USB
3. Make sure USB Debugging is enabled on your phone (Settings → Developer Options → USB Debugging)
4. Click the **"Run"** button (green play icon ▶️) in Android Studio
5. Select your phone from the list
6. Android Studio will install and launch the app automatically

---

## 5. Troubleshooting

### Google Login Issues

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| "redirect_uri_mismatch" error | Wrong callback URL in Google Cloud Console | Go back to [A2 Step 4](#a2-create-a-google-cloud-project) and check you added the Supabase callback URL correctly |
| White screen after Google login | Missing Supabase environment variables | Check `.env` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set correctly |
| "User not found" after Google login | Profile wasn't created in database | We fixed this! Make sure you're running the latest code. If still happening, check Terminal for errors. |
| Google button does nothing when clicked | Browser blocking popup | Allow popups for this site, or try clicking the button again |
| "Invalid OAuth client ID" | Wrong Client ID in Supabase | Double-check the Client ID pasted in Supabase Google provider settings matches Google Cloud Console |

### APK Build Issues

| Problem | Likely Cause | Fix |
|---------|-------------|------|
| `JAVA_HOME is not set` | Java not found | Set JAVA_HOME as shown in [B5](#b5-set-environment-variables) |
| `Android SDK not found` | SDK not installed or not in PATH | Set ANDROID_HOME as shown in [B5](#b5-set-environment-variables) |
| `Execution failed for task ':app:processDebugGoogleServices'` | Bad google-services.json | Redownload from Firebase and replace the file |
| `Could not find com.android.tools.build:gradle` | No internet | Make sure you have a working internet connection during first build |
| BUILD FAILED with no clear message | Try: | `cd android && ./gradlew clean` then try building again |
| App installs but shows blank screen | Web content didn't copy | Run `npx cap copy android` then rebuild |
| Google login works on web but not in Android app | Missing google-services.json or wrong config | Make sure `google-services.json` has the `oauth_client` section with `client_type: 3` containing your Web Client ID |

### Server / npm Issues

| Problem | Likely Cause | Fix |
|---------|-------------|------|
| `npm run dev` gives "command not found" | Node.js not installed | Install from [nodejs.org](https://nodejs.org) |
| `Error: listen EADDRINUSE :::3000` | Port 3000 already in use | Close other programs using port 3000, or use `npm run dev -- -p 3001` |
| Prisma errors about missing env | `.env` not set up correctly | Double-check `DATABASE_URL` in `.env` |
| `Module not found` errors | Dependencies not installed | Run `npm install --legacy-peer-deps` |

---

## 6. File Reference

Here's every file related to Google Login and the Android build, with a simple explanation of what it does.

### Google Login Files

| File | What it does |
|------|-------------|
| `src/lib/supabase-client.ts` | Creates a Supabase connection for the browser (website) |
| `src/lib/supabase-server.ts` | Creates a Supabase connection for the server (handles cookies securely) |
| `src/lib/supabase-admin.ts` | Creates a Supabase connection with admin powers (creating users, etc.) |
| `src/lib/native-bridge.ts` | Talks to the Android phone directly — handles Google Sign-In inside the app, push notifications, and payments |
| `src/lib/auth.ts` | Server-side login/signup logic — checks passwords, creates user accounts |
| `src/lib/auth-helpers.ts` | Helper functions to check "is this user logged in?" or "is this user an admin?" |
| `src/app/api/auth/me/route.ts` | API endpoint that returns the currently logged-in user's information |
| `src/app/api/auth/login/route.ts` | API endpoint for email/password login |
| `src/app/api/auth/register/route.ts` | API endpoint for creating a new account |
| `src/app/api/auth/logout/route.ts` | API endpoint for signing out |
| `src/app/auth/callback/route.ts` | The page Google redirects to after login — it saves the session |
| `src/components/marketplace/AuthModal.tsx` | The login popup you see on the website — has the Google button |
| `src/components/marketplace/AppInitializer.tsx` | Runs when the app starts — hides splash screen, sets up push notifications |
| `src/store/marketplace.ts` | The main data store — contains `signInWithGoogle`, `login`, `register`, `logout` functions |
| `capacitor.config.ts` | Configures the app name, ID (com.maghgo.app), and Google Auth plugin settings |

### Android Build Files

| File | What it does |
|------|-------------|
| `android/` | The entire Android app project (auto-generated by Capacitor) |
| `android/app/google-services.json` | Firebase configuration — **you need to replace this with your real one** |
| `android/app/build.gradle` | Android build settings — app version, SDK versions, dependencies |
| `android/app/src/main/AndroidManifest.xml` | Android app permissions (internet, notifications, etc.) |
| `android/app/src/main/java/com/maghgo/app/MainActivity.java` | The main Android activity (app entry point) |
| `capacitor.config.ts` | Capacitor configuration — app ID, name, splash screen, Google Auth |
| `scripts/build_apk.sh` | Shell script that automates the APK build process |
| `BUILD_APK.md` | Quick build instructions |
| `SETUP_GOOGLE_LOGIN_AND_APK.md` | **This file** — full setup guide |

### Database (Prisma) Files

| File | What it does |
|------|-------------|
| `prisma/schema.prisma` | Defines the database structure — User table, Prompt table, etc. |
| `src/lib/db.ts` | Creates the database connection using Prisma |

---

## Quick Start Checklist

Use this checklist to track your progress:

### Part A: Google Login
- [ ] Created Supabase project
- [ ] Saved Supabase URL, anon key, and service_role key
- [ ] Created Google Cloud project
- [ ] Created OAuth consent screen
- [ ] Created OAuth client ID (Web application)
- [ ] Added Supabase callback URL to Google Cloud
- [ ] Enabled Google provider in Supabase
- [ ] Pasted Client ID & Secret in Supabase
- [ ] Created `.env` file with all values
- [ ] Ran `npm run dev` and tested Google Login

### Part B: Android APK
- [ ] Installed Android Studio
- [ ] Installed Android SDK (API 34)
- [ ] Installed Java 17 (or found it in Android Studio)
- [ ] Created Firebase project
- [ ] Added Android app (package: com.maghgo.app)
- [ ] Downloaded `google-services.json`
- [ ] Replaced `android/app/google-services.json`
- [ ] Set `ANDROID_HOME` environment variable
- [ ] Set `JAVA_HOME` environment variable
- [ ] Ran `npm run build`
- [ ] Ran `npx cap copy android`
- [ ] Ran `npm run cap:build:debug`
- [ ] Found APK at `android/app/build/outputs/apk/debug/app-debug.apk`
- [ ] Installed APK on phone

---

> **Need more help?** If you're stuck on any step, here are some resources:
> - **Supabase Google Auth docs**: [supabase.com/docs/guides/auth/social-login/auth-google](https://supabase.com/docs/guides/auth/social-login/auth-google)
> - **Capacitor Android docs**: [capacitorjs.com/docs/android](https://capacitorjs.com/docs/android)
> - **Firebase setup guide**: [firebase.google.com/docs/android/setup](https://firebase.google.com/docs/android/setup)
> - **Google OAuth docs**: [developers.google.com/identity/protocols/oauth2](https://developers.google.com/identity/protocols/oauth2)
