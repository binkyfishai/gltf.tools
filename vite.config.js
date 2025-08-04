import { defineConfig } from 'vite';

export default defineConfig({
  // Public base path - ensure consistent relative paths
  base: './',
  
  // Configure the build output
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 0, // Don't inline assets as base64
    sourcemap: false, // Disable sourcemaps for production
    rollupOptions: {
      input: {
        main: 'index.html'
      },
      output: {
        manualChunks: {
          three: ['three']
        },
        // Ensure consistent file naming
        entryFileNames: '[name]-[hash].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash].[ext]'
      }
    }
  },
  
  // Serve options
  server: {
    port: 3000,
    open: true
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['three']
  }
}); 