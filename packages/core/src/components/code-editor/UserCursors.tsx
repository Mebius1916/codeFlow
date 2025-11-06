'use client'

import { useCollaborationStore } from '../../lib/store'

/**
 * 用户光标显示组件（简化版）
 * 显示在线用户列表和颜色
 */
export function UserCursors() {
  const { users, currentUser } = useCollaborationStore()

  if (users.length === 0) return null

  return (
    <div className="absolute top-2 right-2 bg-[#2d2d30] border border-gray-600 rounded-lg p-2 shadow-lg">
      <div className="text-xs text-gray-300 mb-1 font-medium">在线用户</div>
      <div className="space-y-1">
        {currentUser && (
          <div className="flex items-center gap-2 text-xs">
            <div 
              className="w-3 h-3 rounded-full border border-white"
              style={{ backgroundColor: currentUser.color }}
            />
            <span className="text-gray-400">{currentUser.name} (你)</span>
          </div>
        )}
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-2 text-xs">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: user.color }}
            />
            <span className="text-gray-300">{user.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

