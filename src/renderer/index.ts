import './styles.css'
import { createEditor, EditorInstance } from './editor'
import { createPreview, PreviewInstance } from './preview'
import { countWords, formatWordCount } from './word-count'
import {
  getState,
  setModified,
  setFilePath,
  setOriginalContent,
  resetState,
  onStateChange,
  togglePreview,
} from './state'
import { showImageInsertModal } from './image-modal'
import { createToolbar, ToolbarAction } from './toolbar'

let editor: EditorInstance | null = null
let preview: PreviewInstance | null = null
let editorContainer: HTMLElement | null = null
let previewContainer: HTMLElement | null = null
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

  // Update preview
  if (preview && state.isPreviewVisible) {
    preview.render(content)
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

function updatePreviewVisibility(): void {
  const state = getState()
  if (!preview || !editorContainer || !previewContainer) return

  if (state.isPreviewVisible) {
    preview.show()
    editorContainer.classList.remove('full-width')
    // Re-render preview with current content
    if (editor) {
      preview.render(editor.getContent())
    }
  } else {
    preview.hide()
    editorContainer.classList.add('full-width')
  }
}

function setupScrollSync(): void {
  if (!editor || !preview) return

  const editorView = editor.view
  const scroller = editorView.scrollDOM

  scroller.addEventListener('scroll', () => {
    if (!preview?.isVisible()) return

    const scrollTop = scroller.scrollTop
    const scrollHeight = scroller.scrollHeight - scroller.clientHeight
    const percent = scrollHeight > 0 ? scrollTop / scrollHeight : 0

    preview.scrollToPercent(percent)
  })
}

function init(): void {
  toolbarContainer = document.getElementById('toolbar')
  editorContainer = document.getElementById('editor-container')
  previewContainer = document.getElementById('preview-container')
  wordCountElement = document.getElementById('word-count')

  if (!toolbarContainer) {
    console.error('Toolbar container not found')
    return
  }

  if (!editorContainer) {
    console.error('Editor container not found')
    return
  }

  if (!previewContainer) {
    console.error('Preview container not found')
    return
  }

  // Create toolbar
  createToolbar(toolbarContainer, handleToolbarAction)

  editor = createEditor(editorContainer, handleContentChange)
  preview = createPreview(previewContainer)
  editor.focus()

  // Initial word count
  updateWordCount('')

  // Setup scroll sync
  setupScrollSync()

  // Setup drag-and-drop and clipboard paste for images
  setupDragAndDrop()
  setupClipboardPaste()

  // Update window title when state changes
  onStateChange(updateWindowTitle)

  // Update preview visibility when state changes
  onStateChange(updatePreviewVisibility)

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
        handleTogglePreview()
        break
      case 'undo':
        editor?.undo()
        break
      case 'redo':
        editor?.redo()
        break
      case 'bold':
        editor?.wrapSelection('**', '**')
        break
      case 'italic':
        editor?.wrapSelection('*', '*')
        break
      case 'insertImage':
        await handleInsertImage()
        break
      case 'insertLink':
        handleInsertLink()
        break
    }
  })
}

function handleTogglePreview(): void {
  togglePreview()
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
      editor?.wrapSelection('**', '**')
      break
    case 'italic':
      editor?.wrapSelection('*', '*')
      break
    case 'h1':
      insertHeading(1)
      break
    case 'h2':
      insertHeading(2)
      break
    case 'h3':
      insertHeading(3)
      break
    case 'insertImage':
      await handleInsertImage()
      break
    case 'insertLink':
      handleInsertLink()
      break
  }
}

