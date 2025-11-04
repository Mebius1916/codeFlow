# 协同代码编辑器组件

基于 Next.js 15 + React 19 + Yjs + Monaco Editor + WebContainer 的实时协同代码编辑器组件。

## ✨ 特性

- 🎨 Monaco Editor 编辑器 + 语法高亮
- 🤝 Yjs 实时协同编辑 (开发中)
- 📁 文件树管理 (增删改查)
- ▶️ 代码执行 + 终端输出 (WebContainer)
- 🎯 简洁设计,专注核心功能

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

访问 http://localhost:3000

### 生产构建

```bash
pnpm build
pnpm start
```

## 📦 使用方式

```tsx
import { CodeEditor } from '@/components/code-editor'

export default function Page() {
  return (
    <CodeEditor
      roomId="my-room"
      initialFiles={{
        'main.js': 'console.log("Hello World")'
      }}
    />
  )
}
```

## 🛠️ 技术栈

- **框架**: Next.js 15 + React 19
- **编辑器**: Monaco Editor 0.50.x
- **协同**: Yjs 13.6.x (开发中)
- **运行时**: WebContainer API 1.3.x
- **状态管理**: Zustand 4.5.x
- **样式**: TailwindCSS 3.4.x

## 📝 开发进度

- [x] 项目初始化
- [x] Monaco 编辑器集成
- [x] 文件树组件
- [x] 终端输出组件
- [x] WebContainer 代码执行
- [ ] Yjs 协同编辑
- [ ] 远程光标显示
- [ ] WebSocket 服务器
- [ ] 断线重连机制

## 📖 文档

详细文档请查看 [协同代码编辑器组件开发文档.md](./协同代码编辑器组件开发文档.md)

## ⚠️ 注意事项

- WebContainer 需要支持 SharedArrayBuffer 的现代浏览器
- 已配置 COOP/COEP 响应头
- 简化版暂不实现预览窗口和开发服务器

## 📄 许可证

MIT

