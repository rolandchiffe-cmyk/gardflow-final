import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const EXCLUDE_PATTERN = /copy/i;

function filterPublicPlugin() {
  return {
    name: 'filter-public-copy-files',
    apply: 'build' as const,
    closeBundle() {
      const publicDir = path.resolve(__dirname, 'public');
      const distDir = path.resolve(__dirname, 'dist');
      if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
      const entries = fs.readdirSync(publicDir);
      for (const entry of entries) {
        if (EXCLUDE_PATTERN.test(entry)) continue;
        const src = path.join(publicDir, entry);
        const dest = path.join(distDir, entry);
        if (fs.statSync(src).isFile()) {
          fs.copyFileSync(src, dest);
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), filterPublicPlugin()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  publicDir: false,
  build: {
    assetsDir: 'assets',
    copyPublicDir: false,
  },
});
