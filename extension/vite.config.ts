import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-demo-and-test-forms',
      configureServer(server) {
        server.middlewares.use('/demo', (_req, res, next) => {
          const demoPath = resolve(__dirname, '../demo/scholarship-form/index.html');
          if (existsSync(demoPath)) {
            res.setHeader('Content-Type', 'text/html');
            res.end(readFileSync(demoPath, 'utf-8'));
            return;
          }
          next();
        });
        server.middlewares.use('/test', (_req, res, next) => {
          const testPath = resolve(__dirname, '../demo/comprehensive-form/index.html');
          if (existsSync(testPath)) {
            res.setHeader('Content-Type', 'text/html');
            res.end(readFileSync(testPath, 'utf-8'));
            return;
          }
          next();
        });
      },
    },
  ],
  test: { environment: 'jsdom' },
  server: { port: 5173, host: true },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'sidepanel.html'),
        background: resolve(__dirname, 'src/background/worker.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
