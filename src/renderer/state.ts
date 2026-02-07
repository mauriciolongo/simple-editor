export type EditorMode = 'wysiwyg' | 'source'

export interface DocumentState {
  filePath: string | null
  isModified: boolean
  originalContent: string
  editorMode: EditorMode
}

let state: DocumentState = {
  filePath: null,
  isModified: false,
  originalContent: '',
  editorMode: 'wysiwyg',
}

type StateChangeCallback = (state: DocumentState) => void
const listeners: StateChangeCallback[] = []

export function getState(): DocumentState {
  return { ...state }
}

export function setFilePath(filePath: string | null): void {
  state = { ...state, filePath }
  notifyListeners()
}

export function setModified(isModified: boolean): void {
  state = { ...state, isModified }
  notifyListeners()
}

export function setOriginalContent(content: string): void {
  state = { ...state, originalContent: content, isModified: false }
  notifyListeners()
}

export function resetState(): void {
  state = {
    filePath: null,
    isModified: false,
    originalContent: '',
    editorMode: state.editorMode,
  }
  notifyListeners()
}

export function getEditorMode(): EditorMode {
  return state.editorMode
}

export function toggleEditorMode(): EditorMode {
  const newMode = state.editorMode === 'wysiwyg' ? 'source' : 'wysiwyg'
  state = { ...state, editorMode: newMode }
  notifyListeners()
  return newMode
}

export function onStateChange(callback: StateChangeCallback): void {
  listeners.push(callback)
}

function notifyListeners(): void {
  const currentState = getState()
  listeners.forEach((cb) => cb(currentState))
}
