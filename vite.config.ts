import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidepanel: resolve(rootDir, 'index.html'),
        background: resolve(rootDir, 'src/background/service-worker.ts'),
        content: resolve(rootDir, 'src/content/content-script.ts')
      },
      output: {
        entryFileNames: (chunk) => chunk.name === 'sidepanel' ? 'assets/[name].js' : '[name].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  }
});
