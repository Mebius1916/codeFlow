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

### 基本示例

```tsx
import { CodeEditor } from '@/components/code-editor'

export default function Page() {
  return (
    <CodeEditor
      roomId="my-room"
      initialFiles={{
        'main.js': 'console.log("Hello World")'
      }}
      user={{
        id: 'user-123',      // ⚠️ 重要：应由外部传入稳定的用户ID
        name: '张三',
        color: '#4A90E2'
      }}
    />
  )
}
```

### ⚠️ 用户ID管理

本组件是**可嵌入式组件**，用户身份应该由**宿主应用**管理：

```tsx
function MyApp() {
  // 方案1: 从认证系统获取
  const { userId, userName } = useAuth()
  
  // 方案2: 使用会话存储
  const sessionId = sessionStorage.getItem('user-id') || generateId()
  
  return (
    <CodeEditor
      roomId="room-001"
      user={{ id: userId || sessionId }}
      initialFiles={{ 'main.js': '' }}
    />
  )
}
```

**如果不传入 `user.id`：**
- 组件会生成临时ID（在组件生命周期内稳定）
- 页面刷新后会显示为新用户 ⚠️

详见 [使用指南](./docs/USAGE.md)

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

## 🎁 组件导出

本项目设计为**可嵌入式组件**，支持多种集成方式：

### 当前项目内使用

```tsx
import { CodeEditor } from '@/components/code-editor'
```

### 导出为独立包

```tsx
// 统一入口
import { CodeEditor, type CodeEditorProps } from '@/index'

// 高级用法：分离导出
import { Editor, Terminal, Toolbar } from '@/index'
import { useEditorStore, useCollaborationStore } from '@/index'
```

详见：
- [集成指南](./INTEGRATION.md) - 如何在其他项目中使用
- [业务封装示例](./examples/business-wrapper.tsx) - 实际使用案例

## 📖 文档

- [集成指南](./INTEGRATION.md) - 组件集成方案
- [开发文档](./docs/CHANGELOG.md) - 开发日志

## ⚠️ 注意事项

- WebContainer 需要支持 SharedArrayBuffer 的现代浏览器
- 已配置 COOP/COEP 响应头
- 简化版暂不实现预览窗口和开发服务器

## 📄 许可证

MIT

