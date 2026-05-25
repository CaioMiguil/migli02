import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AppErrorBoundary from '@components/AppErrorBoundary'
import './styles/globals.css'

// Fade out o pre-paint splash assim que o React monta (~< 100ms na maioria
// dos dispositivos). O SplashScreen interno toma o lugar com a animação
// cinematográfica completa.
function dropPreSplash() {
  const el = document.getElementById('pre-splash')
  if (!el) return
  el.classList.add('fade-out')
  setTimeout(() => el.remove(), 600)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>,
)

requestAnimationFrame(dropPreSplash)
