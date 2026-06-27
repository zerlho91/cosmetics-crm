import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 개발 시: `npm run server`(로컬 Express, 3001포트)와 `npm run dev`를 함께 실행하면
// /api 요청이 로컬 백엔드로 프록시됩니다.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
