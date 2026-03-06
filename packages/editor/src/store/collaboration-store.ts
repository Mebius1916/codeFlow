import { create } from 'zustand'
import type { StateCreator } from 'zustand'
import type * as Y from 'yjs'
import type { User, ConnectionStatus } from '../types/collaboration'

interface CollaborationState {
  yDoc: Y.Doc | null
  users: User[]
  connectionStatus: ConnectionStatus
  currentUser: User | null

  setYDoc: (doc: Y.Doc) => void
  setUsers: (users: User[]) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  setCurrentUser: (user: User) => void
  updateUserCursor: (userId: string, cursor: User['cursor']) => void
}

const createState: StateCreator<CollaborationState> = (set) => ({
  yDoc: null,
  users: [],
  connectionStatus: 'disconnected',
  currentUser: null,

  setYDoc: (doc: Y.Doc) => {
    set({ yDoc: doc })
  },

  setUsers: (users: User[]) => {
    set({ users })
  },

  setConnectionStatus: (status: ConnectionStatus) => {
    set({ connectionStatus: status })
  },

  setCurrentUser: (user: User) => {
    set({ currentUser: user })
  },

  updateUserCursor: (userId: string, cursor: User['cursor']) => {
    set((state) => ({
      users: state.users.map((item) => (item.id === userId ? { ...item, cursor } : item)),
    }))
  },
})

export const useCollaborationStore = create<CollaborationState>(createState)
