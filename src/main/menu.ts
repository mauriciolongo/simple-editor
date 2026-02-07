import { Menu, BrowserWindow, app } from 'electron'
import { getRecentFiles, clearRecentFiles } from './recent-files'

function sendMenuAction(window: BrowserWindow, action: string, data?: string): void {
  window.webContents.send('menu:action', action, data)
}

function buildRecentFilesSubmenu(window: BrowserWindow): Electron.MenuItemConstructorOptions[] {
  const recentFiles = getRecentFiles()

  if (recentFiles.length === 0) {
    return [{ label: 'No Recent Files', enabled: false }]
  }

  const fileItems: Electron.MenuItemConstructorOptions[] = recentFiles.map((filePath) => ({
    label: filePath.split('/').pop() || filePath,
    click: () => sendMenuAction(window, 'openRecent', filePath),
  }))

  return [
    ...fileItems,
    { type: 'separator' },
    {
      label: 'Clear Recent Files',
      click: () => {
        clearRecentFiles()
        createMenu(window) // Rebuild menu
      },
    },
  ]
}

export function createMenu(window: BrowserWindow): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New',
          accelerator: 'CmdOrCtrl+N',
          click: () => sendMenuAction(window, 'new'),
        },
        {
          label: 'Open',
          accelerator: 'CmdOrCtrl+O',
          click: () => sendMenuAction(window, 'open'),
        },
        {
          label: 'Open Recent',
          submenu: buildRecentFilesSubmenu(window),
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => sendMenuAction(window, 'save'),
        },
        {
          label: 'Save As',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => sendMenuAction(window, 'saveAs'),
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          click: () => sendMenuAction(window, 'undo'),
        },
        {
          label: 'Redo',
          accelerator: 'CmdOrCtrl+Y',
          click: () => sendMenuAction(window, 'redo'),
        },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { type: 'separator' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectAll' },
      ],
    },
    {
      label: 'Format',
      submenu: [
        {
          label: 'Bold',
          accelerator: 'CmdOrCtrl+B',
          click: () => sendMenuAction(window, 'bold'),
        },
        {
          label: 'Italic',
          accelerator: 'CmdOrCtrl+I',
          click: () => sendMenuAction(window, 'italic'),
        },
        {
          label: 'Strikethrough',
          accelerator: 'CmdOrCtrl+Shift+X',
          click: () => sendMenuAction(window, 'strikethrough'),
        },
        {
          label: 'Inline Code',
          accelerator: 'CmdOrCtrl+`',
          click: () => sendMenuAction(window, 'inlineCode'),
        },
        { type: 'separator' },
        {
          label: 'Heading 1',
          accelerator: 'CmdOrCtrl+1',
          click: () => sendMenuAction(window, 'h1'),
        },
        {
          label: 'Heading 2',
          accelerator: 'CmdOrCtrl+2',
          click: () => sendMenuAction(window, 'h2'),
        },
        {
          label: 'Heading 3',
          accelerator: 'CmdOrCtrl+3',
          click: () => sendMenuAction(window, 'h3'),
        },
        { type: 'separator' },
        {
          label: 'Bullet List',
          accelerator: 'CmdOrCtrl+Shift+8',
          click: () => sendMenuAction(window, 'bulletList'),
        },
        {
          label: 'Numbered List',
          accelerator: 'CmdOrCtrl+Shift+9',
          click: () => sendMenuAction(window, 'orderedList'),
        },
        {
          label: 'Task List',
          click: () => sendMenuAction(window, 'taskList'),
        },
        { type: 'separator' },
        {
          label: 'Blockquote',
          accelerator: 'CmdOrCtrl+Shift+.',
          click: () => sendMenuAction(window, 'blockquote'),
        },
        {
          label: 'Code Block',
          accelerator: 'CmdOrCtrl+Shift+`',
          click: () => sendMenuAction(window, 'codeBlock'),
        },
        {
          label: 'Horizontal Rule',
          click: () => sendMenuAction(window, 'horizontalRule'),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Source View',
          accelerator: 'CmdOrCtrl+E',
          click: () => sendMenuAction(window, 'togglePreview'),
        },
        { type: 'separator' },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'F12',
          click: () => window.webContents.toggleDevTools(),
        },
      ],
    },
    {
      label: 'Insert',
      submenu: [
        {
          label: 'Image...',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => sendMenuAction(window, 'insertImage'),
        },
        {
          label: 'Link',
          accelerator: 'CmdOrCtrl+K',
          click: () => sendMenuAction(window, 'insertLink'),
        },
      ],
    },
  ]

  // Add macOS-specific app menu
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    })
  }

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
