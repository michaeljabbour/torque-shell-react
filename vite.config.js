import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/main.jsx',
      formats: ['es'],
      fileName: 'index',
    },
    outDir: 'dist',
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react-router-dom',
        /^@mui\/.*/,
        /^@emotion\/.*/,
      ],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: 'test/setup.js',
    include: ['test/**/*.test.{js,jsx}'],
  },
})
