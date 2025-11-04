import { CodeEditor } from "@/components/code-editor"

export default function Home() {
  return (
    <main className="h-screen w-screen">
      <CodeEditor
        roomId="demo-room"
        initialFiles={{
          "main.js": `// 欢迎使用协同代码编辑器
const arr = [1, 2, 2, 3, 3, 4]
const unique = [...new Set(arr)]
console.log(unique)
`,
        }}
      />
    </main>
  )
}

