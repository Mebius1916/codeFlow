import type { WebContainer } from '@webcontainer/api'

interface SpawnServerOptions {
  onOutput: (data: string) => void
}

export async function spawnServer(
  instance: WebContainer,
  args: SpawnServerOptions,
) {
  const process = await instance.spawn('node', ['server.js'])

  process.output.pipeTo(
    new WritableStream({
      write(data) {
        args.onOutput(String(data))
      },
    }),
  )

  return process
}
