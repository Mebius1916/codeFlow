type WorkerConstructor = new () => Worker

let initPromise: Promise<typeof import('monaco-editor')> | null = null

export function initMonaco() {
  if (initPromise) return initPromise

  initPromise = (async () => {
    if (typeof window === 'undefined') {
      throw new Error('initMonaco must be called in a browser environment')
    }

    const [
      monaco,
      editorWorkerModule,
      jsonWorkerModule,
      cssWorkerModule,
      htmlWorkerModule,
      tsWorkerModule,
      reactMonaco,
    ] = await Promise.all([
      import('monaco-editor'),
      import('monaco-editor/esm/vs/editor/editor.worker?worker'),
      import('monaco-editor/esm/vs/language/json/json.worker?worker'),
      import('monaco-editor/esm/vs/language/css/css.worker?worker'),
      import('monaco-editor/esm/vs/language/html/html.worker?worker'),
      import('monaco-editor/esm/vs/language/typescript/ts.worker?worker'),
      import('@monaco-editor/react'),
    ])

    const editorWorker = editorWorkerModule.default as unknown as WorkerConstructor
    const jsonWorker = jsonWorkerModule.default as unknown as WorkerConstructor
    const cssWorker = cssWorkerModule.default as unknown as WorkerConstructor
    const htmlWorker = htmlWorkerModule.default as unknown as WorkerConstructor
    const tsWorker = tsWorkerModule.default as unknown as WorkerConstructor

    ;(globalThis as any).MonacoEnvironment = {
      getWorker(_: unknown, label: string) {
        if (label === 'json') return new jsonWorker()
        if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker()
        if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker()
        if (label === 'typescript' || label === 'javascript') return new tsWorker()
        return new editorWorker()
      },
    }

    reactMonaco.loader.config({ monaco })

    return monaco
  })()

  return initPromise
}
