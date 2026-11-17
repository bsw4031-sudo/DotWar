/**
 * @file main.tsx
 * @title 앱 시작점
 * @description React 앱을 페이지 루트에 연결하고 전역 스타일을 불러옵니다.
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './style.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
