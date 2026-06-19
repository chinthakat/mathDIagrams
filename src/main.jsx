import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import MapEditor from './components/MapEditor.jsx'

const urlParams = new URLSearchParams(window.location.search);
const isMapEditor = urlParams.get('editor') === 'map';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isMapEditor ? <MapEditor /> : <App />}
  </StrictMode>,
)
