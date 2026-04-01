// client/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // 如果后端路径也是/api开头，不需要rewrite
        // 如果后端路径没有/api前缀，可以这样：
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // 确保资源路径正确
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      }
    }
  },
  // 使用相对路径，这样在生产环境也能正确加载
  base: './',
})