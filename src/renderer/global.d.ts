/// <reference types="vite/client" />

import type { ElectronAPI } from '../preload/index'

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

declare module '*.svg?raw' {
  const content: string
  export default content
}

export {}
