import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { readFileSync } from 'fs'

export default defineConfig(({ mode }) => {
  const plugins = [
    react(),
    tailwindcss(),
  ]

  if (mode === 'analyze') {
    plugins.push(
      visualizer({
        filename: 'dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
      }) as any
    )
  }

  return {
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            radix: Object.keys(JSON.parse(readFileSync('./package.json', 'utf-8')).dependencies).filter(key => key.startsWith('@radix-ui')),
            utils: ['clsx', 'tailwind-merge', 'class-variance-authority'],
          },
        },
      },
    },
  }
})
