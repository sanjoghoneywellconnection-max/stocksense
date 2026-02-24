import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useOrg } from '../hooks/useOrg'
import { supabase } from '../supabaseClient'
import {
  AlertTriangle, TrendingUp, TrendingDown,
  Package, RefreshCw, ArrowRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { org } = useOrg()
  const navigate = useNavigate()
  const [metrics, setMetrics] = useState(null)
  const [skuHealth, setSkuHealth] = useState({ green: 0, amber: 0, red: 0, black: 0 })
  const [bcgCounts, setBcgCounts] = useState({ star: 0, cash_cow: 0, question_mark: 0, dog: 0 })
  const [topAlerts, setTopAlerts] = useState([])
  const [todaySales, setTodaySales] = useState({ units: 0, gmv: 0 })
  const [yesterdaySales, setYesterdaySales] = useState({ units: 0, gmv: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (org) loadDashboard()
  }, [org])

  async function loadDashboard() {
    setLoading(true)
    await Promise.all([
      fetchSkuHealth(),
      fetchBcgCounts(),
      fetchTopAlerts(),
      fetchSalesComparison(),
    ])
    setLoading(false)
  }

  async function handleRefresh() {
    setRefreshing(true)
    // Trigger calculation engine
    await supabase.rpc('calculate_sku_metrics', { p_org_id: org.id })
    await loadDashboard()
    setRefreshing(false)
  }

  async function fetchSkuHealth() {
    const { data } = await supabase
      .from('sku_metrics')
      .select('doc_status, sku_id')
      .eq('org_id', org.id)
      .eq('calculated_on', new Date().toISOString().split('T')[0])

    if (!data || data.length === 0) {
      // Try most recent calculation
      const { data: latest } = await supabase
        .from('sku_metrics')
        .select('doc_status, sku_id, calculated_on')
        .eq('org_id', org.id)
        .order('calculated_on', { ascending: false })
        .limit(50)

      if (latest) {
        const counts = { green: 0, amber: 0, red: 0, black: 0 }
        latest.forEach(m => { if (counts[m.doc_status] !== undefined) counts[m.doc_status]++ })
        setSkuHealth(counts)
      }
      return
    }

    const counts = { green: 0, amber: 0, red: 0, black: 0 }
    data.forEach(m => { if (counts[m.doc_status] !== undefined) counts[m.doc_status]++ })
    setSkuHealth(counts)
  }

  async function fetchBcgCounts() {
    const { data } = await supabase
      .from('sku_metrics')
      .select('bcg_class')
      .eq('org_id', org.id)
      .order('calculated_on', { ascending: false })
      .limit(50)

    if (!data) return
    const counts = { star: 0, cash_cow: 0, question_mark: 0, dog: 0 }
    data.forEach(m => { if (counts[m.bcg_class] !== undefined) counts[m.bcg_class]++ })
    setBcgCounts(counts)
  }

  async function fetchTopAlerts() {
    const { data } = await supabase
      .from('sku_metrics')
      .select(`
        doc_status, doc_days, reorder_deadline, days_to_reorder,
        skus(item_name, variant_name, sku_code)
      `)
      .eq('org_id', org.id)
      .in('doc_status', ['red', 'black'])
      .order('doc_days', { ascending: true })
      .limit(5)

    setTopAlerts(data || [])
  }

  async function fetchSalesComparison() {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    const [todayRes, yestRes] = await Promise.all([
      supabase.from('daily_sales').select('units_sold, gmv')
        .eq('org_id', org.id).eq('sale_date', today),
      supabase.from('daily_sales').select('units_sold, gmv')
        .eq('org_id', org.id).eq('sale_date', yesterday),
    ])

    const sumUp = (rows) => ({
      units: rows?.reduce((s, r) => s + (r.units_sold || 0), 0) || 0,
      gmv: rows?.reduce((s, r) => s + (parseFloat(r.gmv) || 0), 0) || 0,
    })

    setTodaySales(sumUp(todayRes.data))
    setYesterdaySales(sumUp(yestRes.data))
  }

  const totalSkus = skuHealth.green + skuHealth.amber + skuHealth.red + skuHealth.black
  const urgentCount = skuHealth.red + skuHealth.black
  const gmvChange = yesterdaySales.gmv > 0
    ? (((todaySales.gmv - yesterdaySales.gmv) / yesterdaySales.gmv) * 100).toFixed(1)
    : null

  const docStatusConfig = {
    green: { label: 'Healthy', color: '#0f9b58', bg: '#f0fdf4', border: '#bbf7d0', desc: '30+ days cover' },
    amber: { label: 'Plan Now', color: '#d97706', bg: '#fffbeb', border: '#fde68a', desc: '15–30 days cover' },
    red:   { label: 'Act Now', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', desc: 'Under 15 days' },
    black: { label: 'Critical', color: '#111827', bg: '#f9fafb', border: '#e5e7eb', desc: 'OOS or < lead time' },
  }

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-3"
            style={{borderColor: '#d63683', borderTopColor: 'transparent'}} />
          <p className="text-sm" style={{color: '#7880a4'}}>Loading dashboard...</p>
        </div>
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-navy">
              Good morning, {org?.name} 👋
            </h1>
            <p className="text-sm mt-0.5" style={{color: '#7880a4'}}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:shadow-sm"
            style={{borderColor: '#e8e5f0', color: '#7880a4', background: 'white'}}
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Recalculating...' : 'Refresh Metrics'}
          </button>
        </div>

        {/* Urgent banner */}
        {urgentCount > 0 && (
          <div className="flex items-center justify-between px-5 py-4 rounded-2xl"
            style={{background: '#fef2f2', border: '1px solid #fecaca'}}>
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} style={{color: '#dc2626'}} />
              <div>
                <p className="font-semibold text-sm" style={{color: '#dc2626'}}>
                  {urgentCount} SKU{urgentCount > 1 ? 's' : ''} need immediate attention
                </p>
                <p className="text-xs mt-0.5" style={{color: '#ef4444'}}>
                  Stock running critically low — place orders today
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/reorder')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{background: '#dc2626'}}
            >
              View Reorder Planner <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* Sales comparison row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border p-5" style={{borderColor: '#e8e5f0'}}>
            <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{color: '#7880a4'}}>
              Today's Sales
            </p>
            <p className="text-3xl font-bold text-navy">{todaySales.units}</p>
            <p className="text-sm mt-1" style={{color: '#7880a4'}}>units sold</p>
            {gmvChange !== null && (
              <div className="flex items-center gap-1 mt-2">
                {parseFloat(gmvChange) >= 0
                  ? <TrendingUp size={14} style={{color: '#0f9b58'}} />
                  : <TrendingDown size={14} style={{color: '#dc2626'}} />
                }
                <span className="text-xs font-medium"
                  style={{color: parseFloat(gmvChange) >= 0 ? '#0f9b58' : '#dc2626'}}>
                  {gmvChange > 0 ? '+' : ''}{gmvChange}% vs yesterday
                </span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border p-5" style={{borderColor: '#e8e5f0'}}>
            <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{color: '#7880a4'}}>
              Today's GMV
            </p>
            <p className="text-3xl font-bold text-navy">
              Rs. {todaySales.gmv > 0 ? (todaySales.gmv / 1000).toFixed(1) + 'K' : '0'}
            </p>
            <p className="text-sm mt-1" style={{color: '#7880a4'}}>
              Yesterday: Rs. {yesterdaySales.gmv > 0 ? (yesterdaySales.gmv / 1000).toFixed(1) + 'K' : '0'}
            </p>
          </div>

          <div className="bg-white rounded-2xl border p-5" style={{borderColor: '#e8e5f0'}}>
            <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{color: '#7880a4'}}>
              Total SKUs
            </p>
            <p className="text-3xl font-bold text-navy">{totalSkus}</p>
            <p className="text-sm mt-1" style={{color: '#7880a4'}}>
              {urgentCount > 0 ? `${urgentCount} need action` : 'All monitored'}
            </p>
          </div>
        </div>

        {/* DOC Health Grid */}
        <div>
          <h2 className="font-semibold text-navy mb-3">Portfolio Stock Health</h2>
          <div className="grid grid-cols-4 gap-4">
            {Object.entries(docStatusConfig).map(([status, config]) => (
              <div key={status}
                className="rounded-2xl border p-5 transition-all hover:shadow-sm cursor-pointer"
                style={{background: config.bg, borderColor: config.border}}
                onClick={() => navigate('/skus')}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider"
                    style={{color: config.color}}>
                    {config.label}
                  </span>
                  <div className="w-2.5 h-2.5 rounded-full" style={{background: config.color}} />
                </div>
                <p className="text-4xl font-bold mb-1" style={{color: config.color}}>
                  {skuHealth[status]}
                </p>
                <p className="text-xs" style={{color: config.color, opacity: 0.7}}>
                  {config.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom row — Alerts + BCG */}
        <div className="grid grid-cols-2 gap-5">

          {/* Top Alerts */}
          <div className="bg-white rounded-2xl border p-5" style={{borderColor: '#e8e5f0'}}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-navy">🚨 Urgent Reorders</h2>
              <button onClick={() => navigate('/reorder')}
                className="text-xs font-medium" style={{color: '#d63683'}}>
                View all →
              </button>
            </div>

            {topAlerts.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">✓</span>
                </div>
                <p className="text-sm font-medium text-navy">All clear!</p>
                <p className="text-xs mt-1" style={{color: '#7880a4'}}>
                  No urgent reorders needed right now
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {topAlerts.map((alert, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 border-b last:border-0"
                    style={{borderColor: '#f0edf8'}}>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-8 rounded-full flex-shrink-0"
                        style={{background: alert.doc_status === 'black' ? '#111827' : '#dc2626'}} />
                      <div>
                        <p className="text-sm font-medium text-navy">
                          {alert.skus?.item_name}
                        </p>
                        <p className="text-xs" style={{color: '#7880a4'}}>
                          {alert.skus?.sku_code}
                          {alert.doc_days > 0
                            ? ` · ${parseFloat(alert.doc_days).toFixed(1)} days left`
                            : ' · OUT OF STOCK'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                        style={{
                          background: alert.doc_status === 'black' ? '#f9fafb' : '#fef2f2',
                          color: alert.doc_status === 'black' ? '#111827' : '#dc2626'
                        }}>
                        {alert.doc_status === 'black' ? 'CRITICAL' : 'ACT NOW'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* BCG Summary */}
          <div className="bg-white rounded-2xl border p-5" style={{borderColor: '#e8e5f0'}}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-navy">BCG Portfolio Mix</h2>
              <button onClick={() => navigate('/bcg')}
                className="text-xs font-medium" style={{color: '#d63683'}}>
                Full matrix →
              </button>
            </div>

            <div className="space-y-3">
              {[
                { key: 'star', label: '⭐ Stars', desc: 'High revenue, growing', color: '#d63683', bg: '#fff0f7' },
                { key: 'cash_cow', label: '🐄 Cash Cows', desc: 'High revenue, stable', color: '#0f9b58', bg: '#f0fdf4' },
                { key: 'question_mark', label: '❓ Question Marks', desc: 'Low revenue, growing', color: '#d97706', bg: '#fffbeb' },
                { key: 'dog', label: '🐕 Dogs', desc: 'Low revenue, declining', color: '#6b7280', bg: '#f9fafb' },
              ].map(({ key, label, desc, color, bg }) => (
                <div key={key} className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{background: bg}}>
                  <div>
                    <p className="text-sm font-medium text-navy">{label}</p>
                    <p className="text-xs" style={{color: '#7880a4'}}>{desc}</p>
                  </div>
                  <span className="text-2xl font-bold" style={{color}}>
                    {bcgCounts[key]}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl border p-5" style={{borderColor: '#e8e5f0'}}>
          <h2 className="font-semibold text-navy mb-4">Quick Actions</h2>
          <div className="flex gap-3 flex-wrap">
            {[
              { label: '+ Enter Today\'s Sales', to: '/sales', color: '#d63683' },
              { label: '→ SKU Explorer', to: '/skus', color: '#1e2b71' },
              { label: '→ Reorder Planner', to: '/reorder', color: '#dc2626' },
              { label: '→ BCG Matrix', to: '/bcg', color: '#0f9b58' },
              { label: '⚙ Master Data', to: '/settings', color: '#7880a4' },
            ].map(({ label, to, color }) => (
              <button key={to} onClick={() => navigate(to)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
                style={{background: color}}>
                {label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  )
}