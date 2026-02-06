export interface DocumentState {
  filePath: string | null
  isModified: boolean
  content: string
}

export interface FileOperationResult {
  success: boolean
  filePath?: string
  content?: string
  error?: string
}
