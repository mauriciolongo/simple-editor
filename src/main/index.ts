import { app, BrowserWindow, ipcMain, protocol, net } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import { openFile, readFile, saveFile, saveFileAs, showUnsavedDialog } from './file-ops'
import { createMenu } from './menu'
import { addRecentFile } from './recent-files'
import {
  selectImageFile,
  copyImageToFolder,
  saveImageFromBuffer,
  getDocumentBasePath,
  promptSaveFirst,
  listImagesInFolder,
} from './image-ops'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    title: 'Untitled - Markdown Editor',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, '../preload/index.js'),
    },
  })

  // In development, load from Vite dev server
  // In production, load the built file
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Set up menu
  createMenu(mainWindow)
}

function rebuildMenu(): void {
  if (mainWindow) {
    createMenu(mainWindow)
  }
}

function setupIpcHandlers(): void {
  ipcMain.handle('file:open', async () => {
    if (!mainWindow) return null
    const result = await openFile(mainWindow)
    if (result) {
      addRecentFile(result.filePath)
      rebuildMenu()
    }
    return result
  })

  ipcMain.handle('file:read', async (_event, filePath: string) => {
    const result = await readFile(filePath)
    if (result) {
      addRecentFile(result.filePath)
      rebuildMenu()
    }
    return result
  })

  ipcMain.handle('file:save', async (_event, filePath: string, content: string) => {
    const success = await saveFile(filePath, content)
    if (success) {
      addRecentFile(filePath)
      rebuildMenu()
    }
    return success
  })

  ipcMain.handle('file:saveAs', async (_event, content: string) => {
    if (!mainWindow) return null
    const filePath = await saveFileAs(mainWindow, content)
    if (filePath) {
      addRecentFile(filePath)
      rebuildMenu()
    }
    return filePath
  })

  ipcMain.handle('dialog:unsaved', async () => {
    if (!mainWindow) return 'cancel'
    return showUnsavedDialog(mainWindow)
  })

  ipcMain.on('window:setTitle', (_event, title: string) => {
    if (mainWindow) {
      mainWindow.setTitle(title)
    }
  })

  // Image operations
  ipcMain.handle('image:select', async () => {
    if (!mainWindow) return null
    return selectImageFile(mainWindow)
  })

  ipcMain.handle('image:copyToFolder', async (_event, imagePath: string, documentPath: string) => {
    return copyImageToFolder(imagePath, documentPath)
  })

  ipcMain.handle('image:saveFromClipboard', async (_event, base64Data: string, documentPath: string, mimeType: string) => {
    return saveImageFromBuffer(base64Data, documentPath, mimeType)
  })

  ipcMain.handle('image:getBasePath', async (_event, documentPath: string) => {
    return getDocumentBasePath(documentPath)
  })

  ipcMain.handle('dialog:promptSave', async () => {
    if (!mainWindow) return 'cancel'
    return promptSaveFirst(mainWindow)
  })

  ipcMain.handle('image:listInFolder', async (_event, documentPath: string) => {
    return listImagesInFolder(documentPath)
  })
}

// Register custom protocol for serving local images
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'local-file',
    privileges: {
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
    },
  },
])

function setupProtocolHandlers(): void {
  protocol.handle('local-file', (request) => {
    const filePath = decodeURIComponent(request.url.replace('local-file://', ''))
    return net.fetch(`file://${filePath}`)
  })
}

// Enforce single instance
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    setupProtocolHandlers()
    setupIpcHandlers()
    createWindow()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow()
    }
  })
}
