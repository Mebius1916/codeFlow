import { NextRequest } from 'next/server'

/**
 * WebSocket API Route (简化版)
 * 后续实现完整的 Yjs WebSocket 服务器
 */
export async function GET(request: NextRequest) {
  return new Response('WebSocket 服务器开发中', { status: 501 })
}

