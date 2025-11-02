import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'build', // 保持与 CRA 相同的输出目录
    sourcemap: true,
  },
  resolve: {
    alias: {
      // 如果项目中有路径别名，在这里配置
      '@': path.resolve(__dirname, './src'),
    },
  },
});
