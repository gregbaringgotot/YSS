// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/YSS', // 👈 this is the fix!
  plugins: [react()],
});
