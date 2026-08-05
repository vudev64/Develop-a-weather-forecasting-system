import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const rawPort = env.VITE_PORT || env.FRONTEND_PORT

  if (!rawPort) {
    throw new Error('Missing VITE_PORT or FRONTEND_PORT in frontend/.env')
  }

  const frontendPort = Number(rawPort)

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
    }
  }
})
