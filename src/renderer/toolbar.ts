import filePlusIcon from '../assets/toolbar-glyphs/file-plus.svg?raw'
import folderOpenIcon from '../assets/toolbar-glyphs/folder-open.svg?raw'
import floppyDiskIcon from '../assets/toolbar-glyphs/floppy-disk.svg?raw'
import textBIcon from '../assets/toolbar-glyphs/text-b.svg?raw'
import textItalicIcon from '../assets/toolbar-glyphs/text-italic.svg?raw'
import textHOneIcon from '../assets/toolbar-glyphs/text-h-one.svg?raw'
import textHTwoIcon from '../assets/toolbar-glyphs/text-h-two.svg?raw'
import textHThreeIcon from '../assets/toolbar-glyphs/text-h-three.svg?raw'
import imageIcon from '../assets/toolbar-glyphs/image.svg?raw'
import linkSimpleIcon from '../assets/toolbar-glyphs/link-simple.svg?raw'

export type ToolbarAction =
  | 'new'
  | 'open'
  | 'save'
  | 'bold'
  | 'italic'
  | 'h1'
  | 'h2'
  | 'h3'
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
  'separator',
  { id: 'h1', icon: textHOneIcon, title: 'Heading 1' },
  { id: 'h2', icon: textHTwoIcon, title: 'Heading 2' },
  { id: 'h3', icon: textHThreeIcon, title: 'Heading 3' },
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

      button.addEventListener('click', () => {
        onAction(item.id)
      })

      container.appendChild(button)
    }
  }
}
