import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Tự động dùng fallback port 5173 nếu không khai báo VITE_PORT hay FRONTEND_PORT
  const frontendPort = Number(env.VITE_PORT || env.FRONTEND_PORT || 5173)

  return {
    plugins: [
      react({
        babel: {
          plugins: [['babel-plugin-react-compiler']],
        },
      }),
    ],
    server: {
      port: frontendPort,
      strictPort: true,
      open: true,
    },
  }
})