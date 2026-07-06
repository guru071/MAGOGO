import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.maghgo.app',
  appName: 'MAGHGO',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#2874F0',
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
    },
  },
};

export default config;
