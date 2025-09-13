
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs' 

export default defineConfig(({ command, mode }) => {
  const cfg = { plugins: [react()] }

  if (command === 'serve') {
    const isProdSim = mode === 'prodsim'

    if (isProdSim) {
      cfg.server = {
        host: 'fe.local.test',
        port: 5173,
        https: {
          cert: fs.readFileSync('./certs/fe.local.test.pem'),
          key:  fs.readFileSync('./certs/fe.local.test-key.pem'),
        },
      }
    } else {
      cfg.server = {
        host: 'fe.local.test',
        port: 5173,
        https: true,
        proxy: {
          '/api': {
            target: 'https://api.local.test:5001',
            changeOrigin: true,
            secure: false,
          }
        }
      }
    }
  } else if (command === 'preview') {
    cfg.preview = {
      host: 'fe.local.test',
      port: 4173,
      https: {
        cert: fs.readFileSync('./certs/fe.local.test.pem'),
        key:  fs.readFileSync('./certs/fe.local.test-key.pem'),
      },
    }
  }
  return cfg
})
