import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Plugin to inline CSS into the JS bundle
function inlineCss(): Plugin {
  return {
    name: 'inline-css',
    enforce: 'post',
    generateBundle(_, bundle) {
      let cssContent = '';
      const cssFiles: string[] = [];

      // Collect CSS content
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (fileName.endsWith('.css') && chunk.type === 'asset') {
          cssContent += chunk.source;
          cssFiles.push(fileName);
        }
      }

      // Remove CSS files from bundle
      for (const fileName of cssFiles) {
        delete bundle[fileName];
      }

      // Export CSS as variable for shadow DOM injection
      if (cssContent) {
        for (const chunk of Object.values(bundle)) {
          if (chunk.type === 'chunk' && chunk.isEntry) {
            // Define CSS as a variable at the top of the bundle
            const cssCode = `var __DESIGN_COMMENTS_CSS__=${JSON.stringify(cssContent)};`;
            chunk.code = cssCode + chunk.code;
          }
        }
      }
    }
  };
}

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react(), ...(command === 'build' ? [inlineCss()] : [])],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env': {},
  },
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
