import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

const MAX_RECENT_FILES = 10
const CONFIG_FILE = 'recent-files.json'

function getConfigPath(): string {
  return path.join(app.getPath('userData'), CONFIG_FILE)
}

export function getRecentFiles(): string[] {
  try {
    const configPath = getConfigPath()
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8')
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed)) {
        // Filter out files that no longer exist
        return parsed.filter((f) => typeof f === 'string' && fs.existsSync(f))
      }
    }
  } catch {
    // Ignore errors, return empty list
  }
  return []
}

export function addRecentFile(filePath: string): string[] {
  const recentFiles = getRecentFiles()

  // Remove if already exists (to move it to top)
  const filtered = recentFiles.filter((f) => f !== filePath)

  // Add to beginning
  filtered.unshift(filePath)

  // Keep only MAX_RECENT_FILES
  const updated = filtered.slice(0, MAX_RECENT_FILES)

  // Save to disk
  try {
    const configPath = getConfigPath()
    fs.writeFileSync(configPath, JSON.stringify(updated, null, 2))
  } catch {
    // Ignore write errors
  }

  return updated
}

export function clearRecentFiles(): void {
  try {
    const configPath = getConfigPath()
    fs.writeFileSync(configPath, JSON.stringify([]))
  } catch {
    // Ignore write errors
  }
}
