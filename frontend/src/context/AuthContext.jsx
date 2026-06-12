import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // FIX: Wrap localStorage access in try/catch — corrupted data must not freeze loading state
    try {
      const token = localStorage.getItem('st_token')
      const userData = localStorage.getItem('st_user')
      if (token && userData) {
        setUser(JSON.parse(userData))
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }
    } catch {
      // Corrupted storage — clear it and start fresh
      localStorage.removeItem('st_token')
      localStorage.removeItem('st_user')
    } finally {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { token, user } = res.data
    localStorage.setItem('st_token', token)
    localStorage.setItem('st_user', JSON.stringify(user))
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(user)
    return user
  }

  const register = async (username, email, password) => {
    const res = await api.post('/auth/register', { username, email, password })
    const { token, user } = res.data
    localStorage.setItem('st_token', token)
    localStorage.setItem('st_user', JSON.stringify(user))
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(user)
    return user
  }

  const logout = () => {
    localStorage.removeItem('st_token')
    localStorage.removeItem('st_user')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
