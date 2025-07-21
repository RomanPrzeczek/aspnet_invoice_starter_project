import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        'target' : 'https://localhost:7071', 
        //'target' : 'https://invoice-api-romi-dfftdqhaacbab2h0.westeurope-01.azurewebsites.net',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
