'use client'

import { CodeEditor } from "@/components/code-editor"
import { useState } from "react"

// 演示页面：生成会话级别的用户ID
function getDemoUserId() {
  if (typeof window === 'undefined') return 'demo-user'
  
  let userId = sessionStorage.getItem('demo-user-id')
  if (!userId) {
    userId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('demo-user-id', userId)
  }
  return userId
}

export default function Home() {
  const [userId] = useState(getDemoUserId)
  
  return (
    <main className="h-screen w-screen">
      <CodeEditor
        roomId="demo-room"
        user={{
          id: userId,
          name: '演示用户',
        }}
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

