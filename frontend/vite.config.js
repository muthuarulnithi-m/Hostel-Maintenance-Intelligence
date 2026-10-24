import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const { VITE_API_URL } = loadEnv(mode, process.cwd(), 'VITE_')

  if (mode === 'production') {
    if (!VITE_API_URL?.trim()) {
      throw new Error('Set VITE_API_URL to the deployed HTTPS API URL before building for production.')
    }

    let apiUrl
    try {
      apiUrl = new URL(VITE_API_URL.trim())
    } catch {
      throw new Error('VITE_API_URL must be a valid HTTPS URL for production builds.')
    }

    if (apiUrl.protocol !== 'https:' || ['localhost', '127.0.0.1', '::1'].includes(apiUrl.hostname)) {
      throw new Error('Production VITE_API_URL must use HTTPS and cannot point to localhost.')
    }
  }

  return {
    plugins: [react()],
  }
})
