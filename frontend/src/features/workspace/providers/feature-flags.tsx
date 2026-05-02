import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'

export interface CodeEditorFeatures {
  fileTree?: boolean
  toolbar?: boolean
}

const defaultFeatures: CodeEditorFeatures = {
  fileTree: false,
  toolbar: false,
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
