import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // basicSsl()
  ],
  server: {
    host: true, // Expose to network
    // Proxy API requests to avoid CORS/mixed-content issues
    // When frontend is HTTPS and backend is HTTP
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
