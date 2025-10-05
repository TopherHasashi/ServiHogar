import React from 'react'
import { apiGetAuth, clearTokens } from './api'

export type User = {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
}

type AuthContextType = {
  user: User | null
  loading: boolean
  logout: () => void
}

const AuthContext = React.createContext<AuthContextType>({ user: null, loading: true, logout: () => {} })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const u = await apiGetAuth('/api/auth/me/')
        if (!cancelled) setUser(u)
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  function logout() {
    clearTokens()
    setUser(null)
    window.location.href = '/'
  }

  return <AuthContext.Provider value={{ user, loading, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return React.useContext(AuthContext)
}
