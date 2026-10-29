import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '@fontsource/cinzel/600.css'
import '@fontsource/cinzel/700.css'
import '@fontsource-variable/inter'
import './styles/tokens.css'
import './styles/base.css'
import './styles/controls.css'
import './styles/cards.css'
import './styles/play-sheet.css'
import './styles/play-rolls.css'
import './styles/play-phone.css'
import './styles/builder.css'
import './styles/campaign.css'
import { startCrossTabSync } from './store/crossTab'
import { startCloudSync } from './sync/cloudSync'

startCrossTabSync()
startCloudSync()

// Only the built app registers the service worker, so `npm run dev` never serves stale files.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`/sw.js?v=${__BUILD_ID__}`).catch(() => undefined)
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)