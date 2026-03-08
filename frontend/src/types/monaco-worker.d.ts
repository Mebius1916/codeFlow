declare module 'monaco-editor/esm/vs/editor/editor.worker?worker' {
  const editorWorkerConstructor: {
    new (): Worker
  }
  export default editorWorkerConstructor
}

declare module 'monaco-editor/esm/vs/language/json/json.worker?worker' {
  const jsonWorkerConstructor: {
    new (): Worker
  }
  export default jsonWorkerConstructor
}

declare module 'monaco-editor/esm/vs/language/css/css.worker?worker' {
  const cssWorkerConstructor: {
    new (): Worker
  }
  export default cssWorkerConstructor
}

declare module 'monaco-editor/esm/vs/language/html/html.worker?worker' {
  const htmlWorkerConstructor: {
    new (): Worker
  }
  export default htmlWorkerConstructor
}

declare module 'monaco-editor/esm/vs/language/typescript/ts.worker?worker' {
  const tsWorkerConstructor: {
    new (): Worker
  }
  export default tsWorkerConstructor
}

export {}

