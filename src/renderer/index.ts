import './styles.css'
import { createMilkdownEditor, MilkdownEditorInstance } from './milkdown-editor'
import { setImageBasePath, setupImageRewriting } from './milkdown-image-plugin'
import { createSourceEditor, SourceEditorInstance } from './source-editor'
import { countWords, formatWordCount } from './word-count'
import {
  getState,
  getEditorMode,
  toggleEditorMode,
  setModified,
  setFilePath,
  setOriginalContent,
  resetState,
  onStateChange,
} from './state'
import { showImageInsertModal } from './image-modal'
import { createToolbar, ToolbarAction } from './toolbar'

let milkdownEditor: MilkdownEditorInstance | null = null
let sourceEditor: SourceEditorInstance | null = null
let milkdownContainer: HTMLElement | null = null
let sourceContainer: HTMLElement | null = null
let wordCountElement: HTMLElement | null = null
let toolbarContainer: HTMLElement | null = null

function updateWindowTitle(): void {
  const state = getState()
  const filename = state.filePath
    ? state.filePath.split('/').pop() || 'Untitled'
    : 'Untitled'
  const modified = state.isModified ? '*' : ''
  const title = `${modified}${filename} - Markdown Editor`
  window.electronAPI.setWindowTitle(title)
}

function handleContentChange(content: string): void {
  const state = getState()
  const isModified = content !== state.originalContent
  if (isModified !== state.isModified) {
    setModified(isModified)
  }

  // Update word count
  updateWordCount(content)
}

function updateWordCount(content: string): void {
  if (wordCountElement) {
    const count = countWords(content)
    wordCountElement.textContent = formatWordCount(count)
  }
}

function getCurrentContent(): string {
  const mode = getEditorMode()
  if (mode === 'wysiwyg' && milkdownEditor) {
    return milkdownEditor.getContent()
  } else if (mode === 'source' && sourceEditor) {
    return sourceEditor.getContent()
  }
  return ''
}

function handleToggleEditorMode(): void {
  const content = getCurrentContent()

  // Get approximate cursor position from current editor
  let cursorFraction = 0
  const currentMode = getEditorMode()
  if (currentMode === 'wysiwyg' && milkdownEditor) {
    cursorFraction = milkdownEditor.getCursorFraction()
  } else if (currentMode === 'source' && sourceEditor) {
    cursorFraction = sourceEditor.getCursorFraction()
  }

  const newMode = toggleEditorMode()

  if (newMode === 'source') {
    // Switching to source: transfer content from Milkdown to CodeMirror
    if (sourceEditor) {
      sourceEditor.setContent(content)
      sourceEditor.setCursorFraction(cursorFraction)
    }
    if (milkdownContainer) milkdownContainer.style.display = 'none'
    if (sourceContainer) sourceContainer.style.display = 'block'
    sourceEditor?.focus()
  } else {
    // Switching to WYSIWYG: transfer content from CodeMirror to Milkdown
    if (milkdownEditor) {
      milkdownEditor.setContent(content)
      milkdownEditor.setCursorFraction(cursorFraction)
    }
    if (sourceContainer) sourceContainer.style.display = 'none'
    if (milkdownContainer) milkdownContainer.style.display = 'block'
    milkdownEditor?.focus()
  }
}

