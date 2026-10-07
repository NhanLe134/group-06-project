import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Serve fe_ofc/ làm thư mục gốc — mở localhost:5173 ra index.html của fe_ofc
  root: resolve(__dirname, 'fe_ofc'),
  // Build output ra ngoài fe_ofc để không lẫn với source
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: resolve(__dirname, 'src/setupTests.ts'),
    passWithNoTests: true,
  },
})
