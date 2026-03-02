import Landing from './pages/Landing'
import Subscribe from './pages/Subscribe'
import PaywallBlur from './components/PaywallBlur'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useOrg } from './hooks/useOrg'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Onboarding from './pages/onboarding/Onboarding'
import Settings from './pages/Settings'
import SalesEntry from './pages/SalesEntry'
import ComingSoon from './pages/placeholders/ComingSoon'
import SkuExplorer from './pages/SkuExplorer'
import ReorderPlanner from './pages/ReorderPlanner'
import PortfolioAnalysis from './pages/PortfolioAnalysis'
import InventoryTrends from './pages/InventoryTrends'
import WarehouseMap from './pages/WarehouseMap'
import ReturnsAnalysis from './pages/ReturnsAnalysis'
import CategoryContribution from './pages/CategoryContribution'
import Profile from './pages/Profile'
import ResetPassword from './pages/ResetPassword'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsConditions from './pages/TermsConditions'

function Spinner() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-pink border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

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

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      <Route path="/dashboard" element={<OrgRoute><Dashboard /></OrgRoute>} />
      <Route path="/subscribe" element={<OrgRoute><Subscribe /></OrgRoute>} />
      <Route path="/settings" element={<OrgRoute><Settings /></OrgRoute>} />
      <Route path="/sales" element={<OrgRoute><SalesEntry /></OrgRoute>} />
      <Route path="/skus" element={<OrgRoute><PaywallBlur><SkuExplorer /></PaywallBlur></OrgRoute>} />
      <Route path="/reorder" element={<OrgRoute><PaywallBlur><ReorderPlanner /></PaywallBlur></OrgRoute>} />
      <Route path="/bcg" element={<OrgRoute><PaywallBlur><PortfolioAnalysis /></PaywallBlur></OrgRoute>} />
      <Route path="/trends" element={<OrgRoute><PaywallBlur><InventoryTrends /></PaywallBlur></OrgRoute>} />
      <Route path="/returns" element={<OrgRoute><PaywallBlur><ReturnsAnalysis /></PaywallBlur></OrgRoute>} />
      <Route path="/categories" element={<OrgRoute><PaywallBlur><CategoryContribution /></PaywallBlur></OrgRoute>} />
      <Route path="/warehouses-map" element={<OrgRoute><PaywallBlur><WarehouseMap /></PaywallBlur></OrgRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/profile" element={<OrgRoute><Profile /></OrgRoute>} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsConditions />} />
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