import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useOrg } from '../hooks/useOrg'
import { supabase } from '../supabaseClient'
import { Search, Filter, ChevronDown, ChevronUp, Package, RefreshCw } from 'lucide-react'

const DOC_CONFIG = {
  green:  { label: 'Healthy',   color: '#0f9b58', bg: '#f0fdf4', border: '#bbf7d0' },
  amber:  { label: 'Plan Now',  color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  red:    { label: 'Act Now',   color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  black:  { label: 'Critical',  color: '#111827', bg: '#f3f4f6', border: '#d1d5db' },
}

const BCG_CONFIG = {
  star:          { label: '🚀 Fast Mover',    color: '#d63683', bg: '#fff0f7' },
  cash_cow:      { label: '💰 Steady Earner', color: '#0f9b58', bg: '#f0fdf4' },
  question_mark: { label: '🌱 Rising SKU',    color: '#d97706', bg: '#fffbeb' },
  dog:           { label: '⚠️ Slow Mover',    color: '#6b7280', bg: '#f9fafb' },
}

export default function SkuExplorer() {
  const { org } = useOrg()
  const [skus, setSkus] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedSku, setExpandedSku] = useState(null)
  const [warehouseStock, setWarehouseStock] = useState({})

  // Filters
  const [search, setSearch] = useState('')
  const [docFilter, setDocFilter] = useState('all')
  const [bcgFilter, setBcgFilter] = useState('all')

  // Sort
  const [sortBy, setSortBy] = useState('doc_days')
  const [sortDir, setSortDir] = useState('asc')

  useEffect(() => { if (org) fetchSkus() }, [org])

  useEffect(() => { applyFilters() }, [skus, search, docFilter, bcgFilter, sortBy, sortDir])

  async function fetchSkus() {
    setLoading(true)
    const { data, error } = await supabase
      .from('sku_metrics')
      .select(`
        sku_id, doc_days, doc_status, drr_7d, drr_30d, drr_90d,
        total_current_stock, reorder_point_qty, reorder_deadline,
        days_to_reorder, bcg_class, growth_rate_pct, revenue_30d,
        units_sold_30d, is_eol_candidate, capital_at_risk,
        drr_trend_signal, calculated_on,
        skus(
          id, sku_code, item_name, variant_name,
          lead_time_days, lead_time_type, vendor_name,
          mrp, cost_price, selling_price, minimum_order_qty,
          brands_master(name), categories(name)
        )
      `)
      .eq('org_id', org.id)
      .order('calculated_on', { ascending: false })

    if (error) { console.error(error); setLoading(false); return }

    // Deduplicate — keep only latest metrics per SKU
    const seen = new Set()
    const unique = (data || []).filter(m => {
      if (seen.has(m.sku_id)) return false
      seen.add(m.sku_id)
      return true
    })

    setSkus(unique)
    setLoading(false)
  }

  async function fetchWarehouseStock(skuId) {
    if (warehouseStock[skuId]) return // already fetched
    const { data } = await supabase
      .from('sku_warehouse_stock')
      .select('current_qty, opening_qty, warehouses(name, city, type)')
      .eq('sku_id', skuId)
    setWarehouseStock(prev => ({ ...prev, [skuId]: data || [] }))
  }

  function toggleExpand(skuId) {
    if (expandedSku === skuId) {
      setExpandedSku(null)
    } else {
      setExpandedSku(skuId)
      fetchWarehouseStock(skuId)
    }
  }

  function applyFilters() {
    let result = [...skus]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(m =>
        m.skus?.item_name?.toLowerCase().includes(q) ||
        m.skus?.sku_code?.toLowerCase().includes(q) ||
        m.skus?.variant_name?.toLowerCase().includes(q)
      )
    }

    if (docFilter !== 'all') result = result.filter(m => m.doc_status === docFilter)
    if (bcgFilter !== 'all') result = result.filter(m => m.bcg_class === bcgFilter)

    result.sort((a, b) => {
      let aVal = a[sortBy] ?? 999
      let bVal = b[sortBy] ?? 999
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    setFiltered(result)
  }

  function handleSort(col) {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(col)
      setSortDir('asc')
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    await supabase.rpc('calculate_sku_metrics', { p_org_id: org.id })
    await fetchSkus()
    setRefreshing(false)
  }

  function SortIcon({ col }) {
    if (sortBy !== col) return <ChevronDown size={13} style={{color: '#b0b4c8'}} />
    return sortDir === 'asc'
      ? <ChevronUp size={13} style={{color: '#d63683'}} />
      : <ChevronDown size={13} style={{color: '#d63683'}} />
  }

  const counts = {
    all: skus.length,
    green: skus.filter(s => s.doc_status === 'green').length,
    amber: skus.filter(s => s.doc_status === 'amber').length,
    red: skus.filter(s => s.doc_status === 'red').length,
    black: skus.filter(s => s.doc_status === 'black').length,
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
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-navy">SKU Explorer</h1>
            <p className="text-sm mt-0.5" style={{color: '#7880a4'}}>
              {skus.length} SKUs monitored · Click any row to see warehouse breakdown
            </p>
          </div>
          <button onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all"
            style={{borderColor: '#e8e5f0', color: '#7880a4', background: 'white'}}>
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Recalculating...' : 'Refresh'}
          </button>
        </div>

        {/* DOC Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all', label: `All SKUs (${counts.all})`, color: '#1e2b71', activeBg: '#1e2b71' },
            { key: 'green', label: `✓ Healthy (${counts.green})`, color: '#0f9b58', activeBg: '#0f9b58' },
            { key: 'amber', label: `⚡ Plan Now (${counts.amber})`, color: '#d97706', activeBg: '#d97706' },
            { key: 'red', label: `🔴 Act Now (${counts.red})`, color: '#dc2626', activeBg: '#dc2626' },
            { key: 'black', label: `⚫ Critical (${counts.black})`, color: '#111827', activeBg: '#111827' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setDocFilter(tab.key)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all border"
              style={{
                background: docFilter === tab.key ? tab.activeBg : 'white',
                color: docFilter === tab.key ? 'white' : tab.color,
                borderColor: docFilter === tab.key ? tab.activeBg : '#e8e5f0',
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search + BCG filter */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{color: '#b0b4c8'}} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by SKU name, code, or variant..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-navy focus:outline-none focus:ring-2 focus:ring-pink"
              style={{borderColor: '#e8e5f0'}}
            />
          </div>
          <select
            value={bcgFilter}
            onChange={e => setBcgFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border text-sm text-navy focus:outline-none focus:ring-2 focus:ring-pink"
            style={{borderColor: '#e8e5f0'}}>
            <option value="all">All Categories</option>
            <option value="star">🚀 Fast Movers</option>
            <option value="cash_cow">💰 Steady Earners</option>
            <option value="question_mark">🌱 Rising SKUs</option>
            <option value="dog">⚠️ Slow Movers</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border overflow-hidden" style={{borderColor: '#e8e5f0'}}>

          {/* Table header */}
          <div className="grid text-xs font-semibold uppercase tracking-wider px-5 py-3 border-b"
            style={{
              gridTemplateColumns: '2fr 90px 90px 90px 100px 110px 120px 40px',
              borderColor: '#e8e5f0', color: '#7880a4', background: '#f8f7fc'
            }}>
            <button className="text-left flex items-center gap-1" onClick={() => handleSort('item_name')}>
              Product <SortIcon col="item_name" />
            </button>
            <button className="text-center flex items-center justify-center gap-1" onClick={() => handleSort('total_current_stock')}>
              Stock <SortIcon col="total_current_stock" />
            </button>
            <button className="text-center flex items-center justify-center gap-1" onClick={() => handleSort('drr_30d')}>
              DRR 30d <SortIcon col="drr_30d" />
            </button>
            <button className="text-center flex items-center justify-center gap-1" onClick={() => handleSort('doc_days')}>
              DOC <SortIcon col="doc_days" />
            </button>
            <span className="text-center">Status</span>
            <span className="text-center">Category</span>
            <button className="text-center flex items-center justify-center gap-1" onClick={() => handleSort('days_to_reorder')}>
              Reorder In <SortIcon col="days_to_reorder" />
            </button>
            <span />
          </div>

          {/* Rows */}
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <Package size={40} className="mx-auto mb-3" style={{color: '#b0b4c8'}} />
              <p className="font-medium text-navy">No SKUs found</p>
              <p className="text-sm mt-1" style={{color: '#b0b4c8'}}>
                {skus.length === 0
                  ? 'Add SKUs in Master Data, then click Refresh to calculate metrics'
                  : 'Try changing your filters'}
              </p>
            </div>
          )}

          {filtered.map(metric => {
            const sku = metric.skus
            const doc = DOC_CONFIG[metric.doc_status] || DOC_CONFIG.green
            const bcg = BCG_CONFIG[metric.bcg_class] || BCG_CONFIG.star
            const isExpanded = expandedSku === metric.sku_id
            const stocks = warehouseStock[metric.sku_id] || []

            return (
              <div key={metric.sku_id}
                className="border-b last:border-0"
                style={{borderColor: '#f0edf8'}}>

                {/* Main row */}
                <div
                  className="grid items-center px-5 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ gridTemplateColumns: '2fr 90px 90px 90px 100px 110px 120px 40px' }}
                  onClick={() => toggleExpand(metric.sku_id)}
                >
                  {/* Product */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-1.5 h-10 rounded-full flex-shrink-0"
                      style={{background: doc.color}} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-navy truncate">{sku?.item_name}</p>
                      <p className="text-xs truncate" style={{color: '#7880a4'}}>
                        {sku?.sku_code}
                        {sku?.variant_name ? ` · ${sku.variant_name}` : ''}
                        {sku?.brands_master?.name ? ` · ${sku.brands_master.name}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Stock */}
                  <div className="text-center">
                    <p className="text-sm font-semibold text-navy">{metric.total_current_stock}</p>
                    <p className="text-xs" style={{color: '#b0b4c8'}}>units</p>
                  </div>

                  {/* DRR 30d */}
                  <div className="text-center">
                    <p className="text-sm font-semibold text-navy">
                      {parseFloat(metric.drr_30d || 0).toFixed(1)}
                    </p>
                    <p className="text-xs" style={{color: '#b0b4c8'}}>/day</p>
                  </div>

                  {/* DOC */}
                  <div className="text-center">
                    <p className="text-sm font-semibold" style={{color: doc.color}}>
                      {metric.doc_days > 0 ? `${parseFloat(metric.doc_days).toFixed(0)}d` : 'OOS'}
                    </p>
                    <p className="text-xs" style={{color: '#b0b4c8'}}>cover</p>
                  </div>

                  {/* Status badge */}
                  <div className="flex justify-center">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                      style={{background: doc.bg, color: doc.color, border: `1px solid ${doc.border}`}}>
                      {doc.label}
                    </span>
                  </div>

                  {/* BCG / Category */}
                  <div className="flex justify-center">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-lg"
                      style={{background: bcg.bg, color: bcg.color}}>
                      {bcg.label}
                    </span>
                  </div>

                  {/* Reorder deadline */}
                  <div className="text-center">
                    {metric.days_to_reorder !== null && metric.days_to_reorder <= 14 ? (
                      <div>
                        <p className="text-sm font-semibold" style={{color: metric.days_to_reorder <= 7 ? '#dc2626' : '#d97706'}}>
                          {metric.days_to_reorder === 0 ? 'Today!' : `${metric.days_to_reorder}d`}
                        </p>
                        <p className="text-xs" style={{color: '#b0b4c8'}}>to order</p>
                      </div>
                    ) : metric.reorder_deadline ? (
                      <div>
                        <p className="text-xs text-navy">
                          {new Date(metric.reorder_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                        <p className="text-xs" style={{color: '#b0b4c8'}}>order by</p>
                      </div>
                    ) : (
                      <p className="text-xs" style={{color: '#b0b4c8'}}>—</p>
                    )}
                  </div>

                  {/* Expand icon */}
                  <div className="flex justify-center">
                    {isExpanded
                      ? <ChevronUp size={16} style={{color: '#7880a4'}} />
                      : <ChevronDown size={16} style={{color: '#7880a4'}} />
                    }
                  </div>
                </div>

                {/* Expanded detail panel */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t" style={{borderColor: '#f0edf8', background: '#faf9fd'}}>
                    <div className="grid grid-cols-2 gap-5">

                      {/* Left — metrics detail */}
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wider" style={{color: '#7880a4'}}>
                          Sales Velocity
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: '7-day DRR', value: parseFloat(metric.drr_7d || 0).toFixed(1) + '/day' },
                            { label: '30-day DRR', value: parseFloat(metric.drr_30d || 0).toFixed(1) + '/day' },
                            { label: '90-day DRR', value: parseFloat(metric.drr_90d || 0).toFixed(1) + '/day' },
                            { label: 'Units Sold (30d)', value: metric.units_sold_30d || 0 },
                            { label: 'Revenue (30d)', value: `Rs. ${((metric.revenue_30d || 0) / 1000).toFixed(1)}K` },
                            { label: 'Growth Rate', value: `${parseFloat(metric.growth_rate_pct || 0).toFixed(1)}%` },
                          ].map(({ label, value }) => (
                            <div key={label} className="bg-white rounded-xl p-3 border" style={{borderColor: '#e8e5f0'}}>
                              <p className="text-xs" style={{color: '#7880a4'}}>{label}</p>
                              <p className="text-sm font-semibold text-navy mt-0.5">{value}</p>
                            </div>
                          ))}
                        </div>

                        <p className="text-xs font-semibold uppercase tracking-wider pt-2" style={{color: '#7880a4'}}>
                          Procurement
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: 'Lead Time', value: `${sku?.lead_time_days} days` },
                            { label: 'MOQ', value: `${sku?.minimum_order_qty} units` },
                            { label: 'Reorder Point', value: `${metric.reorder_point_qty} units` },
                            { label: 'Cost Price', value: `Rs. ${sku?.cost_price}` },
                            { label: 'Selling Price', value: `Rs. ${sku?.selling_price}` },
                            { label: 'MRP', value: `Rs. ${sku?.mrp}` },
                          ].map(({ label, value }) => (
                            <div key={label} className="bg-white rounded-xl p-3 border" style={{borderColor: '#e8e5f0'}}>
                              <p className="text-xs" style={{color: '#7880a4'}}>{label}</p>
                              <p className="text-sm font-semibold text-navy mt-0.5">{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right — warehouse stock breakdown */}
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{color: '#7880a4'}}>
                          Stock by Warehouse
                        </p>
                        {stocks.length === 0 ? (
                          <p className="text-sm" style={{color: '#b0b4c8'}}>No warehouse stock data found</p>
                        ) : (
                          <div className="space-y-2">
                            {stocks.map((s, i) => {
                              const pct = metric.total_current_stock > 0
                                ? Math.round((s.current_qty / metric.total_current_stock) * 100)
                                : 0
                              return (
                                <div key={i} className="bg-white rounded-xl p-4 border" style={{borderColor: '#e8e5f0'}}>
                                  <div className="flex items-center justify-between mb-2">
                                    <div>
                                      <p className="text-sm font-semibold text-navy">
                                        {s.warehouses?.name}
                                      </p>
                                      <p className="text-xs" style={{color: '#7880a4'}}>
                                        {s.warehouses?.city} · {s.warehouses?.type?.toUpperCase()}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-lg font-bold text-navy">{s.current_qty}</p>
                                      <p className="text-xs" style={{color: '#7880a4'}}>units · {pct}%</p>
                                    </div>
                                  </div>
                                  {/* Stock bar */}
                                  <div className="h-2 rounded-full overflow-hidden" style={{background: '#f0edf8'}}>
                                    <div className="h-full rounded-full transition-all"
                                      style={{
                                        width: `${pct}%`,
                                        background: s.current_qty > 50 ? '#0f9b58' : s.current_qty > 20 ? '#d97706' : '#dc2626'
                                      }} />
                                  </div>
                                </div>
                              )
                            })}

                            {/* Total */}
                            <div className="flex items-center justify-between px-4 py-3 rounded-xl"
                              style={{background: '#1e2b71'}}>
                              <p className="text-sm font-semibold text-white">Total Stock</p>
                              <p className="text-lg font-bold text-white">{metric.total_current_stock} units</p>
                            </div>
                          </div>
                        )}

                        {metric.is_eol_candidate && (
                          <div className="mt-3 px-4 py-3 rounded-xl text-sm font-medium"
                            style={{background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca'}}>
                            ⚠️ End of Life Candidate — Rs. {((metric.capital_at_risk || 0) / 1000).toFixed(1)}K capital at risk. Consider liquidating.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </Layout>
  )
}