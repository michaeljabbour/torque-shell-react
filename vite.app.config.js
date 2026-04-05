import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// App build: produces dist/index.html + JS/CSS for browser serving
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyDirBefore: true,
  },
})
