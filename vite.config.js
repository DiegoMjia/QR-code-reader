import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl()
  ],
  server: {
    host: '0.0.0.0', // Permite conexiones desde dispositivos en la misma red local
    port: 5173,
    https: true, // Habilita HTTPS local para que el navegador móvil permita usar la cámara
  }
})
