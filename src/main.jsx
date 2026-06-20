import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import MainShell from './components/MainShell.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MainShell />
  </StrictMode>,
)
