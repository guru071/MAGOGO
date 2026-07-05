import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.maghgo.app',
  appName: 'MAGHGO',
  webDir: 'out',
  server: {
    url: 'https://maghgo.goatech.tech',
    cleartext: true
  }
};

export default config;
