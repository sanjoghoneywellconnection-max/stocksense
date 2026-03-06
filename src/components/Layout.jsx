import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useOrg } from '../hooks/useOrg'
import SubscriptionBadge from './SubscriptionBadge'
import {
  LayoutDashboard, Package, AlertTriangle, BarChart3,
  TrendingUp, TrendingDown, Warehouse, ShoppingCart,
  Settings, Menu, X, LogOut, PieChart, User,
  RefreshCw, Lock, Tag, MapPin, ArrowRight,
  ChevronDown, ChevronUp, CheckCircle, Zap, PlayCircle
} from 'lucide-react'

const navItems = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/skus',        icon: Package,         label: 'SKU Explorer' },
  { to: '/reorder',     icon: AlertTriangle,   label: 'Reorder Planner' },
  { to: '/bcg',         icon: BarChart3,       label: 'Portfolio Analysis' },
  { to: '/trends',      icon: TrendingUp,      label: 'Inventory Trends' },
  { to: '/returns',     icon: TrendingDown,    label: 'Returns Analysis' },
  { to: '/categories',  icon: PieChart,        label: 'Category Mix' },
  { to: '/warehouses-map', icon: Warehouse,    label: 'Warehouse Map' },
  { to: '/sales',       icon: ShoppingCart,    label: 'Daily Sales Entry' },
  { to: '/settings',    icon: Settings,        label: 'Master Data' },
]

export default function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { org } = useOrg()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  // Prevent body scroll when sidebar open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  function handleNavClick(to) {
    navigate(to)
    setSidebarOpen(false)
  }

  const SidebarContent = () => (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', padding: '0',
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: '#d63683',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{color: 'white', fontWeight: '800', fontSize: '15px'}}>I</span>
          </div>
          <span style={{color: 'white', fontWeight: '700', fontSize: '17px'}}>InventSight</span>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={() => setSidebarOpen(false)}
          style={{
            display: 'none',
            background: 'rgba(255,255,255,0.1)',
            border: 'none', color: 'white',
            width: '32px', height: '32px',
            borderRadius: '8px', cursor: 'pointer',
            alignItems: 'center', justifyContent: 'center',
          }}
          className="sidebar-close-btn">
          <X size={16} />
        </button>
      </div>

      {/* Org name */}
      {org && (
        <div style={{padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
          <p style={{color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px'}}>
            Organisation
          </p>
          <p style={{color: 'rgba(255,255,255,0.85)', fontSize: '13px', fontWeight: '500', truncate: true}}>
            {org.name}
          </p>
        </div>
      )}

      {/* Nav items */}
      <div style={{flex: 1, overflowY: 'auto', padding: '12px 12px'}}>
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to
          return (
            <button
              key={to}
              onClick={() => handleNavClick(to)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                width: '100%', padding: '11px 12px',
                borderRadius: '12px', border: 'none',
                background: isActive ? 'rgba(214,54,131,0.2)' : 'transparent',
                color: isActive ? 'white' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer', textAlign: 'left',
                marginBottom: '2px',
                transition: 'all 0.15s ease',
                fontSize: '14px', fontWeight: isActive ? '600' : '400',
                borderLeft: isActive ? '3px solid #d63683' : '3px solid transparent',
              }}>
              <Icon size={17} style={{flexShrink: 0}} />
              {label}
            </button>
          )
        })}
      </div>

      {/* Bottom section */}
      <div style={{
        padding: '12px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
        <SubscriptionBadge />

        <button
          onClick={() => handleNavClick('/profile')}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            width: '100%', padding: '10px 12px',
            borderRadius: '12px', border: 'none',
            background: location.pathname === '/profile' ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer', textAlign: 'left',
            fontSize: '14px', marginBottom: '4px',
            transition: 'all 0.15s ease',
          }}>
          <User size={17} style={{flexShrink: 0}} />
          My Profile
        </button>

        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            width: '100%', padding: '10px 12px',
            borderRadius: '12px', border: 'none',
            background: 'transparent',
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer', textAlign: 'left',
            fontSize: '14px',
            transition: 'all 0.15s ease',
          }}>
          <LogOut size={17} style={{flexShrink: 0}} />
          Log Out
        </button>
      </div>
    </div>
  )

  return (
    <div style={{display: 'flex', minHeight: '100vh', background: '#f8f7fc'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

        .text-navy { color: #1e2b71; }

        /* Desktop sidebar */
        .desktop-sidebar {
          width: 240px;
          flex-shrink: 0;
          background: #1e2b71;
          min-height: 100vh;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        /* Mobile sidebar overlay */
        .mobile-overlay {
          display: none;
          position: fixed;
          inset: 0;
          z-index: 200;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(2px);
        }
        .mobile-sidebar-drawer {
          position: fixed;
          top: 0;
          left: 0;
          width: 260px;
          height: 100vh;
          background: #1e2b71;
          z-index: 201;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transform: translateX(-100%);
          transition: transform 0.25s ease;
        }
        .mobile-sidebar-drawer.open {
          transform: translateX(0);
        }

        /* Mobile top bar */
        .mobile-topbar {
          display: none;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          height: 56px;
          background: #1e2b71;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-overlay.open { display: block; }
          .mobile-topbar { display: flex; }
          .sidebar-close-btn { display: flex !important; }
          .main-content { padding: 16px !important; }
        }

        @media (min-width: 769px) {
          .mobile-topbar { display: none !important; }
          .mobile-overlay { display: none !important; }
          .mobile-sidebar-drawer { display: none !important; }
        }

        button:hover { opacity: 0.9; }
      `}</style>

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="desktop-sidebar">
        <SidebarContent />
      </aside>

      {/* ── MOBILE OVERLAY + DRAWER ── */}
      <div
        className={`mobile-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <aside className={`mobile-sidebar-drawer ${sidebarOpen ? 'open' : ''}`}>
        <SidebarContent />
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0}}>

        {/* Mobile top bar */}
        <div className="mobile-topbar">
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none',
              color: 'white', width: '36px', height: '36px',
              borderRadius: '10px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <Menu size={18} />
          </button>

          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '8px',
              background: '#d63683',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{color: 'white', fontWeight: '800', fontSize: '12px'}}>I</span>
            </div>
            <span style={{color: 'white', fontWeight: '700', fontSize: '15px'}}>InventSight</span>
          </div>

          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: '#d63683',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
            onClick={() => handleNavClick('/profile')}>
            <User size={16} color="white" />
          </div>
        </div>

        {/* Page content */}
        <main
          className="main-content"
          style={{
            flex: 1, padding: '28px 28px',
            fontFamily: "'DM Sans', sans-serif",
            maxWidth: '100%', overflowX: 'hidden',
          }}>
          {children}
        </main>
      </div>
    </div>
  )
}