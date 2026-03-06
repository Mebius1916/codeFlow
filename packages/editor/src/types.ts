import type { CodeEditorUser } from '@collaborative-editor/shared'

export interface EditorProps {
  roomId: string
  user: CodeEditorUser
  wsUrl?: string
  onSave?: (files: Record<string, string>) => void
}

