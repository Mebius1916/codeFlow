import type * as Monaco from 'monaco-editor'

/**
 * 管理多人协作光标和名字标签
 * 使用 Monaco Decoration 和 CSS 伪元素实现，移除复杂的 DOM Widget 操作
 */
export class CursorManager {
  private decorationCollection: Monaco.editor.IEditorDecorationsCollection
  private listener: () => void
  private styleElement: HTMLStyleElement

  constructor(
    private editor: Monaco.editor.IStandaloneCodeEditor,
    private awareness: any
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
      if (clientId === clientID) return // 忽略自己

      if (state.cursor && state.user) {
        const { color = 'orange', name = `User ${clientId}` } = state.user
        const cursorClassName = `yjs-cursor-${clientId}`
        
        // 生成 CSS 规则
        // 1. 光标竖线 (直接作用于 decoration 元素)
        // 2. 名字标签 (使用 ::after 伪元素)
        // 注意：content 属性的值必须用引号包围
        const safeName = name.replace(/["\\]/g, '\\$&')
        
        cssRules += `
          .${cursorClassName} {
            position: absolute;
            border-left: 2px solid ${color};
            height: 100%;
            box-sizing: border-box;
            z-index: 10;
            margin-left: -1px;
            display: block; /* 确保空 Range 可见 */
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
            transform: translateY(-100%); /* 默认在上方 */
          }
          /* 当光标在第一行时，标签显示在下方，避免被遮挡 (可选优化，暂统一显示在上方或并排) */
          /* 这里响应用户之前的需求：并排显示 */
          .${cursorClassName}::after {
            transform: translateY(0); /* 并排显示 */
          }
        `
        
        decorations.push({
          range: {
            startLineNumber: state.cursor.line,
            startColumn: state.cursor.column,
            endLineNumber: state.cursor.line,
            endColumn: state.cursor.column
          },
          options: {
            className: cursorClassName,
            hoverMessage: { value: name },
            zIndex: 10,
            isWholeLine: false
          }
        })
      }
    })

    // 批量更新 CSS 和 Decorations
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
