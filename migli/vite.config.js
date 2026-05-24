import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// MIGLI · Vite + PWA
// O Service Worker faz cache shell-first (HTML/JS/CSS/fonts) e usa
// runtime caching para splats da R2/CDN — primeiro paint em ms,
// cobre navegação offline.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'brand/migli-mark.svg', 'brand/migli-wordmark.png'],
      manifest: {
        name: 'MIGLI — Experiências 3D para imóveis',
        short_name: 'MIGLI',
        description:
          'Transforme imóveis em experiências cinematográficas e navegáveis.',
        lang: 'pt-BR',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#060D1A',
        background_color: '#060D1A',
        categories: ['business', 'productivity', 'lifestyle'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        screenshots: [
          {
            src: '/screenshots/home.png',
            sizes: '1080x1920',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Home — MIGLI',
          },
        ],
      },
      workbox: {
        // Cache shell + JS + CSS + fonts at install
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // Splats são grandes — não cachear no install, só runtime
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            // Splats: cache-first, mas com expiration generosa
            urlPattern: /\.(?:ply|sog|splat|meta\.json|lod-meta\.json)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'migli-splats-v1',
              expiration: { maxEntries: 20, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Google Fonts — runtime cache permanente
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-v1',
              expiration: { maxEntries: 16, maxAgeSeconds: 365 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // API Supabase: network-first, fallback rápido pro cache
            urlPattern: /^https:\/\/[a-z0-9-]+\.supabase\.co\/rest\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'migli-api-v1',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'),
      '@components': path.resolve(process.cwd(), './src/components'),
      '@hooks': path.resolve(process.cwd(), './src/hooks'),
      '@lib': path.resolve(process.cwd(), './src/lib'),
      '@styles': path.resolve(process.cwd(), './src/styles'),
    },
  },
  server: { port: 5173, open: true },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          playcanvas: ['playcanvas'],
          motion: ['framer-motion'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
})
