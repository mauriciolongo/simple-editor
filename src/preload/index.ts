import { contextBridge, ipcRenderer } from 'electron'

export interface ElectronAPI {
  openFile: () => Promise<{ content: string; filePath: string } | null>
  readFile: (filePath: string) => Promise<{ content: string; filePath: string } | null>
  saveFile: (filePath: string, content: string) => Promise<boolean>
  saveFileAs: (content: string) => Promise<string | null>
  newFile: () => void
  showUnsavedDialog: () => Promise<'save' | 'discard' | 'cancel'>
  onMenuAction: (callback: (action: string, data?: string) => void) => void
  setWindowTitle: (title: string) => void
  // Image operations
  selectImage: () => Promise<string | null>
  copyImageToFolder: (imagePath: string, documentPath: string) => Promise<string | null>
  saveImageFromClipboard: (base64Data: string, documentPath: string, mimeType: string) => Promise<string | null>
  getDocumentBasePath: (documentPath: string) => Promise<string>
  promptSaveFirst: () => Promise<'save' | 'cancel'>
  listImagesInFolder: (documentPath: string) => Promise<string[]>
}

const electronAPI: ElectronAPI = {
  openFile: () => ipcRenderer.invoke('file:open'),
  readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
  saveFile: (filePath: string, content: string) =>
    ipcRenderer.invoke('file:save', filePath, content),
  saveFileAs: (content: string) => ipcRenderer.invoke('file:saveAs', content),
  newFile: () => ipcRenderer.send('file:new'),
  showUnsavedDialog: () => ipcRenderer.invoke('dialog:unsaved'),
  onMenuAction: (callback: (action: string, data?: string) => void) => {
    ipcRenderer.on('menu:action', (_event, action: string, data?: string) => callback(action, data))
  },
  setWindowTitle: (title: string) => ipcRenderer.send('window:setTitle', title),
  // Image operations
  selectImage: () => ipcRenderer.invoke('image:select'),
  copyImageToFolder: (imagePath: string, documentPath: string) =>
    ipcRenderer.invoke('image:copyToFolder', imagePath, documentPath),
  saveImageFromClipboard: (base64Data: string, documentPath: string, mimeType: string) =>
    ipcRenderer.invoke('image:saveFromClipboard', base64Data, documentPath, mimeType),
  getDocumentBasePath: (documentPath: string) =>
    ipcRenderer.invoke('image:getBasePath', documentPath),
  promptSaveFirst: () => ipcRenderer.invoke('dialog:promptSave'),
  listImagesInFolder: (documentPath: string) =>
    ipcRenderer.invoke('image:listInFolder', documentPath),
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
