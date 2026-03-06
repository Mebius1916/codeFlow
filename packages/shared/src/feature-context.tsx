import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { CodeEditorFeatures } from './types'

const defaultFeatures: CodeEditorFeatures = {
  terminal: false,
  fileTree: false,
  fileTreeHeader: true,
  toolbar: false,
  autoSave: false,
  preview: false,
}

const FeatureContext = createContext<CodeEditorFeatures>(defaultFeatures)

export function FeatureProvider({
  features,
  children,
}: {
  features?: CodeEditorFeatures
  children: ReactNode
}) {
  const value = useMemo(() => ({ ...defaultFeatures, ...features }), [features])

  return (
    <FeatureContext.Provider value={value}>
      {children}
    </FeatureContext.Provider>
  )
}

export function useFeatures() {
  const context = useContext(FeatureContext)
  if (!context) {
    throw new Error('useFeatures must be used within a FeatureProvider')
  }
  return context
}
