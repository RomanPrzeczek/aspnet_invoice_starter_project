import express from 'express'
import helmet from 'helmet'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import http from 'node:http'
import https from 'node:https'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// --- ENV / defaulty ---
const FE_ORIGIN  = process.env.FE_ORIGIN  || 'https://fe.local.test:4173'
const API_ORIGIN = process.env.API_ORIGIN || 'https://api.local.test:5001'
const HOST = new URL(FE_ORIGIN).hostname
const PORT = Number(new URL(FE_ORIGIN).port || 4173)

// --- Express app ---
const app = express()

// Security headers (CSP + HSTS + others)
// comment: 'style-src' has 'unsafe-inline' due to eventuall inline styles (common in UI).
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      'default-src': ["'self'"],
      'base-uri': ["'self'"],
      'object-src': ["'none'"],
      'frame-ancestors': ["'none'"],
      'img-src': ["'self'", 'data:'],
      'font-src': ["'self'", 'data:'],
      'style-src': ["'self'", "'unsafe-inline'"],
      // no HMR here – only prod build; allowed scripts just from self
      'script-src': ["'self'"],
      // fetch/XHR – FE communicates with its origin and API_ORIGIN
      'connect-src': ["'self'", API_ORIGIN],
      // external frame insertion  restricted
      'frame-src': ["'none'"],
      'form-action': ["'self'"],
      'manifest-src': ["'self'"],
      'worker-src': ["'self'"],
      // optional: forcing https for every link loaded
      'upgrade-insecure-requests': []
    }
  },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  referrerPolicy: { policy: 'no-referrer' },
  // HSTS: only if runs on HTTPS
  hsts: false
}))

//  If runs on HTTPS, enable HSTS (except dev, but in prodsim we want test)
app.use((req, res, next) => {
  if (req.secure) {
    // 6 months; can increase
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains; preload')
  }
  next()
})

// Static SPA
const dist = path.join(__dirname, 'dist')
app.use(express.static(dist, { index: false }))

// SPA fallback (react-router)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(dist, 'index.html'))
})

// --- HTTPS preferred (fe.local.test certs). Fallback on HTTP with warning ---
let server
try {
  const key  = fs.readFileSync('./certs/fe.local.test-key.pem')
  const cert = fs.readFileSync('./certs/fe.local.test.pem')
  server = https.createServer({ key, cert }, app)
  server.listen(PORT, HOST, () => {
    console.log(`✅ PRODSIM running at ${FE_ORIGIN}`)
    console.log(`↔️  API allowed in CSP connect-src: ${API_ORIGIN}`)
  })
} catch (e) {
  console.warn('⚠️  HTTPS certs not found. Falling back to HTTP (no HSTS).', e.message)
  server = http.createServer(app)
  server.listen(PORT, HOST, () => {
    const url = `http://${HOST}:${PORT}`
    console.log(`✅ PRODSIM running at ${url}`)
    console.log(`↔️  API allowed in CSP connect-src: ${API_ORIGIN}`)
  })
}
