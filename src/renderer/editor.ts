import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, undo, redo } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'

export interface EditorInstance {
  view: EditorView
  getContent: () => string
  setContent: (content: string) => void
  focus: () => void
  undo: () => void
  redo: () => void
  wrapSelection: (before: string, after: string) => void
  insertAtCursor: (text: string) => void
}

export type ChangeCallback = (content: string) => void

function wrapSelectionCommand(view: EditorView, before: string, after: string): boolean {
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
  return true
}

export function createEditor(
  container: HTMLElement,
  onChange: ChangeCallback
): EditorInstance {
  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      onChange(update.state.doc.toString())
    }
  })

  const formattingKeymap = keymap.of([
    { key: 'Mod-b', run: (view) => wrapSelectionCommand(view, '**', '**') },
    { key: 'Mod-i', run: (view) => wrapSelectionCommand(view, '*', '*') },
  ])

  const state = EditorState.create({
    doc: '',
    extensions: [
      history(),
      formattingKeymap,
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
    view,
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
  }
}
