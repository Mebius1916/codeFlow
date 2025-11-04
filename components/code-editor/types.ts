export interface CodeEditorProps {
  roomId: string
  initialFiles?: Record<string, string>
  readOnly?: boolean
  theme?: 'light' | 'dark'
  height?: string | number
  onSave?: (files: Record<string, string>) => void
  onError?: (error: Error) => void
  user?: {
    id?: string
    name?: string
  }
}

