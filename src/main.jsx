import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/themes/digital/tokens.css'
import '@/themes/digital/fonts.css'
import './styles/global.css'
import './sound/packs/digital'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
