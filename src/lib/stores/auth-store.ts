import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { toast } from 'sonner'
import { User, authService } from '../services/auth'

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  login: (email: string, password: string, remember?: boolean) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setToken: (token) => {
        if (token) {
          localStorage.setItem('auth_token', token)
        } else {
          localStorage.removeItem('auth_token')
        }
        set({ token })
      },

      login: async (email, password, remember = false) => {
        try {
          const { user, token } = await authService.login({
            email,
            password,
            remember,
          })
          get().setToken(token)
          get().setUser(user)
          toast.success(`Welcome back, ${user.name}!`)
        } catch (error) {
          throw error
        }
      },

      logout: async () => {
        try {
          await authService.logout()
          toast.success('Logged out successfully')
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          get().setToken(null)
          get().setUser(null)
        }
      },

      checkAuth: async () => {
        const token = localStorage.getItem('auth_token')
        if (!token) {
          set({ isLoading: false, isAuthenticated: false })
          return
        }

        try {
          const user = await authService.me()
          get().setUser(user)
          set({ isLoading: false })
        } catch (error) {
          get().setToken(null)
          get().setUser(null)
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
)
