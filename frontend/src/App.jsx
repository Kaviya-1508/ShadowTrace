import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import UsernameIntel from './pages/UsernameIntel'
import DomainIntel from './pages/DomainIntel'
import IPIntel from './pages/IPIntel'
import RelationshipGraph from './pages/RelationshipGraph'
import History from './pages/History'
import Layout from './components/Layout'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="spinner" />
    </div>
  )
  return user ? children : <Navigate to="/login" />
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/username" element={<ProtectedRoute><Layout><UsernameIntel /></Layout></ProtectedRoute>} />
      <Route path="/domain" element={<ProtectedRoute><Layout><DomainIntel /></Layout></ProtectedRoute>} />
      <Route path="/ip" element={<ProtectedRoute><Layout><IPIntel /></Layout></ProtectedRoute>} />
      <Route path="/graph" element={<ProtectedRoute><Layout><RelationshipGraph /></Layout></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><Layout><History /></Layout></ProtectedRoute>} />
      {/* FIX: Catch-all — unknown routes redirect to home instead of blank screen */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0a0f1e',
              color: '#e2e8f0',
              border: '1px solid rgba(34,211,238,0.2)',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px'
            },
            success: { iconTheme: { primary: '#22d3ee', secondary: '#030712' } },
            error: { iconTheme: { primary: '#f87171', secondary: '#030712' } }
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  )
}
