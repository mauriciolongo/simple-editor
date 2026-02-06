export type ImageInsertResult = {
  type: 'file' | 'url' | 'existing'
  value: string
} | null

export interface ImageModalOptions {
  documentPath: string | null
  existingImages: string[]
  basePath: string | null
}

export function showImageInsertModal(options: ImageModalOptions): Promise<ImageInsertResult> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.className = 'modal-overlay'

    const modal = document.createElement('div')
    modal.className = 'modal'

    const hasExistingImages = options.existingImages.length > 0

    modal.innerHTML = `
      <div class="modal-header">Insert Image</div>
      <div class="modal-body">
        <div class="modal-section">
          <div class="modal-section-title">Browse for image file</div>
          <button class="modal-btn modal-btn-full" id="browse-file-btn">
            Browse file system...
          </button>
        </div>

        <div class="modal-section">
          <div class="modal-section-title">Enter image URL</div>
          <div class="modal-input-group">
            <input type="text" class="modal-input" id="url-input" placeholder="https://example.com/image.png">
            <button class="modal-btn modal-btn-primary" id="url-insert-btn">Insert</button>
          </div>
        </div>

        <div class="modal-section">
          <div class="modal-section-title">Select from existing images</div>
          <div class="image-grid" id="image-grid">
            ${hasExistingImages
              ? options.existingImages.map(img => `
                  <div class="image-grid-item" data-path="${img}">
                    <img src="local-file://${options.basePath}/${img}" alt="${img.split('/').pop()}">
                  </div>
                `).join('')
              : '<div class="image-grid-empty">No images in ./images folder</div>'
            }
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="modal-btn" id="cancel-btn">Cancel</button>
      </div>
    `

    overlay.appendChild(modal)
    document.body.appendChild(overlay)

    let selectedExisting: string | null = null

    const cleanup = () => {
      document.body.removeChild(overlay)
    }

    // Browse file button
    const browseBtn = modal.querySelector('#browse-file-btn') as HTMLButtonElement
    browseBtn.addEventListener('click', () => {
      cleanup()
      resolve({ type: 'file', value: '' })
    })

    // URL input
    const urlInput = modal.querySelector('#url-input') as HTMLInputElement
    const urlInsertBtn = modal.querySelector('#url-insert-btn') as HTMLButtonElement

    urlInsertBtn.addEventListener('click', () => {
      const url = urlInput.value.trim()
      if (url) {
        cleanup()
        resolve({ type: 'url', value: url })
      }
    })

    urlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const url = urlInput.value.trim()
        if (url) {
          cleanup()
          resolve({ type: 'url', value: url })
        }
      }
    })

    // Image grid selection
    const imageGrid = modal.querySelector('#image-grid') as HTMLElement
    imageGrid.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('.image-grid-item') as HTMLElement | null
      if (target) {
        // Remove previous selection
        imageGrid.querySelectorAll('.image-grid-item').forEach(item => {
          item.classList.remove('selected')
        })
        target.classList.add('selected')
        selectedExisting = target.dataset.path || null

        // Double-click to insert
        if (selectedExisting) {
          cleanup()
          resolve({ type: 'existing', value: selectedExisting })
        }
      }
    })

    // Cancel button
    const cancelBtn = modal.querySelector('#cancel-btn') as HTMLButtonElement
    cancelBtn.addEventListener('click', () => {
      cleanup()
      resolve(null)
    })

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        cleanup()
        resolve(null)
      }
    })

    // Close on Escape
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', handleKeydown)
        cleanup()
        resolve(null)
      }
    }
    document.addEventListener('keydown', handleKeydown)

    // Focus URL input
    urlInput.focus()
  })
}
