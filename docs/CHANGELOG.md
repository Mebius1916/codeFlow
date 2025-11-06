# 开发日志

## 2025-11-06

### 🏗️ 架构重构：Monorepo

**重大变更**：
- 重构为 Monorepo 结构，支持独立发布两个 npm 包
- `packages/core/`: 前端组件包 (@collaborative-editor/core)
- `packages/server/`: WebSocket 服务器包 (@collaborative-editor/server)
- `example/`: 示例应用（开发和演示用）

**修复**：
- ✅ 修复用户ID每次刷新都新增的问题
- ✅ 明确参数边界（user.id 改为必需参数）
- ✅ 移除组件内部的持久化逻辑（应由宿主应用管理）
- ✅ 修复 React key 冲突（使用 clientID 而非 userId）
- ✅ 优化 WebSocket 服务器（监听 0.0.0.0，支持外网访问）

**优化**：
- 删除所有冗余代码和空目录
- 统一导入路径为相对路径
- 更新 Tailwind 配置扫描路径
- 配置 pnpm workspace

**类型定义**：
```typescript
interface User {
  id: string      // clientID（唯一）
  userId?: string // 真实用户ID（可选）
  name: string
  color: string
}
```

**API 变更**：
```typescript
// user.id 现在是必需参数
<CodeEditor
  roomId="room-123"
  user={{ id: 'user-1' }}  // id 必需
  wsUrl="ws://localhost:8848"
/>
```

---

## [0.2.0] - 2025-11-05

### ✨ 协同编辑功能

#### Yjs 集成
- ✅ **createYjsProvider** - WebSocket Provider 封装
  - 自动连接管理
  - 用户信息同步到 Awareness
  - 随机颜色生成
- ✅ **createMonacoBinding** - Monaco 和 Yjs 绑定
  - y-monaco 自动同步编辑内容
  - 光标位置同步
  - 选区同步

#### WebSocket 服务器
- ✅ **独立 WebSocket 服务器** (`server/collaboration.js`)
  - 基于 y-websocket 官方实现
  - 默认端口 1234
  - 支持多房间隔离
  - 自动清理断开连接
  - 优雅关闭处理

#### 协同功能
- ✅ **实时编辑同步** - 多用户同时编辑，CRDT 冲突解决
- ✅ **用户 Awareness** - 显示在线用户列表和颜色
- ✅ **光标同步** - 实时同步光标位置和选区
- ✅ **连接状态指示器** - 显示连接/连接中/断开状态
- ✅ **房间隔离** - 通过 roomId 隔离不同会话
- ✅ **自动重连** - y-websocket 内置断线重连

#### UI 更新
- ✅ **UserCursors 组件** - 显示在线用户列表
  - 当前用户标识
  - 用户颜色显示
  - 实时更新
- ✅ **Toolbar 连接状态** - 实时显示连接状态和在线人数
  - 绿色: 已连接
  - 黄色: 连接中
  - 红色: 未连接

#### 文档
- ✅ **协同编辑使用指南** (`docs/collaboration-guide.md`)
  - 快速开始
  - 架构说明
  - 数据同步流程
  - 配置选项
  - 常见问题

#### 脚本命令
- ✅ `pnpm ws` - 启动 WebSocket 服务器
- ✅ `pnpm dev:all` - 同时启动 Next.js 和 WebSocket

### 🎯 功能状态更新

#### ✅ 已实现
- [x] Monaco 编辑器集成
- [x] 代码执行 (Node.js)
- [x] 终端输出 (实时)
- [x] 状态管理 (Zustand)
- [x] **Yjs 协同编辑** ⭐新增
- [x] **WebSocket 服务器** ⭐新增
- [x] **在线用户列表** ⭐新增
- [x] **连接状态指示** ⭐新增
- [x] **自动重连** ⭐新增

---

## [0.1.0] - 2025-11-04

### ✨ 初始版本

#### 项目初始化
- ✅ 创建 Next.js 15 + React 19 + TypeScript 项目
- ✅ 配置 TailwindCSS 3.4.18
- ✅ 配置 TypeScript 严格模式
- ✅ 配置 COOP/COEP 响应头 (支持 WebContainer)
- ✅ 配置路径别名 @/*

#### 依赖安装
- ✅ Monaco Editor 0.50.0
- ✅ @monaco-editor/react 4.7.0
- ✅ Yjs 13.6.27
- ✅ y-websocket 2.1.0
- ✅ y-monaco 0.1.6
- ✅ y-protocols 1.0.6
- ✅ @webcontainer/api 1.6.1
- ✅ Zustand 4.5.7

#### 核心组件实现
- ✅ **CodeEditor** - 主组件,统一导出
- ✅ **Editor** - Monaco 编辑器包装
  - 动态导入,禁用 SSR
  - 语法高亮
  - 自动布局
- ✅ **Terminal** - 终端输出组件
  - 实时显示 stdout/stderr/system
  - 自动滚动到底部
  - 清空按钮
  - 限制最多 1000 行
- ✅ **Toolbar** - 工具栏组件
  - 运行按钮
  - 在线用户数显示
  - 连接状态指示器

#### 状态管理
- ✅ **editorStore** - 编辑器状态
  - 文件打开/关闭/切换
  - 文件内容管理
  - 活动文件追踪
- ✅ **collaborationStore** - 协同状态 (骨架)
  - yDoc 实例管理
  - 用户列表
  - 连接状态
- ✅ **runtimeStore** - 运行时状态
  - WebContainer 实例
  - 终端输出管理
  - 进程状态追踪
- ✅ **uiStore** - UI 状态
  - 面板可见性控制
  - 主题配置
  - 布局尺寸

#### 工具函数
- ✅ **colors.ts** - 颜色工具
  - 用户颜色生成
  - 颜色格式转换
- ✅ **file.ts** - 文件工具
  - 语言检测
  - 文件树构建

#### WebContainer 集成
- ✅ **execute.ts** - 代码执行
  - WebContainer 启动和管理
  - 文件系统同步
  - Node.js 脚本执行
  - stdout/stderr 捕获
  - 执行时间统计
  - 错误处理

#### 类型定义
- ✅ **editor.ts** - 编辑器类型
- ✅ **collaboration.ts** - 协同类型
- ✅ **webcontainer.ts** - WebContainer 类型

#### 文档
- ✅ README.md - 项目说明
- ✅ 项目结构说明.md - 详细结构
- ✅ 快速开始指南.md - 开发指南
- ✅ CHANGELOG.md - 开发日志

### 🎯 功能特性

#### ✅ 已实现
- [x] Monaco 编辑器集成
- [x] 代码执行 (Node.js)
- [x] 终端输出 (实时)
- [x] 状态管理 (Zustand)

#### 🚧 开发中
- [ ] 文件增删改
- [ ] 快捷键支持
- [ ] 主题切换
- [ ] 面板调整

---

