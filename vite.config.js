import { defineConfig } from 'vite';

export default defineConfig({
  // Public base path - set to './' for relative paths in production
  base: './',
  
  // Configure the build output
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 0, // Don't inline assets as base64
    rollupOptions: {
      input: {
        main: 'index.html'
      },
      output: {
        manualChunks: {
          three: ['three']
        }
      }
    }
  },
  
  // Serve options
  server: {
    port: 3000,
    open: true
  }
}); 