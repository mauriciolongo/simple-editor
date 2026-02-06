import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

export interface PreviewInstance {
  render: (content: string) => void
  show: () => void
  hide: () => void
  isVisible: () => boolean
  scrollToPercent: (percent: number) => void
  getElement: () => HTMLElement
  setBasePath: (path: string | null) => void
}

export function createPreview(container: HTMLElement): PreviewInstance {
  const md = new MarkdownIt({
    html: false,
    breaks: true,
    linkify: true,
    highlight: (str: string, lang: string) => {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(str, { language: lang }).value
        } catch {
          // Fall through to default
        }
      }
      return '' // Use external default escaping
    },
  })

  const contentDiv = document.createElement('div')
  contentDiv.className = 'preview-content'
  container.appendChild(contentDiv)

  let visible = true
  let basePath: string | null = null

  // Override image renderer to resolve relative paths
  const defaultImageRender = md.renderer.rules.image || function(tokens, idx, options, _env, self) {
    return self.renderToken(tokens, idx, options)
  }

  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const srcIndex = token.attrIndex('src')

    if (srcIndex >= 0 && basePath) {
      const src = token.attrs![srcIndex][1]
      // Convert relative paths to local-file:// URLs (custom protocol for Electron)
      if (src && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('data:') && !src.startsWith('file://') && !src.startsWith('local-file://')) {
        token.attrs![srcIndex][1] = `local-file://${basePath}/${src}`
      }
    }

    return defaultImageRender(tokens, idx, options, env, self)
  }

  return {
    render: (content: string) => {
      contentDiv.innerHTML = md.render(content)
    },
    show: () => {
      container.style.display = 'block'
      visible = true
    },
    hide: () => {
      container.style.display = 'none'
      visible = false
    },
    isVisible: () => visible,
    scrollToPercent: (percent: number) => {
      const maxScroll = container.scrollHeight - container.clientHeight
      container.scrollTop = maxScroll * percent
    },
    getElement: () => container,
    setBasePath: (path: string | null) => {
      basePath = path
    },
  }
}
