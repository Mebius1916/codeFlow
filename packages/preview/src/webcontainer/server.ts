import type { WebContainer } from '@webcontainer/api'

export async function spawnServer(
  instance: WebContainer,
  args: {
    onOutput: (data: string) => void
    failFastMs?: number
  },
) {
  const process = await instance.spawn('node', ['server.js'])

  process.output.pipeTo(
    new WritableStream({
      write(data) {
        args.onOutput(String(data))
      },
    }),
  )

  const exitCode = await Promise.race([
    process.exit,
    new Promise<number | null>((resolve) => setTimeout(() => resolve(null), args.failFastMs ?? 2000)),
  ])

  if (exitCode !== null && exitCode !== 0) {
    throw new Error(`Server process exited immediately with code ${exitCode}`)
  }

  return process
}

