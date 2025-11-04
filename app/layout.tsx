import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "协同代码编辑器",
  description: "基于 Next.js + Yjs + Monaco 的实时协同代码编辑器组件",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  )
}