function insertHeading(level: number): void {
  if (!editor) return
  const prefix = '#'.repeat(level) + ' '
  const view = editor.view
  const { from } = view.state.selection.main

  // Find the start of the current line
  const line = view.state.doc.lineAt(from)
  const lineStart = line.from
  const lineText = line.text

  // Check if line already starts with a heading
  const headingMatch = lineText.match(/^(#{1,6})\s*/)

  if (headingMatch) {
    // Replace existing heading
    view.dispatch({
      changes: { from: lineStart, to: lineStart + headingMatch[0].length, insert: prefix },
    })
  } else {
    // Insert heading at line start
    view.dispatch({
      changes: { from: lineStart, to: lineStart, insert: prefix },
    })
  }
  editor.focus()
}

function handleInsertLink(): void {
  if (!editor) return
  const view = editor.view
  const { from, to } = view.state.selection.main
  const selectedText = view.state.sliceDoc(from, to)

  if (selectedText) {
    // Wrap selection as link
    const markdown = `[${selectedText}](url)`
    view.dispatch({
      changes: { from, to, insert: markdown },
      // Position cursor at "url" for easy replacement
      selection: { anchor: from + selectedText.length + 3, head: from + selectedText.length + 6 },
    })
  } else {
    // Insert empty link template
    const markdown = '[link text](url)'
    view.dispatch({
      changes: { from, to: from, insert: markdown },
      selection: { anchor: from + 1, head: from + 10 },
    })
  }
  editor.focus()
}

function updatePreviewBasePath(): void {
  const state = getState()
  if (preview && state.filePath) {
    const basePath = state.filePath.substring(0, state.filePath.lastIndexOf('/'))
    preview.setBasePath(basePath)
  } else if (preview) {
    preview.setBasePath(null)
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
    // Insert URL directly
    const url = result.value
    const filename = url.split('/').pop()?.split('?')[0] || 'image'
    const markdown = `![${filename}](${url})`

    if (editor) {
      editor.insertAtCursor(markdown)
      editor.focus()
    }
    return
  }

  if (result.type === 'existing') {
    // Insert existing image path
    const relativePath = result.value
    const filename = relativePath.split('/').pop() || 'image'
    const markdown = `![${filename}](${relativePath})`

    if (editor) {
      editor.insertAtCursor(markdown)
      editor.focus()
    }
    return
  }

  // result.type === 'file' - Browse for file
  // Need to ensure document is saved first
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

  // Open image picker
  const imagePath = await window.electronAPI.selectImage()
  if (!imagePath) {
    return
  }

  // Copy image to folder and get relative path
  const relativePath = await window.electronAPI.copyImageToFolder(imagePath, currentFilePath)
  if (!relativePath) {
    return
  }

  // Insert markdown at cursor
  const filename = imagePath.split('/').pop() || 'image'
  const markdown = `![${filename}](${relativePath})`

  if (editor) {
    editor.insertAtCursor(markdown)
    editor.focus()
  }
}

async function handleImageDrop(files: FileList): Promise<void> {
  const state = getState()

  // Check if document is saved
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

    // For dropped files, we have the path available
    const filePath = (file as File & { path?: string }).path
    if (!filePath) {
      continue
    }

    const relativePath = await window.electronAPI.copyImageToFolder(filePath, currentFilePath)
    if (relativePath && editor) {
      const filename = file.name
      const markdown = `![${filename}](${relativePath})\n`
      editor.insertAtCursor(markdown)
    }
  }

  if (editor) {
    editor.focus()
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

  // Check if document is saved
  if (!state.filePath) {
    const result = await window.electronAPI.promptSaveFirst()
    if (result === 'cancel') {
      return true // Still consumed the paste
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

  // Read file as base64
  const reader = new FileReader()
  reader.onload = async () => {
    const base64 = (reader.result as string).split(',')[1]
    const relativePath = await window.electronAPI.saveImageFromClipboard(
      base64,
      currentFilePath,
      file.type
    )

    if (relativePath && editor) {
      const markdown = `![pasted image](${relativePath})`
      editor.insertAtCursor(markdown)
      editor.focus()
    }
  }
  reader.readAsDataURL(file)

  return true
}

function setupDragAndDrop(): void {
  if (!editorContainer) return

  editorContainer.addEventListener('dragover', (e) => {
    e.preventDefault()
    e.stopPropagation()
  })

  editorContainer.addEventListener('drop', async (e) => {
    e.preventDefault()
    e.stopPropagation()

    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      await handleImageDrop(files)
    }
  })
}

function setupClipboardPaste(): void {
  if (!editorContainer) return

  editorContainer.addEventListener('paste', async (e) => {
    const clipboardData = e.clipboardData
    if (!clipboardData) return

    // Check if there's an image in clipboard
    const hasImage = Array.from(clipboardData.items).some(item => item.type.startsWith('image/'))
    if (hasImage) {
      e.preventDefault()
      await handleImagePaste(clipboardData)
    }
  })
}

async function checkUnsavedChanges(): Promise<boolean> {
  const state = getState()
  if (!state.isModified) {
    return true // No unsaved changes, proceed
  }

  const result = await window.electronAPI.showUnsavedDialog()
  if (result === 'save') {
    const saved = await handleSave()
    return saved
  } else if (result === 'discard') {
    return true // Discard changes, proceed
  }
  return false // Cancel
}

async function handleNew(): Promise<void> {
  if (!(await checkUnsavedChanges())) {
    return
  }

  if (editor) {
    editor.setContent('')
  }
  resetState()

  // Render empty preview
  if (preview && getState().isPreviewVisible) {
    preview.render('')
  }

  // Reset word count
  updateWordCount('')
}

async function handleOpen(): Promise<void> {
  if (!(await checkUnsavedChanges())) {
    return
  }

  const result = await window.electronAPI.openFile()
  if (result && editor) {
    editor.setContent(result.content)
    setFilePath(result.filePath)
    setOriginalContent(result.content)

    // Update preview base path and render
    updatePreviewBasePath()
    if (preview && getState().isPreviewVisible) {
      preview.render(result.content)
    }

    // Update word count
    updateWordCount(result.content)
  }
}

async function handleOpenRecent(filePath: string): Promise<void> {
  if (!(await checkUnsavedChanges())) {
    return
  }

  const result = await window.electronAPI.readFile(filePath)
  if (result && editor) {
    editor.setContent(result.content)
    setFilePath(result.filePath)
    setOriginalContent(result.content)

    // Update preview base path and render
    updatePreviewBasePath()
    if (preview && getState().isPreviewVisible) {
      preview.render(result.content)
    }

    // Update word count
    updateWordCount(result.content)
  }
}

async function handleSave(): Promise<boolean> {
  if (!editor) return false

  const state = getState()
  const content = editor.getContent()

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
  if (!editor) return false

  const content = editor.getContent()
  const filePath = await window.electronAPI.saveFileAs(content)

  if (filePath) {
    setFilePath(filePath)
    setOriginalContent(content)
    updatePreviewBasePath()
    return true
  }
  return false
}

document.addEventListener('DOMContentLoaded', init)
