import SubscriptionBadge from './SubscriptionBadge'
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import {
  LayoutDashboard, Package, Warehouse, ShoppingCart,
  TrendingUp, TrendingDown, AlertTriangle, BarChart3, PieChart, Settings, LogOut, Menu, X, User
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/skus', icon: Package, label: 'SKU Explorer' },
  { to: '/reorder', icon: AlertTriangle, label: 'Reorder Planner' },
  { to: '/bcg', icon: BarChart3, label: 'Portfolio Analysis' },
  { to: '/trends', icon: TrendingUp, label: 'Inventory Trends' },
  { to: '/returns', icon: TrendingDown, label: 'Returns Analysis' },
  { to: '/categories', icon: PieChart, label: 'Category Mix' },
  { to: '/warehouses-map', icon: Warehouse, label: 'Warehouse Map' },
  { to: '/sales', icon: ShoppingCart, label: 'Daily Sales Entry' },
  { to: '/settings', icon: Settings, label: 'Master Data' },
]

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-cream overflow-hidden">

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-navy flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white border-opacity-10">
          <div className="w-9 h-9 bg-pink rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold">S</span>
          </div>
          <span className="text-cream font-bold text-lg">InventSight</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-cream opacity-60 hover:opacity-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive
                  ? 'bg-pink text-white'
                  : 'text-cream text-opacity-70 hover:bg-white hover:bg-opacity-10 hover:text-cream'
                }
              `}
              style={({ isActive }) => ({
                color: isActive ? 'white' : 'rgba(254,254,253,0.65)'
              })}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white border-opacity-10">
          <SubscriptionBadge />
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-white hover:bg-opacity-10 mb-1"
            style={{ color: 'rgba(255,255,255,0.7)' }}>
            <User size={18} />
            My Profile
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-all hover:bg-white hover:bg-opacity-10"
            style={{ color: 'rgba(254,254,253,0.65)' }}
          >
            <LogOut size={18} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-cream border-b px-4 py-3 flex items-center gap-3 flex-shrink-0" style={{ borderColor: '#e8e5f0' }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-navy flex-shrink-0"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-7 h-7 bg-pink rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">I</span>
            </div>
            <span className="font-bold text-navy text-sm">InventSight</span>
          </div>
          <div className="flex-1" />
          <div className="w-8 h-8 bg-pink rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">S</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

    </div>
  )
}