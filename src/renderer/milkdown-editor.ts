import { Editor, rootCtx, defaultValueCtx, editorViewCtx } from '@milkdown/kit/core'
import { commonmark, toggleStrongCommand, toggleEmphasisCommand, wrapInHeadingCommand, insertImageCommand, toggleLinkCommand, wrapInBulletListCommand, wrapInOrderedListCommand, wrapInBlockquoteCommand, createCodeBlockCommand, toggleInlineCodeCommand, insertHrCommand } from '@milkdown/kit/preset/commonmark'
import { gfm, toggleStrikethroughCommand } from '@milkdown/preset-gfm'
import { history, undoCommand, redoCommand } from '@milkdown/kit/plugin/history'
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener'
import { callCommand, replaceAll, getMarkdown } from '@milkdown/kit/utils'
import { nord } from '@milkdown/theme-nord'
import '@milkdown/theme-nord/style.css'

export interface MilkdownEditorInstance {
  getContent: () => string
  setContent: (content: string) => void
  focus: () => void
  undo: () => void
  redo: () => void
  applyBold: () => void
  applyItalic: () => void
  applyHeading: (level: number) => void
  insertImage: (src: string, alt: string) => void
  insertLink: (href: string, text: string) => void
  applyBulletList: () => void
  applyOrderedList: () => void
  applyBlockquote: () => void
  applyCodeBlock: () => void
  applyInlineCode: () => void
  applyStrikethrough: () => void
  insertHr: () => void
  insertAtCursor: (text: string) => void
  getCursorFraction: () => number
  setCursorFraction: (fraction: number) => void
  destroy: () => void
}

export type ChangeCallback = (content: string) => void

export async function createMilkdownEditor(
  container: HTMLElement,
  onChange: ChangeCallback
): Promise<MilkdownEditorInstance> {
  let currentMarkdown = ''

  const editor = await Editor.make()
    .config(nord)
    .config((ctx) => {
      ctx.set(rootCtx, container)
      ctx.set(defaultValueCtx, '')
      ctx
        .get(listenerCtx)
        .markdownUpdated((_ctx, markdown, _prevMarkdown) => {
          currentMarkdown = markdown
          onChange(markdown)
        })
    })
    .use(commonmark)
    .use(gfm)
    .use(history)
    .use(listener)
    .create()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleListCommand(view: any, listTypeName: string): void {
    const { state } = view
    const { schema, selection } = state
    const listType = schema.nodes[listTypeName]
    const itemType = schema.nodes.list_item
    if (!listType || !itemType) return

    const otherListTypeName = listTypeName === 'ordered_list' ? 'bullet_list' : 'ordered_list'

    const { from } = selection
    const $from = state.doc.resolve(from)

    // Check if already inside a list
    for (let d = $from.depth; d > 0; d--) {
      const node = $from.node(d)
      if (node.type === listType) {
        // Same list type → unwrap (toggle off)
        const listPos = $from.before(d)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const paragraphs: any[] = []
        node.forEach((item: any) => {
          item.forEach((child: any) => {
            paragraphs.push(child)
          })
        })
        if (paragraphs.length > 0) {
          const FragmentCtor = state.doc.content.constructor
          view.dispatch(state.tr.replaceWith(listPos, listPos + node.nodeSize, FragmentCtor.from(paragraphs)))
        }
        return
      }
      if (node.type === schema.nodes[otherListTypeName]) {
        // Different list type → rebuild as new type
        const listPos = $from.before(d)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: any[] = []
        node.forEach((item: any) => {
          items.push(item.copy(item.content))
        })
        const newList = listType.create(node.attrs, items)
        view.dispatch(state.tr.replaceWith(listPos, listPos + node.nodeSize, newList))
        return
      }
    }

    // Not in a list → wrap selected paragraphs
    const $to = state.doc.resolve(selection.to)
    const range = $from.blockRange($to)
    if (!range) return

    for (let i = range.startIndex; i < range.endIndex; i++) {
      if (range.parent.child(i).type !== schema.nodes.paragraph) return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: any[] = []
    for (let i = range.startIndex; i < range.endIndex; i++) {
      items.push(itemType.create(null, range.parent.child(i)))
    }
    if (items.length === 0) return

    const list = listType.create(null, items)
    view.dispatch(state.tr.replaceWith(range.start, range.end, list))
  }

  return {
    getContent: () => {
      // Use action to get latest markdown if available
      try {
        return editor.action(getMarkdown())
      } catch {
        return currentMarkdown
      }
    },

    setContent: (content: string) => {
      currentMarkdown = content
      editor.action(replaceAll(content, true))
    },

    focus: () => {
      try {
        editor.action((ctx) => {
          const view = ctx.get(editorViewCtx)
          view.focus()
        })
      } catch {
        // Editor may not be ready yet
      }
    },

    undo: () => {
      editor.action(callCommand(undoCommand.key))
    },

    redo: () => {
      editor.action(callCommand(redoCommand.key))
    },

    applyBold: () => {
      editor.action(callCommand(toggleStrongCommand.key))
    },

    applyItalic: () => {
      editor.action(callCommand(toggleEmphasisCommand.key))
    },

    applyHeading: (level: number) => {
      editor.action(callCommand(wrapInHeadingCommand.key, level))
    },

    insertImage: (src: string, alt: string) => {
      editor.action(callCommand(insertImageCommand.key, { src, alt }))
    },

    insertLink: (href: string, text: string) => {
      editor.action(callCommand(toggleLinkCommand.key, { href }))
    },

    applyBulletList: () => {
      editor.action((ctx) => {
        handleListCommand(ctx.get(editorViewCtx), 'bullet_list')
      })
    },

    applyOrderedList: () => {
      editor.action((ctx) => {
        handleListCommand(ctx.get(editorViewCtx), 'ordered_list')
      })
    },

    applyBlockquote: () => {
      editor.action(callCommand(wrapInBlockquoteCommand.key))
    },

    applyCodeBlock: () => {
      editor.action(callCommand(createCodeBlockCommand.key))
    },

    applyInlineCode: () => {
      editor.action(callCommand(toggleInlineCodeCommand.key))
    },

    applyStrikethrough: () => {
      editor.action(callCommand(toggleStrikethroughCommand.key))
    },

    insertHr: () => {
      editor.action(callCommand(insertHrCommand.key))
    },

    insertAtCursor: (text: string) => {
      editor.action((ctx) => {
        const view = ctx.get(editorViewCtx)
        const { from } = view.state.selection
        view.dispatch(
          view.state.tr.insertText(text, from)
        )
      })
    },

    getCursorFraction: () => {
      try {
        return editor.action((ctx) => {
          const view = ctx.get(editorViewCtx)
          const { from } = view.state.selection
          const total = view.state.doc.content.size
          return total > 0 ? from / total : 0
        })
      } catch {
        return 0
      }
    },

    setCursorFraction: (fraction: number) => {
      try {
        editor.action((ctx) => {
          const view = ctx.get(editorViewCtx)
          const total = view.state.doc.content.size
          const pos = Math.min(Math.round(fraction * total), total)
          // Resolve to a valid position
          const resolvedPos = view.state.doc.resolve(pos)
          view.dispatch(view.state.tr.setSelection(
            // @ts-ignore — TextSelection import would add complexity
            view.state.selection.constructor.near(resolvedPos)
          ))
          // Scroll cursor into view
          view.dispatch(view.state.tr.scrollIntoView())
        })
      } catch {
        // Ignore positioning errors
      }
    },

    destroy: () => {
      editor.destroy()
    },
  }
}
