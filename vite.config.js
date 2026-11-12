import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Static hosts (GitHub Pages) only serve real files, so give /admin its own
 * index.html. It is the same app; App.jsx shows the admin screen on that path.
 */
function extraPages(base, apiUrl) {
  return {
    name: 'extra-pages',
    apply: 'build',
    closeBundle() {
      const out = resolve(__dirname, 'dist');
      // /admin: same app, App.jsx shows the admin screen on that path.
      mkdirSync(resolve(out, 'admin'), { recursive: true });
      copyFileSync(resolve(out, 'index.html'), resolve(out, 'admin/index.html'));
      // /go: the link printed in QR codes. Forwards to the menu, Google Maps or
      // any link chosen in /admin → Business details → QR code.
      mkdirSync(resolve(out, 'go'), { recursive: true });
      const html = readFileSync(resolve(__dirname, 'build-templates/go.html'), 'utf8')
        .replaceAll('__BASE__', base)
        .replaceAll('__API__', apiUrl.replace(/'/g, ''));
      writeFileSync(resolve(out, 'go/index.html'), html);
    },
  };
}

// BASE_PATH is set by the GitHub Actions workflow to "/<repository-name>/".
// For a custom domain or a <user>.github.io repository, set it to "/".
// Locally it defaults to "/".
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const base = process.env.BASE_PATH || '/';
  return {
  plugins: [react(), extraPages(base, process.env.VITE_MENU_API_URL || env.VITE_MENU_API_URL || '')],
  base,
  build: {
    target: 'es2019',
    cssCodeSplit: true,
    sourcemap: false,
  },
};
});
