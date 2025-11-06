#!/usr/bin/env node

/**
 * 协同编辑器服务器 CLI
 */

const path = require('path')
const { spawn } = require('child_process')

const command = process.argv[2]

switch (command) {
  case 'start':
    const serverPath = path.join(__dirname, '../src/server.js')
    const child = spawn('node', [serverPath], {
      stdio: 'inherit',
      env: process.env
    })
    
    child.on('error', (error) => {
      console.error('启动服务器失败:', error)
      process.exit(1)
    })
    
    process.on('SIGINT', () => {
      child.kill('SIGINT')
    })
    break
    
  case 'version':
  case '-v':
  case '--version':
    const pkg = require('../package.json')
    console.log(pkg.version)
    break
    
  default:
    console.log(`
协同编辑器 WebSocket 服务器

用法:
  collab-server start     启动服务器
  collab-server version   查看版本

环境变量:
  WS_PORT   端口号 (默认: 1234)
  WS_HOST   监听地址 (默认: localhost)
    `)
}

