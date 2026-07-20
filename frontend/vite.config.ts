import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // amazon-cognito-identity-js includes a browser Buffer shim that references
  // Node's `global`. Map it to the browser-standard global object.
  define: {
    global: 'globalThis'
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  server: {
    port: 5173
  }
});
