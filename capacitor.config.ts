import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.meystream.app',
  appName: 'MeyStream',
  webDir: 'dist',
  backgroundColor: '#0d070b',
  server: {
    allowNavigation: ['*'],
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#0d070b',
    allowsLinkPreview: false,
    scrollEnabled: true,
  },
};

export default config;
