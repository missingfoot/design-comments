import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Only use library mode for build, not dev
  ...(command === 'build' ? {
    build: {
      lib: {
        entry: 'src/embed.tsx',
        name: 'DesignComments',
        fileName: 'embed',
        formats: ['iife']
      },
      rollupOptions: {
        external: [],
        output: {
          inlineDynamicImports: true,
        }
      },
      cssCodeSplit: false,
    }
  } : {}),
}))
