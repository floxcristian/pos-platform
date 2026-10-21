import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.implementos.posplatform.mobile',
  appName: 'POS Platform',
  webDir: '../../dist/apps/pos-mobile/browser',
  plugins: {
    SystemBars: {
      insetsHandling: 'native',
      initialViewportFitValueHint: 'cover',
    },
  },
};

export default config;
