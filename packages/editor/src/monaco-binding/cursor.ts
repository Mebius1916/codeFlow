import type * as Monaco from 'monaco-editor'
import { Awareness } from 'y-protocols/awareness'

export class CursorManager {
  private decorationCollection: Monaco.editor.IEditorDecorationsCollection
  private styleElement: HTMLStyleElement
  private awareness: Awareness

  constructor(
    editor: Monaco.editor.IStandaloneCodeEditor,
    awareness: Awareness,
  ) {
    this.editor = editor
    this.awareness = awareness
    this.decorationCollection = editor.createDecorationsCollection()
    
    this.styleElement = document.createElement('style')
    document.head.appendChild(this.styleElement)

    this.awareness.on('change', this.update)
    // 立即执行一次
    this.update()
  }

  private update = () => {
    const states = this.awareness.getStates()
    const clientID = this.awareness.clientID

    const decorations: Monaco.editor.IModelDeltaDecoration[] = []
    let cssRules = ''

    states.forEach((state: any, clientId: number) => {
      // 忽略自己
      if (clientId === clientID) return
      // 忽略没有 user 信息或 cursor 信息的
      if (!state.user || !state.cursor) return
      
      const { name, color } = state.user
      const { line, column } = state.cursor
      
      // 生成唯一的 class name
      const className = `yRemoteCursor-${clientId}`
      const safeColor = color || '#f90'
      const safeName = (name || `User ${clientId}`).replace(/["\\]/g, '\\$&')

      // 添加 CSS 规则
      cssRules += `
        .${className} {
          position: absolute;
          background-color: ${safeColor};
          width: 2px !important; 
          height: 100%;
          z-index: 20;
          box-sizing: border-box;
        }
        .${className}::after {
          content: "${safeName}";
          position: absolute;
          top: -14px;
          left: -2px;
          background-color: ${safeColor};
          color: white;
          font-size: 10px;
          line-height: 14px;
          padding: 0 4px;
          border-radius: 2px;
          white-space: nowrap;
          pointer-events: none;
        }
      `

      // 添加 decoration
      const range = {
        startLineNumber: line,
        startColumn: column,
        endLineNumber: line,
        endColumn: column,
      }
      
      decorations.push({
        range,
        options: {
          className: className,
          isWholeLine: false,
          hoverMessage: { value: `Cursor: ${safeName}` },
        },
      })
    })

    if (this.styleElement.textContent !== cssRules) {
      this.styleElement.textContent = cssRules
    }
    
    // 应用到编辑器
    this.decorationCollection.set(decorations)
  }

  private editor: Monaco.editor.IStandaloneCodeEditor

  destroy() {
    this.awareness.off('change', this.update)
    this.decorationCollection.clear()
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement)
    }
  }
}
