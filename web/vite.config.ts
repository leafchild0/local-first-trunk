import { defineConfig } from 'vite'
import path from "path"
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  server: {
    port: 8000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, "./src"),
    },
  },
})
