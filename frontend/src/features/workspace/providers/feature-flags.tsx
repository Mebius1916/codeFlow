import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'

export interface CodeEditorFeatures {
  terminal?: boolean
  fileTree?: boolean
  fileTreeHeader?: boolean
  toolbar?: boolean
  autoSave?: boolean | number
  preview?: boolean
}

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
  const value = { ...defaultFeatures, ...features }

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
