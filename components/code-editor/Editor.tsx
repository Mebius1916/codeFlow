'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import type * as Monaco from 'monaco-editor'
import { useEditorStore } from '@/lib/store'
import { getLanguageFromPath } from '@/lib/utils/file'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-white">
      加载编辑器中...
    </div>
  ),
})

export function Editor() {
  const { activeFile, files, updateFileContent } = useEditorStore()
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null)

  const handleEditorDidMount = (editor: Monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor
  }

  const handleChange = (value: string | undefined) => {
    if (activeFile && value !== undefined) {
      updateFileContent(activeFile, value)
    }
  }

  if (!activeFile) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-gray-400">
        <div className="text-center">
          <p className="text-lg mb-2">欢迎使用代码编辑器</p>
          <p className="text-sm">请通过 initialFiles 属性传入代码文件</p>
        </div>
      </div>
    )
  }

  const content = files[activeFile] || ''
  const language = getLanguageFromPath(activeFile)

  return (
    <MonacoEditor
      height="100%"
      language={language}
      value={content}
      onChange={handleChange}
      onMount={handleEditorDidMount}
      theme="vs-dark"
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'on',
      }}
    />
  )
}

