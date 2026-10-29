import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
    // A new value on every build. The app registers its service worker as /sw.js?v=<this>, so each deploy gets a
    // new worker with its own cache, and the old cache is deleted (see public/sw.js).
    define: { __BUILD_ID__: JSON.stringify(Date.now().toString(36)) },
    plugins: [react()],
    build: {
        // The rules text (techniques, classes, feats) is most of the main file and is needed at start.
        chunkSizeWarningLimit: 700,
        rollupOptions: {
            output: {
                // Libraries change rarely, so they get their own file that returning visitors keep cached.
                manualChunks: {
                    react: ['react', 'react-dom'],
                    vendor: ['zustand', 'zod'],
                },
            },
        },
    },
    test: {
        environment: 'node',
        include: ['src/**/*.test.ts'],
    },
})
