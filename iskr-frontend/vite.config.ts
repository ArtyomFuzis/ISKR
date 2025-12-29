import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: "/",
  plugins: [react()],
  server: {
    port: 5000,
    proxy: {
      // Прокси для OAPI (порт 80)
      '/oapi': {
        target: 'http://155.212.168.176:80',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})