import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Static hosts (GitHub Pages) only serve real files, so give /admin its own
 * index.html. It is the same app; App.jsx shows the admin screen on that path.
 */
function adminPage() {
  return {
    name: 'admin-page',
    apply: 'build',
    closeBundle() {
      const out = resolve(__dirname, 'dist');
      mkdirSync(resolve(out, 'admin'), { recursive: true });
      copyFileSync(resolve(out, 'index.html'), resolve(out, 'admin/index.html'));
    },
  };
}

// BASE_PATH is set by the GitHub Actions workflow to "/<repository-name>/".
// For a custom domain or a <user>.github.io repository, set it to "/".
// Locally it defaults to "/".
export default defineConfig({
  plugins: [react(), adminPage()],
  base: process.env.BASE_PATH || '/',
  build: {
    target: 'es2019',
    cssCodeSplit: true,
    sourcemap: false,
  },
});
