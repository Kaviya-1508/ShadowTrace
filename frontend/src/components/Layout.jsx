import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, User, Globe, Wifi, GitBranch,
  Clock, LogOut, Menu, X, Shield, ChevronRight
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/username', icon: User, label: 'Username Intel' },
  { path: '/domain', icon: Globe, label: 'Domain Intel' },
  { path: '/ip', icon: Wifi, label: 'IP Intel' },
  { path: '/graph', icon: GitBranch, label: 'Relationship Graph' },
  { path: '/history', icon: Clock, label: 'History' }
]

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    toast.success('Session terminated')
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-dark-900 bg-grid flex">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-64 glass border-r border-cyan-500/10 z-40 flex flex-col"
          >
            {/* Logo */}
            <div className="p-6 border-b border-cyan-500/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center animate-glow">
                  <Shield size={18} className="text-cyan-400" />
                </div>
                <div>
                  <h1 className="font-mono font-bold text-white text-sm tracking-wider">SHADOWTRACE</h1>
                  <p className="text-cyan-500 text-xs font-mono">NEXUS v1.0</p>
                </div>
              </div>
            </div>

            {/* User */}
            <div className="px-4 py-3 border-b border-cyan-500/10">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-cyan-500/5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user?.username}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-1">
              {navItems.map((item) => {
                const active = location.pathname === item.path
                return (
                  <motion.button
                    key={item.path}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                      active
                        ? 'text-cyan-400 bg-cyan-400/10 border border-cyan-400/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <item.icon size={16} />
                    <span>{item.label}</span>
                    {active && <ChevronRight size={14} className="ml-auto" />}
                  </motion.button>
                )
              })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-cyan-500/10">
              <motion.button
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-all duration-200"
              >
                <LogOut size={16} />
                <span>Terminate Session</span>
              </motion.button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Topbar */}
        <header className="sticky top-0 z-30 glass border-b border-cyan-500/10 px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 transition-all"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span>SYSTEM ONLINE</span>
          </div>
          <div className="ml-auto text-xs font-mono text-slate-600">
            {new Date().toLocaleTimeString('en-US', { hour12: false })}
          </div>
        </header>

        {/* Page content */}
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6"
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}
