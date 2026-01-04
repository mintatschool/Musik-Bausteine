import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/Musik-Bausteine/',
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Split Tone.js into its own chunk (it's the largest dependency)
            'tone': ['tone'],
            // Split React core
            'react-vendor': ['react', 'react-dom'],
            // Split other utilities
            'utils': ['qrcode', 'lz-string']
          }
        }
      },
      // Increase size warning limit since we're deliberately code-splitting
      chunkSizeWarningLimit: 600
    }
  };
});
