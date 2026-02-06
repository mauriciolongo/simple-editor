import { dialog, BrowserWindow } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

const IMAGE_FILTERS = [
  { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'] }
]

const MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
}

export async function selectImageFile(window: BrowserWindow): Promise<string | null> {
  const result = await dialog.showOpenDialog(window, {
    title: 'Select Image',
    filters: IMAGE_FILTERS,
    properties: ['openFile'],
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  return result.filePaths[0]
}

function generateUniqueFilename(baseDir: string, extension: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return path.join(baseDir, `image-${timestamp}-${random}.${extension}`)
}

function ensureImagesFolder(documentPath: string): string {
  const docDir = path.dirname(documentPath)
  const imagesDir = path.join(docDir, 'images')

  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true })
  }

  return imagesDir
}

export async function copyImageToFolder(
  imagePath: string,
  documentPath: string
): Promise<string | null> {
  try {
    const imagesDir = ensureImagesFolder(documentPath)
    const ext = path.extname(imagePath).slice(1).toLowerCase()
    const destPath = generateUniqueFilename(imagesDir, ext)

    await fs.promises.copyFile(imagePath, destPath)

    // Return relative path from document directory
    const relativePath = path.relative(path.dirname(documentPath), destPath)
    return relativePath
  } catch (error) {
    console.error('Failed to copy image:', error)
    return null
  }
}

export async function saveImageFromBuffer(
  base64Data: string,
  documentPath: string,
  mimeType: string
): Promise<string | null> {
  try {
    const imagesDir = ensureImagesFolder(documentPath)
    const ext = MIME_TO_EXT[mimeType] || 'png'
    const destPath = generateUniqueFilename(imagesDir, ext)

    const buffer = Buffer.from(base64Data, 'base64')
    await fs.promises.writeFile(destPath, buffer)

    // Return relative path from document directory
    const relativePath = path.relative(path.dirname(documentPath), destPath)
    return relativePath
  } catch (error) {
    console.error('Failed to save image from buffer:', error)
    return null
  }
}

export function getDocumentBasePath(documentPath: string): string {
  return path.dirname(documentPath)
}

export async function listImagesInFolder(documentPath: string): Promise<string[]> {
  const docDir = path.dirname(documentPath)
  const imagesDir = path.join(docDir, 'images')

  if (!fs.existsSync(imagesDir)) {
    return []
  }

  try {
    const files = await fs.promises.readdir(imagesDir)
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']

    return files
      .filter(file => imageExtensions.includes(path.extname(file).toLowerCase()))
      .map(file => `images/${file}`)
  } catch (error) {
    console.error('Failed to list images:', error)
    return []
  }
}

export async function promptSaveFirst(window: BrowserWindow): Promise<'save' | 'cancel'> {
  const result = await dialog.showMessageBox(window, {
    type: 'question',
    buttons: ['Save', 'Cancel'],
    defaultId: 0,
    cancelId: 1,
    title: 'Save Document',
    message: 'Save document first to insert images',
    detail: 'The document must be saved before inserting images so the images can be stored in a folder next to it.',
  })

  return result.response === 0 ? 'save' : 'cancel'
}
