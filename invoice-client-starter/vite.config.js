import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
// volitelně je odolnější používat path.resolve
// import path from 'path'

export default defineConfig(({ mode }) => {
  const common = {
    plugins: [react()],
    server: {
      host: 'fe.local.test',
      port: 5173,
      https: {
        cert: fs.readFileSync('./certs/fe.local.test.pem'),
        key:  fs.readFileSync('./certs/fe.local.test-key.pem'),
        // cert: fs.readFileSync(path.resolve(__dirname, 'certs/fe.local.test.pem')),
        // key:  fs.readFileSync(path.resolve(__dirname, 'certs/fe.local.test-key.pem')),
      },
    },
    preview: {
      host: 'fe.local.test',
      port: 4173, // můžeš změnit
      https: {
        cert: fs.readFileSync('./certs/fe.local.test.pem'),
        key:  fs.readFileSync('./certs/fe.local.test-key.pem'),
      },
    },
  }

  // Proxy jen v DEV (rychlé ladění); v prodsim bez proxy (1:1).
  if (mode === 'development') {
    common.server.proxy = {
      '/api': {
        target: 'https://api.local.test:5001',
        changeOrigin: true,
        secure: false, // pokud nastavíš NODE_EXTRA_CA_CERTS na mkcert CA, může být true
      }
    }
  }

  return common
})