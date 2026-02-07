import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, undo, redo } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'

export interface SourceEditorInstance {
  getContent: () => string
  setContent: (content: string) => void
  focus: () => void
  destroy: () => void
  undo: () => void
  redo: () => void
  wrapSelection: (before: string, after: string) => void
  insertAtCursor: (text: string) => void
  insertHeadingPrefix: (level: number) => void
  toggleListPrefix: (prefix: string) => void
  wrapLine: (prefix: string) => void
  insertLine: (text: string) => void
  getCursorFraction: () => number
  setCursorFraction: (fraction: number) => void
}

export type ChangeCallback = (content: string) => void

export function createSourceEditor(
  container: HTMLElement,
  onChange: ChangeCallback
): SourceEditorInstance {
  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      onChange(update.state.doc.toString())
    }
  })

  const state = EditorState.create({
    doc: '',
    extensions: [
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      EditorView.lineWrapping,
      markdown(),
      updateListener,
      EditorView.theme({
        '&': {
          height: '100%',
          fontSize: '16px',
        },
        '.cm-scroller': {
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          overflow: 'auto',
          padding: '16px',
        },
        '.cm-content': {
          caretColor: '#333',
        },
        '.cm-line': {
          padding: '0 4px',
        },
        '&.cm-focused .cm-cursor': {
          borderLeftColor: '#333',
        },
        '&.cm-focused .cm-selectionBackground, ::selection': {
          backgroundColor: '#d7d4f0',
        },
        '.cm-gutters': {
          display: 'none',
        },
      }),
    ],
  })

  const view = new EditorView({
    state,
    parent: container,
  })

  return {
    getContent: () => view.state.doc.toString(),

    setContent: (content: string) => {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: content,
        },
      })
    },

    focus: () => view.focus(),

    destroy: () => view.destroy(),

    undo: () => undo(view),

    redo: () => redo(view),

    wrapSelection: (before: string, after: string) => {
      const { from, to } = view.state.selection.main
      const selectedText = view.state.sliceDoc(from, to)
      const wrapped = before + selectedText + after

      view.dispatch({
        changes: { from, to, insert: wrapped },
        selection: {
          anchor: from + before.length,
          head: from + before.length + selectedText.length,
        },
      })
    },

    insertAtCursor: (text: string) => {
      const { from } = view.state.selection.main
      view.dispatch({
        changes: { from, to: from, insert: text },
        selection: { anchor: from + text.length },
      })
    },

    insertHeadingPrefix: (level: number) => {
      const prefix = '#'.repeat(level) + ' '
      const { from } = view.state.selection.main
      const line = view.state.doc.lineAt(from)
      const lineStart = line.from
      const lineText = line.text

      // Check if line already starts with a heading
      const headingMatch = lineText.match(/^(#{1,6})\s*/)

      if (headingMatch) {
        // Replace existing heading
        view.dispatch({
          changes: { from: lineStart, to: lineStart + headingMatch[0].length, insert: prefix },
        })
      } else {
        // Insert heading at line start
        view.dispatch({
          changes: { from: lineStart, to: lineStart, insert: prefix },
        })
      }
      view.focus()
    },

    toggleListPrefix: (prefix: string) => {
      const { from, to } = view.state.selection.main
      const startLine = view.state.doc.lineAt(from)
      const endLine = view.state.doc.lineAt(to)

      // Patterns for list prefixes we recognize
      const listPrefixPattern = /^(\d+\.\s+|- \[ \] |- )/

      // Collect all lines in selection
      const lines: { from: number; to: number; text: string }[] = []
      for (let pos = startLine.from; pos <= endLine.from; ) {
        const line = view.state.doc.lineAt(pos)
        lines.push({ from: line.from, to: line.to, text: line.text })
        pos = line.to + 1
      }

      // Check if all lines already have this prefix
      const allHavePrefix = lines.every((l) => l.text.startsWith(prefix) || l.text.match(/^\d+\.\s/) && prefix.match(/^\d+\./))

      // Check if prefix is a numbered list pattern
      const isNumbered = /^\d+\.\s/.test(prefix)

      const changes: { from: number; to: number; insert: string }[] = []

      if (allHavePrefix) {
        // Toggle off: remove the prefix from each line
        for (const line of lines) {
          const match = line.text.match(listPrefixPattern)
          if (match) {
            changes.push({ from: line.from, to: line.from + match[0].length, insert: '' })
          }
        }
      } else {
        // Add or replace prefix on each line
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          const match = line.text.match(listPrefixPattern)
          const newPrefix = isNumbered ? `${i + 1}. ` : prefix
          if (match) {
            // Replace existing list prefix
            changes.push({ from: line.from, to: line.from + match[0].length, insert: newPrefix })
          } else {
            // Insert new prefix
            changes.push({ from: line.from, to: line.from, insert: newPrefix })
          }
        }
      }

      if (changes.length > 0) {
        view.dispatch({ changes })
      }
      view.focus()
    },

    wrapLine: (prefix: string) => {
      const { from } = view.state.selection.main
      const line = view.state.doc.lineAt(from)
      const lineStart = line.from
      view.dispatch({
        changes: { from: lineStart, to: lineStart, insert: prefix },
      })
      view.focus()
    },

    insertLine: (text: string) => {
      const { from } = view.state.selection.main
      const line = view.state.doc.lineAt(from)
      const lineEnd = line.to
      const insert = '\n' + text
      view.dispatch({
        changes: { from: lineEnd, to: lineEnd, insert },
        selection: { anchor: lineEnd + insert.length },
      })
      view.focus()
    },

    getCursorFraction: () => {
      const { from } = view.state.selection.main
      const total = view.state.doc.length
      return total > 0 ? from / total : 0
    },

    setCursorFraction: (fraction: number) => {
      const total = view.state.doc.length
      const pos = Math.min(Math.round(fraction * total), total)
      view.dispatch({
        selection: { anchor: pos },
        scrollIntoView: true,
      })
    },
  }
}
