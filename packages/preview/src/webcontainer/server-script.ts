import { createServerScript } from './create-server'

export const generateServerScript = (fileTree: Record<string, string>) => {
  const findEntry = () => {
    const paths = Object.keys(fileTree)

    const common = paths.find((path) => path === 'src/index.html')
    if (common) {
      return './' + common
    }

    return null
  }

  const entryPoint = findEntry()

  return createServerScript(entryPoint)
}
