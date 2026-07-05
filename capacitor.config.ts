import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.maghgo.app',
  appName: 'MAGHGO',
  webDir: 'out',
  bundledWebRuntime: false,
  server: {
    // Replace this with your actual deployed website URL when building the APK
    // url: 'https://maghgo.space-z.ai',
    cleartext: true
  }
};

export default config;
