// 协同状态存储
import { create } from 'zustand'
import type * as Y from 'yjs'
import type { User, ConnectionStatus } from '../../types/collaboration'

interface CollaborationState {
  // 状态
  yDoc: Y.Doc | null
  users: User[]
  connectionStatus: ConnectionStatus
  currentUser: User | null
  
  // 动作
  setYDoc: (doc: Y.Doc) => void
  setUsers: (users: User[]) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  setCurrentUser: (user: User) => void
  updateUserCursor: (userId: string, cursor: User['cursor']) => void
}

export const useCollaborationStore = create<CollaborationState>((set) => ({
  // 初始状态
  yDoc: null,
  users: [],
  connectionStatus: 'disconnected',
  currentUser: null,

  // 设置 Yjs 文档
  setYDoc: (doc: Y.Doc) => {
    set({ yDoc: doc })
  },

  // 设置用户列表
  setUsers: (users: User[]) => {
    set({ users })
  },

  // 设置连接状态
  setConnectionStatus: (status: ConnectionStatus) => {
    set({ connectionStatus: status })
  },

  // 设置当前用户
  setCurrentUser: (user: User) => {
    set({ currentUser: user })
  },

  // 更新用户光标
  updateUserCursor: (userId: string, cursor: User['cursor']) => {
    set((state) => ({
      users: state.users.map(u => 
        u.id === userId ? { ...u, cursor } : u
      ),
    }))
  },
}))

