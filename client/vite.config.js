import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const API_TARGET = process.env.API_TARGET || 'http://localhost:3001';
const strip = (p) => p.replace(/^\/blog/, '');

export default defineConfig({
  // Served from the portfolio under /blog (keep in sync with BASE in server/index.js)
  base: '/blog/',
  plugins: [
    react(),
    // Only the admin is an installable app (record voice notes from a phone); readers get no service worker
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icons/*.svg'],
      manifest: {
        name: 'Brain Dump Admin',
        short_name: 'Brain Dump',
        description: 'Write and manage posts',
        theme_color: '#050505',
        background_color: '#050505',
        display: 'standalone',
        start_url: '/blog/admin',
        scope: '/blog/admin',
        icons: [
          { src: '/blog/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/blog/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
          { src: '/blog/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallback: '/blog/index.html',
        navigateFallbackDenylist: [/^\/blog\/api\//, /^\/blog\/uploads\//, /^\/blog\/rss\.xml/, /^\/blog\/sitemap\.xml/],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // React rarely changes, so keep it in its own long-cached file apart from app code
        manualChunks: { react: ['react', 'react-dom', 'react-router-dom'] },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/blog/api': { target: API_TARGET, rewrite: strip },
      '/blog/uploads': { target: API_TARGET, rewrite: strip },
      '/blog/rss.xml': { target: API_TARGET, rewrite: strip },
      '/blog/sitemap.xml': { target: API_TARGET, rewrite: strip },
    },
  },
});
