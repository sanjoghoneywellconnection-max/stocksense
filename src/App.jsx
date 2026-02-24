import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useOrg } from './hooks/useOrg'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Onboarding from './pages/onboarding/Onboarding'
import Settings from './pages/Settings'
import SalesEntry from './pages/SalesEntry'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return user ? children : <Navigate to="/login" />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return !user ? children : <Navigate to="/dashboard" />
}

function OrgRoute({ children }) {
  const { user, loading: authLoading } = useAuth()
  const { org, loading: orgLoading } = useOrg()

  if (authLoading || orgLoading) return <Spinner />
  if (!user) return <Navigate to="/login" />
  if (!org) return <Navigate to="/onboarding" />
  return children
}

function Spinner() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-pink border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      <Route path="/dashboard" element={<OrgRoute><Dashboard /></OrgRoute>} />
      <Route path="/settings" element={<OrgRoute><Settings /></OrgRoute>} />
      <Route path="/sales" element={<OrgRoute><SalesEntry /></OrgRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}