async function init(): Promise<void> {
  toolbarContainer = document.getElementById('toolbar')
  milkdownContainer = document.getElementById('milkdown-container')
  sourceContainer = document.getElementById('source-container')
  wordCountElement = document.getElementById('word-count')

  if (!toolbarContainer) {
    console.error('Toolbar container not found')
    return
  }

  if (!milkdownContainer) {
    console.error('Milkdown container not found')
    return
  }

  if (!sourceContainer) {
    console.error('Source container not found')
    return
  }

  // Create toolbar
  createToolbar(toolbarContainer, handleToolbarAction)

  // Create both editors
  milkdownEditor = await createMilkdownEditor(milkdownContainer, handleContentChange)
  sourceEditor = createSourceEditor(sourceContainer, handleContentChange)

  // Setup image src rewriting for local files
  setupImageRewriting(milkdownContainer)

  milkdownEditor.focus()

  // Initial word count
  updateWordCount('')

  // Setup drag-and-drop and clipboard paste for images
  setupDragAndDrop()
  setupClipboardPaste()

  // Update window title when state changes
  onStateChange(updateWindowTitle)

  // Initial title
  updateWindowTitle()

  // Listen for menu actions from main process
  window.electronAPI.onMenuAction(async (action: string, data?: string) => {
    switch (action) {
      case 'new':
        await handleNew()
        break
      case 'open':
        await handleOpen()
        break
      case 'openRecent':
        if (data) {
          await handleOpenRecent(data)
        }
        break
      case 'save':
        await handleSave()
        break
      case 'saveAs':
        await handleSaveAs()
        break
      case 'togglePreview':
        handleToggleEditorMode()
        break
      case 'undo':
        handleUndo()
        break
      case 'redo':
        handleRedo()
        break
      case 'bold':
        handleBold()
        break
      case 'italic':
        handleItalic()
        break
      case 'strikethrough':
        handleStrikethrough()
        break
      case 'inlineCode':
        handleInlineCode()
        break
      case 'h1':
        handleHeading(1)
        break
      case 'h2':
        handleHeading(2)
        break
      case 'h3':
        handleHeading(3)
        break
      case 'bulletList':
        handleBulletList()
        break
      case 'orderedList':
        handleOrderedList()
        break
      case 'taskList':
        handleTaskList()
        break
      case 'blockquote':
        handleBlockquote()
        break
      case 'codeBlock':
        handleCodeBlock()
        break
      case 'horizontalRule':
        handleHorizontalRule()
        break
      case 'insertImage':
        await handleInsertImage()
        break
      case 'insertLink':
        handleInsertLink()
        break
      case 'close':
        await handleClose()
        break
    }
  })
}

function handleUndo(): void {
  const mode = getEditorMode()
  if (mode === 'wysiwyg') {
    milkdownEditor?.undo()
  } else {
    sourceEditor?.undo()
  }
}

function handleRedo(): void {
  const mode = getEditorMode()
  if (mode === 'wysiwyg') {
    milkdownEditor?.redo()
  } else {
    sourceEditor?.redo()
  }
}

function handleBold(): void {
  const mode = getEditorMode()
  if (mode === 'wysiwyg') {
    milkdownEditor?.applyBold()
  } else {
    sourceEditor?.wrapSelection('**', '**')
  }
}

function handleItalic(): void {
  const mode = getEditorMode()
  if (mode === 'wysiwyg') {
    milkdownEditor?.applyItalic()
  } else {
    sourceEditor?.wrapSelection('*', '*')
  }
}

function handleHeading(level: number): void {
  const mode = getEditorMode()
  if (mode === 'wysiwyg') {
    milkdownEditor?.applyHeading(level)
  } else {
    sourceEditor?.insertHeadingPrefix(level)
  }
}

function handleStrikethrough(): void {
  const mode = getEditorMode()
  if (mode === 'wysiwyg') {
    milkdownEditor?.applyStrikethrough()
  } else {
    sourceEditor?.wrapSelection('~~', '~~')
  }
}

function handleInlineCode(): void {
  const mode = getEditorMode()
  if (mode === 'wysiwyg') {
    milkdownEditor?.applyInlineCode()
  } else {
    sourceEditor?.wrapSelection('`', '`')
  }
}

function handleBulletList(): void {
  const mode = getEditorMode()
  if (mode === 'wysiwyg') {
    milkdownEditor?.applyBulletList()
  } else {
    sourceEditor?.toggleListPrefix('- ')
  }
}

function handleOrderedList(): void {
  const mode = getEditorMode()
  if (mode === 'wysiwyg') {
    milkdownEditor?.applyOrderedList()
  } else {
    sourceEditor?.toggleListPrefix('1. ')
  }
}

function handleTaskList(): void {
  const mode = getEditorMode()
  if (mode === 'wysiwyg') {
    // No direct Milkdown command; insert as text via source approach
    milkdownEditor?.insertAtCursor('- [ ] ')
  } else {
    sourceEditor?.toggleListPrefix('- [ ] ')
  }
}

function handleBlockquote(): void {
  const mode = getEditorMode()
  if (mode === 'wysiwyg') {
    milkdownEditor?.applyBlockquote()
  } else {
    sourceEditor?.wrapLine('> ')
  }
}

function handleCodeBlock(): void {
  const mode = getEditorMode()
  if (mode === 'wysiwyg') {
    milkdownEditor?.applyCodeBlock()
  } else {
    sourceEditor?.insertAtCursor('\n```\n\n```\n')
  }
}

function handleHorizontalRule(): void {
  const mode = getEditorMode()
  if (mode === 'wysiwyg') {
    milkdownEditor?.insertHr()
  } else {
    sourceEditor?.insertLine('---')
  }
}

