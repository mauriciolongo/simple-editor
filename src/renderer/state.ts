export interface DocumentState {
  filePath: string | null
  isModified: boolean
  originalContent: string
  isPreviewVisible: boolean
}

let state: DocumentState = {
  filePath: null,
  isModified: false,
  originalContent: '',
  isPreviewVisible: true,
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
    isPreviewVisible: state.isPreviewVisible,
  }
  notifyListeners()
}

export function setPreviewVisible(visible: boolean): void {
  state = { ...state, isPreviewVisible: visible }
  notifyListeners()
}

export function togglePreview(): boolean {
  const newVisible = !state.isPreviewVisible
  state = { ...state, isPreviewVisible: newVisible }
  notifyListeners()
  return newVisible
}

export function onStateChange(callback: StateChangeCallback): void {
  listeners.push(callback)
}

function notifyListeners(): void {
  const currentState = getState()
  listeners.forEach((cb) => cb(currentState))
}
