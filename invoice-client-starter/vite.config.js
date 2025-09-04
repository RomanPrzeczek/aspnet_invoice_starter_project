import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

export default defineConfig({
  server: {
    https: {
      key:  fs.readFileSync('./certs/localhost-key.pem'),
      cert: fs.readFileSync('./certs/localhost.pem'),
    },
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://localhost:7071', // BE https
        changeOrigin: true,
        secure: false,                    // povol self-signed BE cert
      }
    }
  },
  plugins: [react()]
})
