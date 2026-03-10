import type * as Monaco from 'monaco-editor'
import { useEditorStore } from '@collaborative-editor/shared'
import { getLanguageFromPath } from '../lib/utils/file'
import type { Ref } from './monacoBindingCleanup'

export const getOrCreateModel = (monaco: typeof import('monaco-editor'), modelRef: Ref<Monaco.editor.ITextModel | null>) => {
  let model = modelRef.current
  if (!model) {
    const uri = monaco.Uri.parse('file:///__codeflow_single__')
    const existingModel = monaco.editor.getModel(uri)
    model = existingModel ?? monaco.editor.createModel('', undefined, uri)
    modelRef.current = model
  }
  return model
}

export const attachModelToEditor = (
  monaco: typeof import('monaco-editor'),
  editor: Monaco.editor.IStandaloneCodeEditor,
  model: Monaco.editor.ITextModel,
  filePath: string,
) => {
  monaco.editor.setModelLanguage(model, getLanguageFromPath(filePath))
  editor.setModel(model)
  model.updateOptions({
    tabSize: 2,
    insertSpaces: true,
  })
  const domNode = editor.getDomNode()
  if (domNode) {
    editor.layout()
  }
}

export const setModelFromStore = (model: Monaco.editor.ITextModel, filePath: string) => {
  const snapshotContent = useEditorStore.getState().files[filePath]
  if (typeof snapshotContent === 'string' && snapshotContent) {
    model.setValue(snapshotContent)
  } else {
    model.setValue('')
  }
}
