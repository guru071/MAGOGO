import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'tech.goatech.maghgo',
  appName: 'MAGHGO',
  webDir: 'public',
  bundledWebRuntime: false,
  server: {
    url: 'https://maghgo.goatech.tech',
    cleartext: true
  }
};

export default config;
