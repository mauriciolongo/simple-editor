# MVP Implementation Plan

## Goal

Create a minimal working markdown editor that can:
- Create new documents
- Open existing `.md` files
- Edit content
- Save changes

This is the foundation upon which all other features will be built.

---

## MVP Scope

| Feature | Included | Notes |
|---------|----------|-------|
| Create new document | Yes | Ctrl+N or File > New |
| Open file | Yes | Ctrl+O with native dialog |
| Save file | Yes | Ctrl+S (prompt if new) |
| Save As | Yes | Ctrl+Shift+S |
| Basic text editing | Yes | Type, delete, select |
| Undo/Redo | Yes | Ctrl+Z, Ctrl+Y |
| Word wrap | Yes | Soft wrap at window edge |
| Window title with filename | Yes | Shows `*` for unsaved |
| Unsaved changes prompt | Yes | On close/open/new |
| Preview panel | No | Deferred to next phase |
| Word count | No | Deferred |
| Recent files | No | Deferred |
| Formatting shortcuts | No | Deferred |

---

## Implementation Phases

### Phase 1: Project Setup

**1.1 Initialize project structure**
```bash
mkdir markdown-editor && cd markdown-editor
npm init -y
```

**1.2 Install dependencies**
```bash
# Core
npm install electron

# Development
npm install -D typescript vite electron-builder
npm install -D @types/node
```

**1.3 Create folder structure**
```
markdown-editor/
├── src/
│   ├── main/
│   │   └── index.ts
│   ├── renderer/
│   │   ├── index.html
│   │   ├── index.ts
│   │   └── styles.css
│   └── preload/
│       └── index.ts
├── package.json
├── tsconfig.json
└── vite.config.ts
```

**1.4 Configure TypeScript**
- Target ES2020+
- Strict mode enabled
- Separate configs for main/renderer if needed

**1.5 Configure Vite for Electron**
- Main process bundling
- Renderer process bundling
- Hot reload for development

---

### Phase 2: Electron Shell

**2.1 Main process (`src/main/index.ts`)**
- Create BrowserWindow with sensible defaults
- Set window title
- Configure security settings:
  - `contextIsolation: true`
  - `nodeIntegration: false`
  - Load preload script

**2.2 Preload script (`src/preload/index.ts`)**
- Expose safe IPC methods via `contextBridge`
- Define API for:
  - `openFile()` → returns file content and path
  - `saveFile(path, content)` → saves content
  - `saveFileAs(content)` → shows save dialog, returns path
  - `newFile()` → signals new document
  - `showUnsavedDialog()` → returns user choice

**2.3 Renderer entry (`src/renderer/index.html`)**
- Basic HTML structure
- Single textarea or div for editor
- Link to styles and scripts

---

### Phase 3: Editor Component

**3.1 Install CodeMirror 6**
```bash
npm install @codemirror/state @codemirror/view @codemirror/commands
npm install @codemirror/language @codemirror/lang-markdown
```

**3.2 Initialize editor (`src/renderer/editor.ts`)**
- Create EditorState with:
  - Empty initial document
  - Line wrapping extension
  - Basic keybindings (undo, redo, select all)
  - Change listener to track modifications

**3.3 Track document state**
- `currentFilePath: string | null`
- `isModified: boolean`
- Update on every change

**3.4 Style the editor (`src/renderer/styles.css`)**
- Full window height
- Monospace font
- Remove syntax highlighting colors
- Clean, minimal appearance

---

### Phase 4: File Operations

**4.1 New File (Ctrl+N)**
- Check for unsaved changes → prompt if needed
- Clear editor content
- Set `currentFilePath = null`
- Set `isModified = false`
- Update window title to "Untitled"

**4.2 Open File (Ctrl+O)**
- Check for unsaved changes → prompt if needed
- Show native open dialog (filter: `*.md`)
- Read file content
- Load into editor
- Set `currentFilePath`
- Set `isModified = false`
- Update window title

**4.3 Save File (Ctrl+S)**
- If `currentFilePath` exists:
  - Write content to file
  - Set `isModified = false`
  - Update window title (remove `*`)
- If no path (new document):
  - Trigger Save As flow

**4.4 Save As (Ctrl+Shift+S)**
- Show native save dialog (filter: `*.md`)
- Write content to chosen path
- Set `currentFilePath` to new path
- Set `isModified = false`
- Update window title

**4.5 Close/Quit handling**
- Intercept window close event
- Check for unsaved changes
- Show "Save / Don't Save / Cancel" dialog
- Handle accordingly

---

### Phase 5: Window Title

**5.1 Title format**
- New document: `Untitled - Markdown Editor`
- Saved document: `filename.md - Markdown Editor`
- Unsaved changes: `*filename.md - Markdown Editor`

**5.2 Update triggers**
- On file open
- On file save
- On content change (add/remove `*`)
- On new file

---

### Phase 6: Menu Bar

**6.1 Create application menu (`src/main/menu.ts`)**

```
File
├── New         Ctrl+N
├── Open        Ctrl+O
├── Save        Ctrl+S
├── Save As     Ctrl+Shift+S
├── ─────────────────────
└── Exit

Edit
├── Undo        Ctrl+Z
├── Redo        Ctrl+Y
├── ─────────────────────
├── Cut         Ctrl+X
├── Copy        Ctrl+C
├── Paste       Ctrl+V
├── ─────────────────────
└── Select All  Ctrl+A
```

**6.2 Wire menu items to IPC**
- Menu clicks send messages to renderer
- Renderer executes corresponding actions

---

### Phase 7: Testing & Polish

**7.1 Manual testing checklist**
- [ ] Create new file, type content, save
- [ ] Open existing `.md` file
- [ ] Edit and save changes
- [ ] Save As to new location
- [ ] Unsaved changes prompt on close
- [ ] Unsaved changes prompt on open
- [ ] Unsaved changes prompt on new
- [ ] Window title updates correctly
- [ ] Undo/Redo works
- [ ] Word wrap works

**7.2 Edge cases**
- [ ] Open file that doesn't exist (handle error)
- [ ] Save to read-only location (handle error)
- [ ] Very large file (performance check)
- [ ] File with unusual characters in name

---

## File Structure (Final MVP)

```
markdown-editor/
├── src/
│   ├── main/
│   │   ├── index.ts        # Main process entry
│   │   ├── menu.ts         # Application menu
│   │   └── file-ops.ts     # File system operations
│   ├── preload/
│   │   └── index.ts        # Context bridge API
│   ├── renderer/
│   │   ├── index.html      # HTML shell
│   │   ├── index.ts        # Renderer entry
│   │   ├── editor.ts       # CodeMirror setup
│   │   ├── state.ts        # Document state management
│   │   └── styles.css      # Styling
│   └── shared/
│       └── types.ts        # Shared TypeScript types
├── package.json
├── tsconfig.json
├── vite.config.ts
└── electron-builder.json
```

---

## Dependencies Summary

**Runtime:**
- `electron`
- `@codemirror/state`
- `@codemirror/view`
- `@codemirror/commands`
- `@codemirror/lang-markdown`

**Development:**
- `typescript`
- `vite`
- `electron-builder`
- `@types/node`

---

## Success Criteria

MVP is complete when:
1. User can create a new empty document
2. User can open an existing `.md` file
3. User can edit text with undo/redo support
4. User can save to current file or new location
5. Unsaved changes are protected with prompts
6. Window title reflects current state
7. Application runs on Linux without errors
