import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// One codebase, two design directions. VITE_DIRECTION=a|b picks the shell at build time.
// base './' keeps every asset path relative, so the same files work at / or under a path prefix.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const site = env.VITE_SITE_URL || 'https://testnet-bridge.gullychain.xyz/';
  return {
    base: './',
    // inline (empty) PostCSS config: stops Vite from picking up the parent template's Tailwind postcss.config.js
    css: { postcss: {} },
    plugins: [
      react(),
      {
        name: 'gully-html-env',
        transformIndexHtml: (html) =>
          html
            .replaceAll('%SITE_URL%', site)
            .replaceAll('%ROBOTS%', env.VITE_ROBOTS || 'index, follow'),
      },
      {
        // sitemap.xml with the build date as lastmod (the bridge is one indexable page; /embed is noindex)
        name: 'gully-sitemap',
        apply: 'build',
        generateBundle() {
          const lastmod = new Date().toISOString().slice(0, 10);
          this.emitFile({
            type: 'asset',
            fileName: 'sitemap.xml',
            source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${site}</loc><lastmod>${lastmod}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>\n</urlset>\n`,
          });
        },
      },
    ],
    build: { outDir: env.VITE_OUT_DIR || 'dist', emptyOutDir: true, chunkSizeWarningLimit: 900 },
    // Local only: the laptop cannot reach *.gullychain.xyz, so dev servers proxy GullyChain RPC to the SSH tunnel.
    server: {
      host: '127.0.0.1',
      proxy: {
        '/rpc/gully': {
          target: env.GULLY_RPC_TUNNEL || 'http://127.0.0.1:18545',
          changeOrigin: true,
          rewrite: () => '/public/evm/485590',
        },
      },
    },
  };
});
