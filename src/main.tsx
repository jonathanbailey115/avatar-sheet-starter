import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'
import './play.css'
import { startCrossTabSync } from './store/crossTab'
import { startCloudSync } from './sync/cloudSync'

startCrossTabSync()
startCloudSync()

// Only the built app registers the service worker, so `npm run dev` never serves stale files.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)