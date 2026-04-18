import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { RefreshCw, LogOut, Users, TrendingUp, CreditCard, Activity } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts'
import AdminAffiliates from './AdminAffiliates'

const COLORS = ['#d63683', '#1e2b71', '#0f9b58', '#d97706', '#7c3aed', '#0891b2']

const TABS = [
  { id: 'overview',    label: '📊 Overview' },
  { id: 'affiliates',  label: '🤝 Affiliates', highlight: true },
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalOrgs: 0,
    activeOrgs30d: 0,
    activeOrgs7d: 0,
    trialOrgs: 0,
    activeSubscriptions: 0,
    expiredSubscriptions: 0,
    totalSkus: 0,
    totalSalesEntries: 0,
    mrr: 0,
  })
  const [signupCohort, setSignupCohort] = useState([])
  const [topOrgs, setTopOrgs] = useState([])
  const [dailyActivity, setDailyActivity] = useState([])

  useEffect(() => {
    if (sessionStorage.getItem('inventsight_admin') !== 'true') {
      navigate('/admin-inventsight-2026')
      return
    }
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    await Promise.all([
      fetchStats(),
      fetchSignupCohort(),
      fetchTopOrgs(),
      fetchDailyActivity(),
    ])
    setLoading(false)
  }

  async function fetchStats() {
    const now = new Date()
    const ago30 = new Date(now - 30 * 86400000).toISOString().split('T')[0]
    const ago7 = new Date(now - 7 * 86400000).toISOString().split('T')[0]

    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, created_at')

    const { data: subs } = await supabase
      .from('subscriptions')
      .select('status, amount_paid, current_period_end')

    const { data: active30 } = await supabase
      .from('daily_sales')
      .select('org_id')
      .gte('sale_date', ago30)

    const { data: active7 } = await supabase
      .from('daily_sales')
      .select('org_id')
      .gte('sale_date', ago7)

    const { data: skus } = await supabase
      .from('skus')
      .select('id')
      .eq('is_active', true)

    const { data: salesEntries } = await supabase
      .from('daily_sales')
      .select('id')

    const uniqueActive30 = new Set(active30?.map(r => r.org_id) || []).size
    const uniqueActive7 = new Set(active7?.map(r => r.org_id) || []).size

    const trialOrgs = subs?.filter(s => s.status === 'trial').length || 0
    const activeOrgs = subs?.filter(s => s.status === 'active').length || 0
    const expiredOrgs = subs?.filter(s => s.status === 'expired').length || 0
    const mrr = activeOrgs * 9999

    setStats({
      totalOrgs: orgs?.length || 0,
      activeOrgs30d: uniqueActive30,
      activeOrgs7d: uniqueActive7,
      trialOrgs,
      activeSubscriptions: activeOrgs,
      expiredSubscriptions: expiredOrgs,
      totalSkus: skus?.length || 0,
      totalSalesEntries: salesEntries?.length || 0,
      mrr,
    })
  }

  async function fetchSignupCohort() {
    const { data } = await supabase
      .from('organizations')
      .select('created_at')
      .order('created_at', { ascending: true })

    if (!data) return

    const byWeek = {}
    data.forEach(org => {
      const d = new Date(org.created_at)
      const weekStart = new Date(d)
      weekStart.setDate(d.getDate() - d.getDay())
      const key = weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      byWeek[key] = (byWeek[key] || 0) + 1
    })

    setSignupCohort(Object.entries(byWeek).map(([week, count]) => ({ week, count })))
  }

  async function fetchTopOrgs() {
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(20)

    if (!orgs) return

    const enriched = await Promise.all(orgs.map(async org => {
      const { data: skus } = await supabase
        .from('skus')
        .select('id')
        .eq('org_id', org.id)
        .eq('is_active', true)

      const { data: sales } = await supabase
        .from('daily_sales')
        .select('id, sale_date')
        .eq('org_id', org.id)
        .order('sale_date', { ascending: false })
        .limit(1)

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('status, trial_ends_at')
        .eq('org_id', org.id)
        .single()

      return {
        ...org,
        skuCount: skus?.length || 0,
        lastActive: sales?.[0]?.sale_date || null,
        subStatus: sub?.status || 'none',
        trialEnds: sub?.trial_ends_at,
      }
    }))

    setTopOrgs(enriched)
  }

  async function fetchDailyActivity() {
    const since = new Date()
    since.setDate(since.getDate() - 30)
    const sinceStr = since.toISOString().split('T')[0]

    const { data } = await supabase
      .from('daily_sales')
      .select('sale_date, org_id')
      .gte('sale_date', sinceStr)
      .order('sale_date', { ascending: true })

    if (!data) return

    const byDate = {}
    data.forEach(row => {
      if (!byDate[row.sale_date]) byDate[row.sale_date] = new Set()
      byDate[row.sale_date].add(row.org_id)
    })

    const result = Object.entries(byDate).map(([date, orgs]) => ({
      date: new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      dau: orgs.size,
    }))

    setDailyActivity(result)
  }

  function handleLogout() {
    sessionStorage.removeItem('inventsight_admin')
    navigate('/admin-inventsight-2026')
  }

  const statusColor = (status) => {
    if (status === 'active')  return { bg: '#f0fdf4', color: '#0f9b58', label: 'Active' }
    if (status === 'trial')   return { bg: '#fff0f7', color: '#d63683', label: 'Trial' }
    if (status === 'expired') return { bg: '#fef2f2', color: '#dc2626', label: 'Expired' }
    return { bg: '#f8f7fc', color: '#7880a4', label: 'None' }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{background: '#f8f7fc'}}>
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-3"
          style={{borderColor: '#d63683', borderTopColor: 'transparent'}} />
        <p className="text-sm" style={{color: '#7880a4'}}>Loading admin data...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{background: '#f8f7fc', fontFamily: "'DM Sans', sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');`}</style>

      {/* Top nav */}
      <nav style={{
        background: '#111827', padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '64px', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: '#d63683',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{color: 'white', fontWeight: '800', fontSize: '14px', fontFamily: 'Sora, sans-serif'}}>I</span>
          </div>
          <div>
            <p style={{color: 'white', fontWeight: '700', fontSize: '15px', fontFamily: 'Sora, sans-serif'}}>
              InventSight Admin
            </p>
            <p style={{color: 'rgba(255,255,255,0.4)', fontSize: '11px'}}>
              Super Admin Panel · Restricted
            </p>
          </div>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
          <button onClick={fetchAll}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '500',
              background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
            }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '500',
              background: 'rgba(220,38,38,0.15)', color: '#fca5a5',
              border: '1px solid rgba(220,38,38,0.2)', cursor: 'pointer',
            }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </nav>

      <div style={{maxWidth: '1200px', margin: '0 auto', padding: '32px 24px'}}>

        {/* Page title */}
        <div style={{marginBottom: '24px'}}>
          <h1 style={{fontFamily: 'Sora, sans-serif', fontSize: '1.8rem', fontWeight: '800', color: '#1e2b71'}}>
            Platform Overview
          </h1>
          <p style={{color: '#7880a4', fontSize: '14px', marginTop: '4px'}}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* ── Tab switcher ── */}
        <div style={{
          display: 'flex', gap: '6px', padding: '6px',
          background: '#f0edf8', borderRadius: '14px',
          marginBottom: '28px', width: 'fit-content',
        }}>
          {TABS.map(tab => (
            <button key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 20px', borderRadius: '10px',
                fontSize: '14px', fontWeight: '600',
                border: 'none', cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: activeTab === tab.id
                  ? tab.highlight ? '#d63683' : '#1e2b71'
                  : 'transparent',
                color: activeTab === tab.id
                  ? 'white'
                  : tab.highlight ? '#d63683' : '#7880a4',
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <>
            {/* KPI Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px', marginBottom: '28px',
            }}>
              {[
                {
                  icon: <Users size={20} />,
                  label: 'Total Registered',
                  value: stats.totalOrgs,
                  sub: 'All time signups',
                  color: '#1e2b71', bg: '#f0f1fa',
                },
                {
                  icon: <Activity size={20} />,
                  label: 'Active — 30 Days',
                  value: stats.activeOrgs30d,
                  sub: 'Entered sales in last 30d',
                  color: '#0f9b58', bg: '#f0fdf4',
                },
                {
                  icon: <Activity size={20} />,
                  label: 'Active — 7 Days',
                  value: stats.activeOrgs7d,
                  sub: 'Entered sales in last 7d',
                  color: '#d97706', bg: '#fffbeb',
                },
                {
                  icon: <TrendingUp size={20} />,
                  label: 'On Free Trial',
                  value: stats.trialOrgs,
                  sub: 'Trial active',
                  color: '#d63683', bg: '#fff0f7',
                },
                {
                  icon: <CreditCard size={20} />,
                  label: 'Paying Users',
                  value: stats.activeSubscriptions,
                  sub: 'Active subscriptions',
                  color: '#0f9b58', bg: '#f0fdf4',
                },
                {
                  icon: <CreditCard size={20} />,
                  label: 'MRR',
                  value: `Rs. ${(stats.mrr / 1000).toFixed(1)}K`,
                  sub: `${stats.activeSubscriptions} × Rs. 9,999`,
                  color: '#1e2b71', bg: '#f0f1fa',
                },
                {
                  icon: <Users size={20} />,
                  label: 'Total SKUs',
                  value: stats.totalSkus,
                  sub: 'Across all accounts',
                  color: '#7c3aed', bg: '#f5f3ff',
                },
                {
                  icon: <Activity size={20} />,
                  label: 'Sales Entries',
                  value: stats.totalSalesEntries,
                  sub: 'Total daily logs entered',
                  color: '#0891b2', bg: '#f0f9ff',
                },
              ].map(({ icon, label, value, sub, color, bg }) => (
                <div key={label} style={{
                  background: bg, borderRadius: '16px',
                  border: '1px solid #e8e5f0', padding: '20px',
                }}>
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px'}}>
                    <p style={{fontSize: '12px', fontWeight: '600', color: '#7880a4', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                      {label}
                    </p>
                    <div style={{color}}>{icon}</div>
                  </div>
                  <p style={{fontSize: '2rem', fontWeight: '800', color, fontFamily: 'Sora, sans-serif', lineHeight: 1}}>
                    {value}
                  </p>
                  <p style={{fontSize: '12px', color: '#7880a4', marginTop: '6px'}}>{sub}</p>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px'}}>

              <div style={{background: 'white', borderRadius: '20px', border: '1px solid #e8e5f0', padding: '24px'}}>
                <h2 style={{fontWeight: '700', color: '#1e2b71', marginBottom: '4px', fontSize: '15px'}}>
                  Daily Active Users
                </h2>
                <p style={{color: '#7880a4', fontSize: '12px', marginBottom: '20px'}}>
                  Unique orgs entering sales data per day (last 30 days)
                </p>
                {dailyActivity.length === 0 ? (
                  <div style={{textAlign: 'center', padding: '40px', color: '#7880a4', fontSize: '14px'}}>
                    No activity data yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={dailyActivity} margin={{top: 5, right: 10, left: -20, bottom: 5}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0edf8" />
                      <XAxis dataKey="date" tick={{fontSize: 10, fill: '#7880a4'}} tickLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{fontSize: 10, fill: '#7880a4'}} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{border: '1px solid #e8e5f0', borderRadius: '12px', fontSize: '12px'}} />
                      <Line type="monotone" dataKey="dau" name="Active Orgs" stroke="#d63683" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div style={{background: 'white', borderRadius: '20px', border: '1px solid #e8e5f0', padding: '24px'}}>
                <h2 style={{fontWeight: '700', color: '#1e2b71', marginBottom: '4px', fontSize: '15px'}}>
                  Signup Cohort
                </h2>
                <p style={{color: '#7880a4', fontSize: '12px', marginBottom: '20px'}}>
                  New organisations registered per week
                </p>
                {signupCohort.length === 0 ? (
                  <div style={{textAlign: 'center', padding: '40px', color: '#7880a4', fontSize: '14px'}}>
                    No signup data yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={signupCohort} margin={{top: 5, right: 10, left: -20, bottom: 5}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0edf8" />
                      <XAxis dataKey="week" tick={{fontSize: 10, fill: '#7880a4'}} tickLine={false} />
                      <YAxis tick={{fontSize: 10, fill: '#7880a4'}} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{border: '1px solid #e8e5f0', borderRadius: '12px', fontSize: '12px'}} />
                      <Bar dataKey="count" name="New Signups" radius={[6, 6, 0, 0]}>
                        {signupCohort.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Subscription breakdown */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px', marginBottom: '28px',
            }}>
              {[
                { label: 'Trial Users',       value: stats.trialOrgs,            total: stats.totalOrgs, color: '#d63683', bg: '#fff0f7', border: '#f9a8d4' },
                { label: 'Paying Users',      value: stats.activeSubscriptions,  total: stats.totalOrgs, color: '#0f9b58', bg: '#f0fdf4', border: '#bbf7d0' },
                { label: 'Expired / Churned', value: stats.expiredSubscriptions, total: stats.totalOrgs, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
              ].map(({ label, value, total, color, bg, border }) => {
                const pct = total > 0 ? Math.round((value / total) * 100) : 0
                return (
                  <div key={label} style={{
                    background: bg, borderRadius: '16px',
                    border: `1px solid ${border}`, padding: '20px',
                  }}>
                    <p style={{fontSize: '12px', fontWeight: '600', color: '#7880a4', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px'}}>
                      {label}
                    </p>
                    <div style={{display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '12px'}}>
                      <p style={{fontSize: '2.4rem', fontWeight: '800', color, lineHeight: 1, fontFamily: 'Sora, sans-serif'}}>
                        {value}
                      </p>
                      <p style={{fontSize: '14px', color, marginBottom: '4px', fontWeight: '600'}}>
                        ({pct}%)
                      </p>
                    </div>
                    <div style={{width: '100%', height: '6px', borderRadius: '100px', background: 'rgba(0,0,0,0.08)'}}>
                      <div style={{
                        width: `${pct}%`, height: '100%',
                        borderRadius: '100px', background: color,
                        transition: 'width 0.8s ease',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* All organisations table */}
            <div style={{background: 'white', borderRadius: '20px', border: '1px solid #e8e5f0', overflow: 'hidden'}}>
              <div style={{padding: '20px 24px', borderBottom: '1px solid #e8e5f0', background: '#f8f7fc'}}>
                <h2 style={{fontWeight: '700', color: '#1e2b71', fontSize: '15px'}}>All Organisations</h2>
                <p style={{color: '#7880a4', fontSize: '12px', marginTop: '2px'}}>
                  Most recently registered first · {topOrgs.length} shown
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 80px 100px 110px 100px',
                padding: '10px 24px',
                borderBottom: '1px solid #e8e5f0',
                background: '#faf9fd',
              }}>
                {['Organisation', 'SKUs', 'Last Active', 'Status', 'Joined'].map(h => (
                  <p key={h} style={{fontSize: '11px', fontWeight: '600', color: '#7880a4', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                    {h}
                  </p>
                ))}
              </div>

              {topOrgs.length === 0 ? (
                <div style={{textAlign: 'center', padding: '40px', color: '#7880a4', fontSize: '14px'}}>
                  No organisations found
                </div>
              ) : (
                topOrgs.map((org, i) => {
                  const s = statusColor(org.subStatus)
                  return (
                    <div key={org.id} style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 80px 100px 110px 100px',
                      padding: '14px 24px',
                      borderBottom: i < topOrgs.length - 1 ? '1px solid #f0edf8' : 'none',
                      alignItems: 'center',
                    }}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                        <div style={{
                          width: '34px', height: '34px', borderRadius: '10px',
                          background: '#f0f1fa', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: '700', fontSize: '14px', color: '#1e2b71',
                        }}>
                          {org.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p style={{fontWeight: '600', color: '#1e2b71', fontSize: '14px'}}>{org.name}</p>
                          <p style={{color: '#7880a4', fontSize: '11px'}}>{org.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                      <p style={{fontWeight: '600', color: '#1e2b71', fontSize: '14px'}}>{org.skuCount}</p>
                      <p style={{color: org.lastActive ? '#374151' : '#b0b4c8', fontSize: '13px'}}>
                        {org.lastActive
                          ? new Date(org.lastActive).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                          : 'No activity'}
                      </p>
                      <span style={{
                        display: 'inline-block',
                        background: s.bg, color: s.color,
                        padding: '4px 10px', borderRadius: '8px',
                        fontSize: '12px', fontWeight: '600', width: 'fit-content',
                      }}>
                        {s.label}
                      </span>
                      <p style={{color: '#7880a4', fontSize: '12px'}}>
                        {new Date(org.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </p>
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}

        {/* ── AFFILIATES TAB ── */}
        {activeTab === 'affiliates' && <AdminAffiliates />}

      </div>
    </div>
  )
}