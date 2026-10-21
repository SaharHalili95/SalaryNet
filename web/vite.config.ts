import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ mode }) => ({
  // GitHub Pages serves the demo from /<repo>/; everything else is served from the root.
  base: mode === 'demo' ? (process.env.VITE_BASE ?? '/SalaryNet/') : '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(new URL('../shared', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // Code shared with the Angular app lives one level up.
    fs: { allow: ['..'] },
    proxy: { '/api': 'http://localhost:5080' },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.ts', '../shared/**/*.spec.ts'],
  },
}))
