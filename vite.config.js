import { defineConfig } from 'vite';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { readFileSync } from 'fs';
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var plugins = [
        react(),
        tailwindcss(),
    ];
    if (mode === 'analyze') {
        plugins.push(visualizer({
            filename: 'dist/stats.html',
            open: true,
            gzipSize: true,
            brotliSize: true,
        }));
    }
    return {
        plugins: plugins,
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
                        radix: Object.keys(JSON.parse(readFileSync('./package.json', 'utf-8')).dependencies).filter(function (key) { return key.startsWith('@radix-ui'); }),
                        utils: ['clsx', 'tailwind-merge', 'class-variance-authority'],
                    },
                },
            },
        },
    };
});
