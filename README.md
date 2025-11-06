# 协同代码编辑器

基于 Next.js 15 + React 19 + Yjs + Monaco Editor + WebContainer 的实时协同代码编辑器组件。

## 📦 Monorepo 结构

```
collaborative-editor/
├── packages/
│   ├── editor/          # 前端组件包
│   └── server/          # WebSocket 服务器包
├── app/                 # 示例应用
└── components/          # 组件源码
```

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

### 作为 npm 包使用

```bash
# 安装前端组件
pnpm add @collaborative-editor/core

# 安装服务器（开发依赖）
pnpm add -D @collaborative-editor/server
```

```tsx
import { CodeEditor } from '@collaborative-editor/core'

export default function Page() {
  return (
    <CodeEditor
      roomId="my-room"
      user={{ id: 'user-123', name: '张三' }}
      wsUrl={process.env.NEXT_PUBLIC_WS_URL}
      initialFiles={{ 'main.js': 'console.log("Hello")' }}
    />
  )
}
```

### 本地开发

```bash
# 克隆项目
git clone your-repo
cd collaborative-editor

# 安装依赖
pnpm install

# 启动开发（自动启动应用 + WebSocket 服务器）
pnpm dev:all
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
- [x] 用户ID稳定性管理
- [ ] Yjs 协同编辑完善
- [ ] 远程光标显示
- [ ] WebSocket 服务器优化
- [ ] 断线重连机制

## 📦 包说明

### @collaborative-editor/core

前端 React 组件，包含编辑器、协同、终端等核心功能。

### @collaborative-editor/server

WebSocket 服务器，提供协同编辑的实时通信。

```bash
# 启动服务器
npx collab-server start

# 或全局安装
npm install -g @collaborative-editor/server
collab-server start
```

## 📖 文档

查看 [CHANGELOG.md](./docs/CHANGELOG.md) 了解更新日志

## ⚠️ 注意事项

- WebContainer 需要支持 SharedArrayBuffer 的现代浏览器
- 已配置 COOP/COEP 响应头
- 简化版暂不实现预览窗口和开发服务器

## 📄 许可证

MIT

