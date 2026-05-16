import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/themes/digital/tokens.css'
import '@/themes/digital/fonts.css'
import '@/themes/standard/tokens.css'
import '@/themes/standard/fonts.css'
import '@/themes/retro/tokens.css'
import '@/themes/retro/fonts.css'
import '@/themes/pantheon/tokens.css'
import '@/themes/pantheon/fonts.css'
import './styles/global.css'
import './sound/packs/digital'
import './sound/packs/retro'
import './sound/packs/pantheon'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
