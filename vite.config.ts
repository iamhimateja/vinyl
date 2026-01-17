import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// Check if we're building for a desktop environment (Tauri or Electron)
const isTauri = process.env.TAURI_ENV_PLATFORM !== undefined;
const isElectron = process.env.ELECTRON === "true";
const isDesktopBuild = isTauri || isElectron;

export default defineConfig({
  // Use relative paths for Electron builds
  base: isElectron ? "./" : "/",
  // Prevent vite from obscuring rust errors
  clearScreen: false,
  // Tauri/Electron expects a fixed port, fail if that port is not available
  server: {
    port: 5173,
    strictPort: true,
    host: true, // Listen on all addresses for Tauri
    watch: {
      // Tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  // Env variables starting with TAURI_ are exposed to the client
  envPrefix: ["VITE_", "TAURI_"],
  // Path aliases
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Disable PWA in desktop builds (Tauri/Electron)
      disable: isDesktopBuild,
      registerType: "autoUpdate",
      injectRegister: "auto",
      strategies: "generateSW",
      workbox: {
        // Cache all static assets including dynamically loaded chunks
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2,webmanifest}"],
        // Cache the index.html for offline access (SPA fallback)
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api/],
        // Runtime caching rules
        runtimeCaching: [
          {
            // Cache Google Fonts stylesheets
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "google-fonts-stylesheets",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            // Cache Google Fonts webfonts
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache images
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            // Cache JS/CSS chunks for offline
            urlPattern: /\.(?:js|css)$/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "static-resources",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
        // Clean up old caches
        cleanupOutdatedCaches: true,
        // Skip waiting to activate new service worker immediately
        skipWaiting: true,
        clientsClaim: true,
        // Ensure all assets are precached for offline use
        sourcemap: false,
      },
      includeAssets: ["icons/*.svg", "icons/*.png"],
      manifest: {
        name: "Vinyl Music Player",
        short_name: "Vinyl",
        description:
          "A minimal, offline-first music player that feels like a personal vinyl player",
        theme_color: "#d4a574",
        background_color: "#1a1a1a",
        display: "standalone",
        scope: "/",
        start_url: "/",
        orientation: "any",
        id: "vinyl-music-player",
        icons: [
          {
            src: "icons/icon.svg",
            sizes: "48x48 72x72 96x96 128x128 192x192 256x256 512x512",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "icons/icon-maskable.svg",
            sizes: "48x48 72x72 96x96 128x128 192x192 256x256 512x512",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
        categories: ["music", "entertainment"],
        shortcuts: [
          {
            name: "Library",
            short_name: "Library",
            description: "View your music library",
            url: "/library",
            icons: [{ src: "icons/icon.svg", sizes: "96x96" }],
          },
        ],
        launch_handler: {
          client_mode: "navigate-existing",
        },
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          "react-vendor": ["react", "react-dom"],
          // Router
          router: ["react-router-dom"],
          // UI libraries (legacy)
          "ui-vendor": [
            "lucide-react",
            "react-tooltip",
            "@tanstack/react-virtual",
          ],
          // Radix UI primitives (shadcn)
          "radix-ui": [
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-dialog",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-slot",
            "@radix-ui/react-popover",
          ],
          // Command menu
          cmdk: ["cmdk"],
          // Toast notifications
          sonner: ["sonner"],
          // Drag and drop
          "dnd-kit": [
            "@dnd-kit/core",
            "@dnd-kit/sortable",
            "@dnd-kit/utilities",
          ],
          // Music metadata parser (large library)
          "music-metadata": ["music-metadata"],
          // IndexedDB
          idb: ["idb"],
          // Class utilities
          "class-utils": [
            "clsx",
            "tailwind-merge",
            "class-variance-authority",
          ],
        },
      },
    },
  },
  publicDir: "public",
});