async function handleToolbarAction(action: ToolbarAction): Promise<void> {
  switch (action) {
    case 'new':
      await handleNew()
      break
    case 'open':
      await handleOpen()
      break
    case 'save':
      await handleSave()
      break
    case 'bold':
      handleBold()
      break
    case 'italic':
      handleItalic()
      break
    case 'h1':
      handleHeading(1)
      break
    case 'h2':
      handleHeading(2)
      break
    case 'h3':
      handleHeading(3)
      break
    case 'strikethrough':
      handleStrikethrough()
      break
    case 'inlineCode':
      handleInlineCode()
      break
    case 'bulletList':
      handleBulletList()
      break
    case 'orderedList':
      handleOrderedList()
      break
    case 'taskList':
      handleTaskList()
      break
    case 'blockquote':
      handleBlockquote()
      break
    case 'horizontalRule':
      handleHorizontalRule()
      break
    case 'insertImage':
      await handleInsertImage()
      break
    case 'insertLink':
      handleInsertLink()
      break
  }
}

function handleInsertLink(): void {
  const mode = getEditorMode()
  if (mode === 'wysiwyg') {
    milkdownEditor?.insertLink('url', '')
  } else if (sourceEditor) {
    // In source mode, insert link markdown
    const markdown = '[link text](url)'
    sourceEditor.insertAtCursor(markdown)
  }
}

function insertImageIntoEditor(src: string, alt: string): void {
  const mode = getEditorMode()
  if (mode === 'wysiwyg' && milkdownEditor) {
    milkdownEditor.insertImage(src, alt)
    milkdownEditor.focus()
  } else if (sourceEditor) {
    sourceEditor.insertAtCursor(`![${alt}](${src})`)
    sourceEditor.focus()
  }
}

function updateImageBasePath(): void {
  const state = getState()
  if (state.filePath) {
    const basePath = state.filePath.substring(0, state.filePath.lastIndexOf('/'))
    setImageBasePath(basePath)
  } else {
    setImageBasePath(null)
  }
}

async function handleInsertImage(): Promise<void> {
  const state = getState()

  // Check if document is saved (needed for file browse and existing images)
  let currentFilePath = state.filePath
  let basePath: string | null = null
  let existingImages: string[] = []

  if (currentFilePath) {
    basePath = currentFilePath.substring(0, currentFilePath.lastIndexOf('/'))
    existingImages = await window.electronAPI.listImagesInFolder(currentFilePath)
  }

  // Show the image insert modal
  const result = await showImageInsertModal({
    documentPath: currentFilePath,
    existingImages,
    basePath,
  })

  if (!result) {
    return
  }

  if (result.type === 'url') {
    const url = result.value
    const filename = url.split('/').pop()?.split('?')[0] || 'image'
    insertImageIntoEditor(url, filename)
    return
  }

  if (result.type === 'existing') {
    const relativePath = result.value
    const filename = relativePath.split('/').pop() || 'image'
    insertImageIntoEditor(relativePath, filename)
    return
  }

  // result.type === 'file' - Browse for file
  if (!currentFilePath) {
    const promptResult = await window.electronAPI.promptSaveFirst()
    if (promptResult === 'cancel') {
      return
    }
    const saved = await handleSaveAs()
    if (!saved) {
      return
    }
    currentFilePath = getState().filePath
  }

  if (!currentFilePath) {
    return
  }

  const imagePath = await window.electronAPI.selectImage()
  if (!imagePath) {
    return
  }

  const relativePath = await window.electronAPI.copyImageToFolder(imagePath, currentFilePath)
  if (!relativePath) {
    return
  }

  const filename = imagePath.split('/').pop() || 'image'
  insertImageIntoEditor(relativePath, filename)
}

async function handleImageDrop(files: FileList): Promise<void> {
  const state = getState()

  if (!state.filePath) {
    const result = await window.electronAPI.promptSaveFirst()
    if (result === 'cancel') {
      return
    }
    const saved = await handleSaveAs()
    if (!saved) {
      return
    }
  }

  const currentFilePath = getState().filePath
  if (!currentFilePath) {
    return
  }

  for (const file of Array.from(files)) {
    if (!file.type.startsWith('image/')) {
      continue
    }

    const filePath = (file as File & { path?: string }).path
    if (!filePath) {
      continue
    }

    const relativePath = await window.electronAPI.copyImageToFolder(filePath, currentFilePath)
    if (relativePath) {
      insertImageIntoEditor(relativePath, file.name)
    }
  }
}

