import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'

export default defineConfig(({ command, mode }) => {
  const cfg = { plugins: [react()] }

  if (command === 'serve') {
    // DEV (HMR, softer CSP only for BE prodsim)
    let https
    try {
      https = {
        cert: fs.readFileSync('./certs/fe.local.test.pem'),
        key:  fs.readFileSync('./certs/fe.local.test-key.pem'),
      }
    } catch {
      https = true // fallback – Vite generates self-signed
    }

    cfg.server = {
      host: 'fe.local.test',
      port: 5173,
      https,
      proxy: {
        '/api': {
          target: 'https://api.local.test:5001',
          changeOrigin: true,
          secure: false
        }
      }
    }
  }
  return cfg
})