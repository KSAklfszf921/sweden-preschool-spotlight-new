import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/sweden-preschool-spotlight-new/' : '/',
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize build for production deployment - use modern target for Mapbox compatibility
    target: 'es2020', // Changed from es2015 to support BigInt literals used by Mapbox
    minify: 'esbuild', // Use esbuild instead of terser for compatibility
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mapbox: ['mapbox-gl'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
    // Increase chunk size warning limit for map components
    chunkSizeWarningLimit: 1000,
  },
  // Optimize dependencies for faster loading
  optimizeDeps: {
    include: ['mapbox-gl', '@supabase/supabase-js', 'react', 'react-dom'],
  },
}));