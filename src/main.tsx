import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'
import './play.css'
import { startCrossTabSync } from './store/crossTab'
import { startCloudSync } from './sync/cloudSync'

startCrossTabSync()
startCloudSync()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)