import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './App.css'; // Importa los estilos de la aplicación
import App from './App.tsx'
import 'antd/dist/reset.css'; // Cambiado de antd/dist/antd.css a antd/dist/reset.css


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)


