#!/usr/bin/env node

/**
 * Yjs WebSocket 服务器
 * 独立运行，提供协同编辑的 WebSocket 服务
 * 
 * 运行方式：node server/collaboration.js
 */

const WebSocket = require('ws')
const http = require('http')
const { setupWSConnection } = require('y-websocket/bin/utils')

const PORT = process.env.WS_PORT || 8848
const HOST = '0.0.0.0'  // 监听所有网络接口，部署后自动可外网访问

// 创建 HTTP 服务器
const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' })
  response.end('Yjs WebSocket Server')
})

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ server })

wss.on('connection', (ws, req) => {
  setupWSConnection(ws, req) // 广播消息
  console.log(`[${new Date().toLocaleTimeString()}] 新连接: ${req.url}`)
})

wss.on('error', (error) => {
  console.error('WebSocket 服务器错误:', error)
})

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n❌ 端口 ${PORT} 已被占用！`)
    console.error(`\n解决方法：`)
    console.error(`  1. 关闭占用端口的进程: netstat -ano | findstr :${PORT}`)
    console.error(`  2. 或修改端口: set WS_PORT=1235 && node server/collaboration.js`)
    console.error(``)
    process.exit(1)
  } else {
    console.error('服务器错误:', error)
    process.exit(1)
  }
})

server.listen(PORT, HOST, () => {
  console.log(`✓ Yjs WebSocket 服务器运行在 ws://${HOST}:${PORT}`)
  console.log('  按 Ctrl+C 停止服务器')
})

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...')
  wss.close(() => {
    server.close(() => {
      console.log('服务器已关闭')
      process.exit(0)
    })
  })
})

