import { dialog, BrowserWindow } from 'electron'
import * as fs from 'fs/promises'
import * as path from 'path'

const FILE_FILTERS = [
  { name: 'Markdown Files', extensions: ['md', 'markdown'] },
  { name: 'All Files', extensions: ['*'] },
]

export async function openFile(
  window: BrowserWindow
): Promise<{ content: string; filePath: string } | null> {
  const result = await dialog.showOpenDialog(window, {
    properties: ['openFile'],
    filters: FILE_FILTERS,
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  const filePath = result.filePaths[0]
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return { content, filePath }
  } catch (error) {
    dialog.showErrorBox(
      'Error Opening File',
      `Could not open file: ${filePath}\n\n${error}`
    )
    return null
  }
}

export async function saveFile(
  filePath: string,
  content: string
): Promise<boolean> {
  try {
    await fs.writeFile(filePath, content, 'utf-8')
    return true
  } catch (error) {
    dialog.showErrorBox(
      'Error Saving File',
      `Could not save file: ${filePath}\n\n${error}`
    )
    return false
  }
}

export async function saveFileAs(
  window: BrowserWindow,
  content: string
): Promise<string | null> {
  const result = await dialog.showSaveDialog(window, {
    filters: FILE_FILTERS,
    defaultPath: 'untitled.md',
  })

  if (result.canceled || !result.filePath) {
    return null
  }

  let filePath = result.filePath
  // Ensure .md extension
  if (!filePath.endsWith('.md') && !filePath.endsWith('.markdown')) {
    filePath += '.md'
  }

  try {
    await fs.writeFile(filePath, content, 'utf-8')
    return filePath
  } catch (error) {
    dialog.showErrorBox(
      'Error Saving File',
      `Could not save file: ${filePath}\n\n${error}`
    )
    return null
  }
}

export async function readFile(
  filePath: string
): Promise<{ content: string; filePath: string } | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return { content, filePath }
  } catch (error) {
    dialog.showErrorBox(
      'Error Opening File',
      `Could not open file: ${filePath}\n\n${error}`
    )
    return null
  }
}

export async function showUnsavedDialog(
  window: BrowserWindow
): Promise<'save' | 'discard' | 'cancel'> {
  const result = await dialog.showMessageBox(window, {
    type: 'warning',
    buttons: ['Save', "Don't Save", 'Cancel'],
    defaultId: 0,
    cancelId: 2,
    title: 'Unsaved Changes',
    message: 'Do you want to save the changes you made?',
    detail: "Your changes will be lost if you don't save them.",
  })

  switch (result.response) {
    case 0:
      return 'save'
    case 1:
      return 'discard'
    default:
      return 'cancel'
  }
}
