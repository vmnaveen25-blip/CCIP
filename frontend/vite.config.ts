import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            if (res && !('headersSent' in res && res.headersSent)) {
              res.writeHead(503, {
                'Content-Type': 'application/json',
              });
              res.end(JSON.stringify({
                error: {
                  code: 'BACKEND_OFFLINE',
                  message: 'The CCIP Enclave backend server is offline or unreachable on port 8000. Please start the backend service.',
                }
              }));
            }
          });
        }
      },
      '/ws': {
        target: 'ws://127.0.0.1:8000',
        ws: true
      }
    }
  }
});
