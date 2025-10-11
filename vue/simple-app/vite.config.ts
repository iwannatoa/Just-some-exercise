/*
 * Copyright © 2016-2025 Patrick Zhang.
 * All Rights Reserved.
 */
import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import vueDevTools from 'vite-plugin-vue-devtools';
import tailwindcss from '@tailwindcss/vite';
import ui from '@nuxt/ui/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    tailwindcss(),
    ui({
      ui: {
        colors: { primary: 'indigo', secondary: 'sky' },
        select: {
          slots: {
            content: 'z-1002',
          },
        },
        selectMenu: {
          slots: {
            content: 'z-1002',
          },
        },
      },
    }),
  ],
  css: {
    postcss: './postcss.config.cjs',
    preprocessorOptions: {
      sass: { additionalData: `@import "@/styles/style.scss";` },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api/user': {
        target: 'http://192.168.71.3:8760/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/user/, '/user'),
      },
    },
  },
});
