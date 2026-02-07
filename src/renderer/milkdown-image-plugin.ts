let basePath: string | null = null

export function setImageBasePath(path: string | null): void {
  basePath = path
  // Re-resolve all existing images when base path changes
  rewriteAllImages()
}

export function getImageBasePath(): string | null {
  return basePath
}

/**
 * Resolves a relative image src to a local-file:// URL.
 * Absolute URLs (http, https, data, file, local-file) are returned as-is.
 */
function resolveImageSrc(src: string): string {
  if (!basePath) return src
  if (
    src.startsWith('http://') ||
    src.startsWith('https://') ||
    src.startsWith('data:') ||
    src.startsWith('file://') ||
    src.startsWith('local-file://')
  ) {
    return src
  }
  return `local-file://${basePath}/${src}`
}

let observedContainer: HTMLElement | null = null
let observer: MutationObserver | null = null

function rewriteImage(img: HTMLImageElement): void {
  const src = img.getAttribute('src')
  if (!src) return
  const resolved = resolveImageSrc(src)
  if (resolved !== src) {
    img.src = resolved
  }
}

function rewriteAllImages(): void {
  if (!observedContainer) return
  const images = observedContainer.querySelectorAll<HTMLImageElement>('img')
  images.forEach(rewriteImage)
}

/**
 * Observes a container element for new or changed <img> elements
 * and rewrites relative src paths to local-file:// URLs.
 */
export function setupImageRewriting(container: HTMLElement): void {
  observedContainer = container

  // Rewrite any images already present
  rewriteAllImages()

  // Watch for new images added to the DOM
  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLImageElement) {
            rewriteImage(node)
          } else if (node instanceof HTMLElement) {
            const images = node.querySelectorAll<HTMLImageElement>('img')
            images.forEach(rewriteImage)
          }
        }
      } else if (mutation.type === 'attributes' && mutation.target instanceof HTMLImageElement) {
        if (mutation.attributeName === 'src') {
          rewriteImage(mutation.target)
        }
      }
    }
  })

  observer.observe(container, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src'],
  })
}

export function teardownImageRewriting(): void {
  if (observer) {
    observer.disconnect()
    observer = null
  }
  observedContainer = null
}
