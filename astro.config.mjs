import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://montanars.com',
  vite: {
    server: {
      allowedHosts: ['anguirus.taila77bcb.ts.net'],
    },
  },
});
