import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useOrg } from '../hooks/useOrg'
import { supabase } from '../supabaseClient'
import { RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react'

const CATEGORIES = {
  star: {
    key: 'star',
    label: '🚀 Fast Movers',
    sublabel: 'High sales + growing fast',
    desc: 'These are your best SKUs right now. Protect their stock at all costs. A stockout here is the most expensive mistake you can make.',
    color: '#d63683',
    bg: '#fff0f7',
    border: '#f9a8d4',
    action: 'Prioritise stock. Never let these run out.',
  },
  cash_cow: {
    key: 'cash_cow',
    label: '💰 Steady Earners',
    sublabel: 'High sales + consistent',
    desc: 'Reliable revenue generators. Not growing fast but paying the bills every month. Maintain stock without over-investing.',
    color: '#0f9b58',
    bg: '#f0fdf4',
    border: '#86efac',
    action: 'Maintain stock levels. Optimise procurement cost.',
  },
  question_mark: {
    key: 'question_mark',
    label: '🌱 Rising SKUs',
    sublabel: 'Low sales but picking up',
    desc: 'These SKUs are showing growth signals but haven\'t broken out yet. Watch them closely — they could become Fast Movers.',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fcd34d',
    action: 'Monitor closely. Light stock. Test promotions.',
  },
  dog: {
    key: 'dog',
    label: '⚠️ Slow Movers',
    sublabel: 'Low sales, needs attention',
    desc: 'These SKUs are not selling well and may be tying up capital. Review pricing, promotions, or consider winding them down.',
    color: '#6b7280',
    bg: '#f9fafb',
    border: '#d1d5db',
    action: 'Review pricing. Consider discounting or discontinuing.',
  },
}

export default function PortfolioAnalysis() {
  const { org } = useOrg()
  const [skus, setSkus] = useState({ star: [], cash_cow: [], question_mark: [], dog: [] })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeCategory, setActiveCategory] = useState('star')
  const [totalRevenue, setTotalRevenue] = useState(0)

  useEffect(() => { if (org) fetchData() }, [org])

  async function fetchData() {
    setLoading(true)
    const { data, error } = await supabase
      .from('sku_metrics')
      .select(`
        sku_id, bcg_class, drr_30d, drr_7d, drr_90d,
        growth_rate_pct, revenue_30d, units_sold_30d,
        total_current_stock, doc_days, doc_status,
        reorder_deadline, is_eol_candidate, capital_at_risk,
        calculated_on,
        skus(
          sku_code, item_name, variant_name,
          cost_price, selling_price, mrp,
          lead_time_days, minimum_order_qty,
          brands_master(name), categories(name)
        )
      `)
      .eq('org_id', org.id)
      .order('calculated_on', { ascending: false })

    if (error) { console.error(error); setLoading(false); return }

    // Deduplicate
    const seen = new Set()
    const unique = (data || []).filter(m => {
      if (seen.has(m.sku_id)) return false
      seen.add(m.sku_id)
      return true
    })

    // Group by BCG class
    const grouped = { star: [], cash_cow: [], question_mark: [], dog: [] }
    let total = 0
    unique.forEach(m => {
      const cls = m.bcg_class || 'dog'
      if (grouped[cls]) grouped[cls].push(m)
      total += parseFloat(m.revenue_30d || 0)
    })

    // Sort each group by revenue desc
    Object.keys(grouped).forEach(k => {
      grouped[k].sort((a, b) => (b.revenue_30d || 0) - (a.revenue_30d || 0))
    })

    setSkus(grouped)
    setTotalRevenue(total)
    setLoading(false)
  }

  async function handleRefresh() {
    setRefreshing(true)
    await supabase.rpc('calculate_sku_metrics', { p_org_id: org.id })
    await fetchData()
    setRefreshing(false)
  }

  const totalSkus = Object.values(skus).reduce((sum, arr) => sum + arr.length, 0)
  const activeList = skus[activeCategory] || []
  const activeCat = CATEGORIES[activeCategory]

  const DOC_CONFIG = {
    green: { label: 'Healthy', color: '#0f9b58', bg: '#f0fdf4' },
    amber: { label: 'Plan Now', color: '#d97706', bg: '#fffbeb' },
    red:   { label: 'Act Now', color: '#dc2626', bg: '#fef2f2' },
    black: { label: 'Critical', color: '#111827', bg: '#f3f4f6' },
  }

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
          style={{borderColor: '#d63683', borderTopColor: 'transparent'}} />
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-navy">Portfolio Analysis</h1>
            <p className="text-sm mt-0.5" style={{color: '#7880a4'}}>
              {totalSkus} SKUs · Rs. {(totalRevenue / 1000).toFixed(1)}K revenue last 30 days
            </p>
          </div>
          <button onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border"
            style={{borderColor: '#e8e5f0', color: '#7880a4', background: 'white'}}>
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Recalculating...' : 'Refresh'}
          </button>
        </div>

        {/* 4 category cards — visual overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.values(CATEGORIES).map(cat => {
            const list = skus[cat.key]
            const catRevenue = list.reduce((s, m) => s + parseFloat(m.revenue_30d || 0), 0)
            const revPct = totalRevenue > 0 ? Math.round((catRevenue / totalRevenue) * 100) : 0
            const isActive = activeCategory === cat.key

            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className="rounded-2xl border p-4 text-left transition-all hover:shadow-md"
                style={{
                  background: isActive ? cat.color : cat.bg,
                  borderColor: isActive ? cat.color : cat.border,
                  transform: isActive ? 'scale(1.02)' : 'scale(1)',
                }}
              >
                <p className="text-sm font-semibold mb-1"
                  style={{color: isActive ? 'white' : cat.color}}>
                  {cat.label}
                </p>
                <p className="text-3xl font-bold mb-1"
                  style={{color: isActive ? 'white' : cat.color}}>
                  {list.length}
                </p>
                <p className="text-xs"
                  style={{color: isActive ? 'rgba(255,255,255,0.8)' : '#7880a4'}}>
                  {revPct}% of revenue
                </p>
                <div className="mt-2 h-1.5 rounded-full overflow-hidden"
                  style={{background: isActive ? 'rgba(255,255,255,0.3)' : '#e8e5f0'}}>
                  <div className="h-full rounded-full"
                    style={{
                      width: `${revPct}%`,
                      background: isActive ? 'white' : cat.color
                    }} />
                </div>
              </button>
            )
          })}
        </div>

        {/* Active category detail */}
        <div className="bg-white rounded-2xl border overflow-hidden" style={{borderColor: '#e8e5f0'}}>

          {/* Category header */}
          <div className="px-6 py-4 border-b" style={{borderColor: '#e8e5f0', background: activeCat.bg}}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold" style={{color: activeCat.color}}>
                  {activeCat.label}
                </h2>
                <p className="text-sm mt-0.5" style={{color: activeCat.color, opacity: 0.8}}>
                  {activeCat.sublabel}
                </p>
                <p className="text-sm mt-2 text-navy">{activeCat.desc}</p>
              </div>
              <div className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold text-white text-center"
                style={{background: activeCat.color, minWidth: '140px'}}>
                💡 {activeCat.action}
              </div>
            </div>
          </div>

          {/* SKU list */}
          {activeList.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">
                {activeCategory === 'star' ? '🚀' : activeCategory === 'cash_cow' ? '💰' : activeCategory === 'question_mark' ? '🌱' : '⚠️'}
              </p>
              <p className="font-medium text-navy">No SKUs in this category</p>
              <p className="text-sm mt-1" style={{color: '#7880a4'}}>
                Add more SKUs and sales data, then click Refresh
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{divideColor: '#f0edf8'}}>
              {activeList.map(metric => {
                const sku = metric.skus
                const doc = DOC_CONFIG[metric.doc_status] || DOC_CONFIG.green
                const growth = parseFloat(metric.growth_rate_pct || 0)
                const revShare = totalRevenue > 0
                  ? Math.round((parseFloat(metric.revenue_30d || 0) / totalRevenue) * 100)
                  : 0

                return (
                  <div key={metric.sku_id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">

                      {/* Left — SKU info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-navy">{sku?.item_name}</p>
                          {sku?.variant_name && (
                            <span className="text-xs px-2 py-0.5 rounded-lg"
                              style={{background: '#f0edf8', color: '#7880a4'}}>
                              {sku.variant_name}
                            </span>
                          )}
                          <span className="text-xs px-2 py-0.5 rounded-lg font-medium"
                            style={{background: doc.bg, color: doc.color}}>
                            {doc.label}
                          </span>
                          {metric.is_eol_candidate && (
                            <span className="text-xs px-2 py-0.5 rounded-lg font-medium"
                              style={{background: '#fef2f2', color: '#dc2626'}}>
                              EOL Risk
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-1" style={{color: '#7880a4'}}>
                          {sku?.sku_code}
                          {sku?.brands_master?.name ? ` · ${sku.brands_master.name}` : ''}
                          {sku?.categories?.name ? ` · ${sku.categories.name}` : ''}
                        </p>

                        {/* Revenue bar */}
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{background: '#f0edf8'}}>
                            <div className="h-full rounded-full"
                              style={{width: `${revShare}%`, background: activeCat.color}} />
                          </div>
                          <span className="text-xs font-medium text-navy flex-shrink-0">
                            {revShare}% of revenue
                          </span>
                        </div>
                      </div>

                      {/* Right — metrics */}
                      <div className="flex-shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="text-center">
                          <p className="text-sm font-bold text-navy">
                            Rs. {(parseFloat(metric.revenue_30d || 0) / 1000).toFixed(1)}K
                          </p>
                          <p className="text-xs" style={{color: '#7880a4'}}>30d revenue</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-navy">
                            {parseFloat(metric.drr_30d || 0).toFixed(1)}
                          </p>
                          <p className="text-xs" style={{color: '#7880a4'}}>units/day</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {growth > 5
                              ? <TrendingUp size={13} style={{color: '#0f9b58'}} />
                              : growth < -5
                              ? <TrendingDown size={13} style={{color: '#dc2626'}} />
                              : <Minus size={13} style={{color: '#7880a4'}} />
                            }
                            <p className="text-sm font-bold"
                              style={{color: growth > 5 ? '#0f9b58' : growth < -5 ? '#dc2626' : '#7880a4'}}>
                              {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
                            </p>
                          </div>
                          <p className="text-xs" style={{color: '#7880a4'}}>growth</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold" style={{color: doc.color}}>
                            {metric.doc_days > 0 ? `${parseFloat(metric.doc_days).toFixed(0)}d` : 'OOS'}
                          </p>
                          <p className="text-xs" style={{color: '#7880a4'}}>DOC</p>
                        </div>
                      </div>
                    </div>

                    {/* EOL warning */}
                    {metric.is_eol_candidate && metric.capital_at_risk && (
                      <div className="mt-3 px-4 py-2.5 rounded-xl text-sm"
                        style={{background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca'}}>
                        ⚠️ End of Life Risk — Rs. {(metric.capital_at_risk / 1000).toFixed(1)}K capital tied up in slow-moving stock. Consider running a promotion or liquidating.
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Summary insight */}
        <div className="bg-white rounded-2xl border p-5" style={{borderColor: '#e8e5f0'}}>
          <h2 className="font-semibold text-navy mb-4">Portfolio Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.values(CATEGORIES).map(cat => {
              const list = skus[cat.key]
              const catRevenue = list.reduce((s, m) => s + parseFloat(m.revenue_30d || 0), 0)
              return (
                <div key={cat.key} className="rounded-xl p-4 border"
                  style={{background: cat.bg, borderColor: cat.border}}>
                  <p className="text-xs font-semibold mb-2" style={{color: cat.color}}>{cat.label}</p>
                  <p className="text-2xl font-bold text-navy">{list.length} <span className="text-sm font-normal" style={{color: '#7880a4'}}>SKUs</span></p>
                  <p className="text-sm font-semibold mt-1" style={{color: cat.color}}>
                    Rs. {(catRevenue / 1000).toFixed(1)}K
                  </p>
                  <p className="text-xs mt-0.5" style={{color: '#7880a4'}}>last 30 days</p>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </Layout>
  )
}