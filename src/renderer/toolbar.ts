import filePlusIcon from '../assets/toolbar-glyphs/file-plus.svg?raw'
import folderOpenIcon from '../assets/toolbar-glyphs/folder-open.svg?raw'
import floppyDiskIcon from '../assets/toolbar-glyphs/floppy-disk.svg?raw'
import textBIcon from '../assets/toolbar-glyphs/text-b.svg?raw'
import textItalicIcon from '../assets/toolbar-glyphs/text-italic.svg?raw'
import textStrikethroughIcon from '../assets/toolbar-glyphs/text-strikethrough.svg?raw'
import codeSimpleIcon from '../assets/toolbar-glyphs/code-simple.svg?raw'
import textHOneIcon from '../assets/toolbar-glyphs/text-h-one.svg?raw'
import textHTwoIcon from '../assets/toolbar-glyphs/text-h-two.svg?raw'
import textHThreeIcon from '../assets/toolbar-glyphs/text-h-three.svg?raw'
import listBulletsIcon from '../assets/toolbar-glyphs/list-bullets.svg?raw'
import listNumbersIcon from '../assets/toolbar-glyphs/list-numbers.svg?raw'
import listChecksIcon from '../assets/toolbar-glyphs/list-checks.svg?raw'
import quotesIcon from '../assets/toolbar-glyphs/quotes.svg?raw'
import horizontalLineIcon from '../assets/toolbar-glyphs/horizontal-line.svg?raw'
import imageIcon from '../assets/toolbar-glyphs/image.svg?raw'
import linkSimpleIcon from '../assets/toolbar-glyphs/link-simple.svg?raw'

export type ToolbarAction =
  | 'new'
  | 'open'
  | 'save'
  | 'bold'
  | 'italic'
  | 'strikethrough'
  | 'inlineCode'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bulletList'
  | 'orderedList'
  | 'taskList'
  | 'blockquote'
  | 'horizontalRule'
  | 'insertImage'
  | 'insertLink'

export interface ToolbarButton {
  id: ToolbarAction
  icon: string
  title: string
  shortcut?: string
}

const toolbarButtons: (ToolbarButton | 'separator')[] = [
  { id: 'new', icon: filePlusIcon, title: 'New', shortcut: 'Ctrl+N' },
  { id: 'open', icon: folderOpenIcon, title: 'Open', shortcut: 'Ctrl+O' },
  { id: 'save', icon: floppyDiskIcon, title: 'Save', shortcut: 'Ctrl+S' },
  'separator',
  { id: 'bold', icon: textBIcon, title: 'Bold', shortcut: 'Ctrl+B' },
  { id: 'italic', icon: textItalicIcon, title: 'Italic', shortcut: 'Ctrl+I' },
  { id: 'strikethrough', icon: textStrikethroughIcon, title: 'Strikethrough', shortcut: 'Ctrl+Shift+X' },
  { id: 'inlineCode', icon: codeSimpleIcon, title: 'Inline Code', shortcut: 'Ctrl+`' },
  'separator',
  { id: 'h1', icon: textHOneIcon, title: 'Heading 1', shortcut: 'Ctrl+1' },
  { id: 'h2', icon: textHTwoIcon, title: 'Heading 2', shortcut: 'Ctrl+2' },
  { id: 'h3', icon: textHThreeIcon, title: 'Heading 3', shortcut: 'Ctrl+3' },
  'separator',
  { id: 'bulletList', icon: listBulletsIcon, title: 'Bullet List', shortcut: 'Ctrl+Shift+8' },
  { id: 'orderedList', icon: listNumbersIcon, title: 'Numbered List', shortcut: 'Ctrl+Shift+9' },
  { id: 'taskList', icon: listChecksIcon, title: 'Task List' },
  { id: 'blockquote', icon: quotesIcon, title: 'Blockquote', shortcut: 'Ctrl+Shift+.' },
  { id: 'horizontalRule', icon: horizontalLineIcon, title: 'Horizontal Rule' },
  'separator',
  { id: 'insertImage', icon: imageIcon, title: 'Insert Image', shortcut: 'Ctrl+Shift+I' },
  { id: 'insertLink', icon: linkSimpleIcon, title: 'Insert Link', shortcut: 'Ctrl+K' },
]

export type ToolbarCallback = (action: ToolbarAction) => void

export function createToolbar(container: HTMLElement, onAction: ToolbarCallback): void {
  container.className = 'toolbar'

  for (const item of toolbarButtons) {
    if (item === 'separator') {
      const separator = document.createElement('div')
      separator.className = 'toolbar-separator'
      container.appendChild(separator)
    } else {
      const button = document.createElement('button')
      button.className = 'toolbar-btn'
      button.innerHTML = item.icon
      button.title = item.shortcut ? `${item.title} (${item.shortcut})` : item.title
      button.dataset.action = item.id

      // Prevent mousedown from stealing focus/selection from the editor
      button.addEventListener('mousedown', (e) => {
        e.preventDefault()
      })

      button.addEventListener('click', () => {
        onAction(item.id)
      })

      container.appendChild(button)
    }
  }
}
