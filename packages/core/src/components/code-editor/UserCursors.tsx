'use client'

import { useCollaborationStore } from '../../lib/store'

/**
 * 用户光标显示组件（简化版）
 * 显示在线用户列表和颜色
 */
export function UserCursors() {
  const { users, currentUser } = useCollaborationStore()
  console.log(users);
  if (users.length === 0) return null

  return (
    <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm border border-white/10 rounded-xl p-3 shadow-xl shadow-black/50 z-20 min-w-[160px] transition-all hover:bg-black/90">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <div className="text-xs font-semibold text-gray-300 uppercase tracking-wider">在线协作 ({users.length})</div>
      </div>
      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
        {currentUser && (
          <div className="flex items-center gap-2 text-xs group">
            <div 
              className="w-4 h-4 rounded-full border border-white/50 shadow-sm flex items-center justify-center text-[10px] font-bold text-white/90"
              style={{ backgroundColor: currentUser.color }}
            >
              {currentUser.name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-gray-300 font-medium group-hover:text-white transition-colors">{currentUser.name} <span className="text-gray-500 font-normal">(你)</span></span>
          </div>
        )}
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-2 text-xs group">
            <div 
              className="w-4 h-4 rounded-full border border-transparent shadow-sm flex items-center justify-center text-[10px] font-bold text-white/90"
              style={{ backgroundColor: user.color }}
            >
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-gray-400 group-hover:text-gray-200 transition-colors">{user.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

