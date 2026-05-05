import { PREVIEW_SHELL_BODY } from './shellBody'
import { PREVIEW_SHELL_HEAD } from './shellHead'
import { PREVIEW_SHELL_RUNTIME } from './shellRuntime'
import { PREVIEW_SHELL_STYLE } from './shellStyle'

export const PREVIEW_SRC_DOC = [
  PREVIEW_SHELL_HEAD,
  PREVIEW_SHELL_STYLE,
  PREVIEW_SHELL_RUNTIME,
  PREVIEW_SHELL_BODY,
].join('')