async function handleImagePaste(clipboardData: DataTransfer): Promise<boolean> {
  const items = clipboardData.items
  let imageItem: DataTransferItem | null = null

  for (const item of Array.from(items)) {
    if (item.type.startsWith('image/')) {
      imageItem = item
      break
    }
  }

  if (!imageItem) {
    return false
  }

  const state = getState()

  if (!state.filePath) {
    const result = await window.electronAPI.promptSaveFirst()
    if (result === 'cancel') {
      return true
    }
    const saved = await handleSaveAs()
    if (!saved) {
      return true
    }
  }

  const currentFilePath = getState().filePath
  if (!currentFilePath) {
    return true
  }

  const file = imageItem.getAsFile()
  if (!file) {
    return true
  }

  const reader = new FileReader()
  reader.onload = async () => {
    const base64 = (reader.result as string).split(',')[1]
    const relativePath = await window.electronAPI.saveImageFromClipboard(
      base64,
      currentFilePath,
      file.type
    )

    if (relativePath) {
      insertImageIntoEditor(relativePath, 'pasted image')
    }
  }
  reader.readAsDataURL(file)

  return true
}

function setupDragAndDrop(): void {
  // Set up on both containers
  const containers = [milkdownContainer, sourceContainer].filter(Boolean) as HTMLElement[]

  for (const container of containers) {
    container.addEventListener('dragover', (e) => {
      e.preventDefault()
      e.stopPropagation()
    })

    container.addEventListener('drop', async (e) => {
      e.preventDefault()
      e.stopPropagation()

      const files = e.dataTransfer?.files
      if (files && files.length > 0) {
        await handleImageDrop(files)
      }
    })
  }
}

function setupClipboardPaste(): void {
  // Set up on both containers
  const containers = [milkdownContainer, sourceContainer].filter(Boolean) as HTMLElement[]

  for (const container of containers) {
    container.addEventListener('paste', async (e) => {
      const clipboardData = e.clipboardData
      if (!clipboardData) return

      const hasImage = Array.from(clipboardData.items).some(item => item.type.startsWith('image/'))
      if (hasImage) {
        e.preventDefault()
        await handleImagePaste(clipboardData)
      }
    })
  }
}

async function handleClose(): Promise<void> {
  const canClose = await checkUnsavedChanges()
  if (canClose) {
    window.electronAPI.confirmClose()
  }
}

async function checkUnsavedChanges(): Promise<boolean> {
  const state = getState()
  if (!state.isModified) {
    return true
  }

  const result = await window.electronAPI.showUnsavedDialog()
  if (result === 'save') {
    const saved = await handleSave()
    return saved
  } else if (result === 'discard') {
    return true
  }
  return false
}

async function handleNew(): Promise<void> {
  if (!(await checkUnsavedChanges())) {
    return
  }

  if (milkdownEditor) {
    milkdownEditor.setContent('')
  }
  if (sourceEditor) {
    sourceEditor.setContent('')
  }
  resetState()
  updateWordCount('')
}

async function handleOpen(): Promise<void> {
  if (!(await checkUnsavedChanges())) {
    return
  }

  const result = await window.electronAPI.openFile()
  if (result) {
    loadContent(result.content, result.filePath)
  }
}

async function handleOpenRecent(filePath: string): Promise<void> {
  if (!(await checkUnsavedChanges())) {
    return
  }

  const result = await window.electronAPI.readFile(filePath)
  if (result) {
    loadContent(result.content, result.filePath)
  }
}

function loadContent(content: string, filePath: string): void {
  const mode = getEditorMode()
  if (mode === 'wysiwyg' && milkdownEditor) {
    milkdownEditor.setContent(content)
  } else if (mode === 'source' && sourceEditor) {
    sourceEditor.setContent(content)
  }

  setFilePath(filePath)
  setOriginalContent(content)
  updateImageBasePath()
  updateWordCount(content)
}

async function handleSave(): Promise<boolean> {
  const state = getState()
  const content = getCurrentContent()

  if (state.filePath) {
    const success = await window.electronAPI.saveFile(state.filePath, content)
    if (success) {
      setOriginalContent(content)
      return true
    }
  } else {
    return await handleSaveAs()
  }
  return false
}

async function handleSaveAs(): Promise<boolean> {
  const content = getCurrentContent()
  const filePath = await window.electronAPI.saveFileAs(content)

  if (filePath) {
    setFilePath(filePath)
    setOriginalContent(content)
    updateImageBasePath()
    return true
  }
  return false
}

document.addEventListener('DOMContentLoaded', init)
