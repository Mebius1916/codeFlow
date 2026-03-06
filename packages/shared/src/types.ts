export interface CodeEditorUser {
  id: string
  name?: string
  color?: string
}

export interface CodeEditorFeatures {
  terminal?: boolean
  fileTree?: boolean
  fileTreeHeader?: boolean
  toolbar?: boolean
  autoSave?: boolean | number
  preview?: boolean
}

