import type * as Monaco from 'monaco-editor'

export class CursorManager {
  private decorationCollection: Monaco.editor.IEditorDecorationsCollection
  private listener: () => void
  private styleElement: HTMLStyleElement

  constructor(
    private editor: Monaco.editor.IStandaloneCodeEditor,
    private awareness: any,
  ) {
    this.decorationCollection = editor.createDecorationsCollection([])
    this.styleElement = document.createElement('style')
    document.head.appendChild(this.styleElement)

    this.listener = () => this.update()
    this.awareness.on('change', this.listener)
    this.update()
  }

  private update() {
    const states = this.awareness.getStates()
    const clientID = this.awareness.clientID

    const decorations: Monaco.editor.IModelDeltaDecoration[] = []
    let cssRules = ''

    states.forEach((state: any, clientId: number) => {
      if (clientId === clientID) return

      if (state.cursor && state.user) {
        const { color = 'orange', name = `User ${clientId}` } = state.user
        const cursorClassName = `yjs-cursor-${clientId}`
        const safeName = name.replace(/["\\]/g, '\\$&')

        cssRules += `
          .${cursorClassName} {
            position: absolute;
            border-l-left: 2px solid ${color};
            height: 100%;
            box-sizing: border-box;
            z-index: 10;
            margin-left: -1px;
            display: block;
          }
          .${cursorClassName}::after {
            content: "${safeName}";
            position: absolute;
            top: 0;
            left: 2px;
            background-color: ${color};
            color: white;
            font-size: 9px;
            height: 14px;
            line-height: 14px;
            padding: 0 4px;
            border-radius: 2px;
            white-space: nowrap;
            opacity: 0.9;
            pointer-events: none;
            transform: translateY(0);
          }
        `

        decorations.push({
          range: {
            startLineNumber: state.cursor.line,
            startColumn: state.cursor.column,
            endLineNumber: state.cursor.line,
            endColumn: state.cursor.column,
          },
          options: {
            className: cursorClassName,
            hoverMessage: { value: name },
            zIndex: 10,
            isWholeLine: false,
          },
        })
      }
    })

    if (this.styleElement.textContent !== cssRules) {
      this.styleElement.textContent = cssRules
    }
    this.decorationCollection.set(decorations)
  }

  destroy() {
    this.awareness.off('change', this.listener)
    this.decorationCollection.clear()
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement)
    }
  }
}
