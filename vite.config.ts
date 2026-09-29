import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
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
