import type { WebContainer } from '@webcontainer/api'

export async function spawnServer(
  instance: WebContainer,
  args: {
    onOutput: (data: string) => void
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

  return process
}
