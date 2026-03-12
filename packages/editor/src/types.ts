import type { CodeEditorUser } from '@collaborative-editor/shared'

export interface EditorProps {
  roomId: string
  user: CodeEditorUser
  wsUrl?: string
  initialFiles?: Record<string, string | Uint8Array>
  collaborationEnabled?: boolean
}
