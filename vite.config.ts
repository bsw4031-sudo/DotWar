/**
 * @file vite.config.ts
 * @title Vite 설정
 * @description React 플러그인을 포함한 프런트엔드 빌드 설정을 정의합니다.
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
