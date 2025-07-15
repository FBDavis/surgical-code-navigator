import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.3aa0b74b7971401080e3d221df804ec9',
  appName: 'surgical-code-navigator',
  webDir: 'dist',
  server: {
    url: 'https://3aa0b74b-7971-4010-80e3-d221df804ec9.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    }
  }
};

export default config;