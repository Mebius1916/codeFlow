import { createContext, useContext, useMemo } from 'react'
import type { CodeEditorProps } from '../../components/types/types'

type Features = NonNullable<CodeEditorProps['features']>

const defaultFeatures: Features = {
  terminal: false,
  fileTree: false,
  fileTreeHeader: true,
  toolbar: false,
  autoSave: false,
}

const FeatureContext = createContext<Features>(defaultFeatures)

export function FeatureProvider({
  features,
  children,
}: {
  features?: Features
  children: React.ReactNode
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
