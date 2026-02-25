import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useOrg } from '../hooks/useOrg'
import { supabase } from '../supabaseClient'
import { TrendingUp, TrendingDown, RefreshCw, Minus } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'

export default function InventoryTrends() {
  const { org } = useOrg()
  const [gainers, setGainers] = useState([])
  const [losers, setLosers] = useState([])
  const [selectedSku, setSelectedSku] = useState(null)
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('gainers')

  useEffect(() => { if (org) fetchData() }, [org])
  useEffect(() => { if (selectedSku) fetchChartData(selectedSku) }, [selectedSku])

  async function fetchData() {
    setLoading(true)
    const { data, error } = await supabase
      .from('sku_metrics')
      .select(`
        sku_id, drr_7d, drr_30d, drr_90d, growth_rate_pct,
        revenue_30d, units_sold_30d, total_current_stock,
        doc_status, doc_days, drr_trend_signal, calculated_on,
        skus(sku_code, item_name, variant_name, brands_master(name), categories(name))
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

    // Gainers — 7d DRR higher than 30d DRR
    const g = unique
      .filter(m => parseFloat(m.drr_7d || 0) > parseFloat(m.drr_30d || 0))
      .sort((a, b) => parseFloat(b.growth_rate_pct || 0) - parseFloat(a.growth_rate_pct || 0))

    // Losers — 7d DRR lower than 30d DRR
    const l = unique
      .filter(m => parseFloat(m.drr_7d || 0) < parseFloat(m.drr_30d || 0))
      .sort((a, b) => parseFloat(a.growth_rate_pct || 0) - parseFloat(b.growth_rate_pct || 0))

    setGainers(g)
    setLosers(l)

    // Auto select first SKU for chart
    if (unique.length > 0) setSelectedSku(unique[0].sku_id)

    setLoading(false)
  }

  async function fetchChartData(skuId) {
    const { data } = await supabase
      .from('daily_sales')
      .select('sale_date, units_sold, units_returned, gmv')
      .eq('org_id', org.id)
      .eq('sku_id', skuId)
      .order('sale_date', { ascending: true })
      .limit(90)

    if (!data) return

    // Aggregate by date across all channels
    const byDate = {}
    data.forEach(row => {
      const d = row.sale_date
      if (!byDate[d]) byDate[d] = { date: d, units: 0, gmv: 0 }
      byDate[d].units += row.units_sold - row.units_returned
      byDate[d].gmv += parseFloat(row.gmv || 0)
    })

    // Calculate 7-day rolling average
    const sorted = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date))
    const withRolling = sorted.map((row, i) => {
      const window = sorted.slice(Math.max(0, i - 6), i + 1)
      const avg = window.reduce((s, r) => s + r.units, 0) / window.length
      return {
        ...row,
        date: new Date(row.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        rolling7: parseFloat(avg.toFixed(1)),
        gmv: parseFloat((row.gmv / 1000).toFixed(1)),
      }
    })

    // Show last 30 days only on chart
    setChartData(withRolling.slice(-30))
  }

  async function handleRefresh() {
    setRefreshing(true)
    await supabase.rpc('calculate_sku_metrics', { p_org_id: org.id })
    await fetchData()
    setRefreshing(false)
  }

  const DOC_COLORS = {
    green: '#0f9b58', amber: '#d97706', red: '#dc2626', black: '#111827'
  }

  const activeList = activeTab === 'gainers' ? gainers : losers

  const allSkus = [...gainers, ...losers]
  const selectedMetric = allSkus.find(m => m.sku_id === selectedSku)

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
            <h1 className="text-2xl font-bold text-navy">Inventory Trends</h1>
            <p className="text-sm mt-0.5" style={{color: '#7880a4'}}>
              Comparing 7-day vs 30-day sales velocity · {gainers.length} gaining, {losers.length} losing momentum
            </p>
          </div>
          <button onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border"
            style={{borderColor: '#e8e5f0', color: '#7880a4', background: 'white'}}>
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Recalculating...' : 'Refresh'}
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border p-5 flex items-center gap-4"
            style={{background: '#f0fdf4', borderColor: '#bbf7d0'}}>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp size={24} style={{color: '#0f9b58'}} />
            </div>
            <div>
              <p className="text-3xl font-bold" style={{color: '#0f9b58'}}>{gainers.length}</p>
              <p className="text-sm font-medium" style={{color: '#0f9b58'}}>
                Gaining Momentum
              </p>
              <p className="text-xs mt-0.5" style={{color: '#7880a4'}}>
                Selling faster than 30-day average
              </p>
            </div>
          </div>

          <div className="rounded-2xl border p-5 flex items-center gap-4"
            style={{background: '#fef2f2', borderColor: '#fecaca'}}>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingDown size={24} style={{color: '#dc2626'}} />
            </div>
            <div>
              <p className="text-3xl font-bold" style={{color: '#dc2626'}}>{losers.length}</p>
              <p className="text-sm font-medium" style={{color: '#dc2626'}}>
                Losing Momentum
              </p>
              <p className="text-xs mt-0.5" style={{color: '#7880a4'}}>
                Selling slower than 30-day average
              </p>
            </div>
          </div>
        </div>

        {/* Chart section */}
        {selectedMetric && chartData.length > 0 && (
          <div className="bg-white rounded-2xl border p-6" style={{borderColor: '#e8e5f0'}}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="font-semibold text-navy">
                  {selectedMetric.skus?.item_name}
                  {selectedMetric.skus?.variant_name ? ` · ${selectedMetric.skus.variant_name}` : ''}
                </h2>
                <p className="text-xs mt-1" style={{color: '#7880a4'}}>
                  Daily units sold (last 30 days) with 7-day rolling average
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <p className="font-bold text-navy">{parseFloat(selectedMetric.drr_7d || 0).toFixed(1)}</p>
                  <p className="text-xs" style={{color: '#7880a4'}}>7d avg</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-navy">{parseFloat(selectedMetric.drr_30d || 0).toFixed(1)}</p>
                  <p className="text-xs" style={{color: '#7880a4'}}>30d avg</p>
                </div>
                <div className="text-center">
                  {parseFloat(selectedMetric.growth_rate_pct || 0) >= 0
                    ? <TrendingUp size={16} style={{color: '#0f9b58'}} className="mx-auto" />
                    : <TrendingDown size={16} style={{color: '#dc2626'}} className="mx-auto" />
                  }
                  <p className="font-bold"
                    style={{color: parseFloat(selectedMetric.growth_rate_pct || 0) >= 0 ? '#0f9b58' : '#dc2626'}}>
                    {parseFloat(selectedMetric.growth_rate_pct || 0) > 0 ? '+' : ''}
                    {parseFloat(selectedMetric.growth_rate_pct || 0).toFixed(1)}%
                  </p>
                  <p className="text-xs" style={{color: '#7880a4'}}>growth</p>
                </div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{top: 5, right: 10, left: -20, bottom: 5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0edf8" />
                <XAxis
                  dataKey="date"
                  tick={{fontSize: 11, fill: '#7880a4'}}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{fontSize: 11, fill: '#7880a4'}} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    border: '1px solid #e8e5f0', borderRadius: '12px',
                    fontSize: '12px', color: '#1e2b71'
                  }}
                />
                <Legend wrapperStyle={{fontSize: '12px', paddingTop: '16px'}} />
                <Line
                  type="monotone" dataKey="units" name="Units Sold"
                  stroke="#e8e5f0" strokeWidth={1.5} dot={false}
                />
                <Line
                  type="monotone" dataKey="rolling7" name="7-day Avg"
                  stroke="#d63683" strokeWidth={2.5} dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Gainers / Losers tabs */}
        <div className="bg-white rounded-2xl border overflow-hidden" style={{borderColor: '#e8e5f0'}}>

          {/* Tabs */}
          <div className="flex border-b" style={{borderColor: '#e8e5f0'}}>
            <button
              onClick={() => setActiveTab('gainers')}
              className="flex-1 py-3.5 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              style={{
                background: activeTab === 'gainers' ? '#f0fdf4' : 'white',
                color: activeTab === 'gainers' ? '#0f9b58' : '#7880a4',
                borderBottom: activeTab === 'gainers' ? '2px solid #0f9b58' : '2px solid transparent'
              }}>
              <TrendingUp size={16} />
              Gaining Momentum ({gainers.length})
            </button>
            <button
              onClick={() => setActiveTab('losers')}
              className="flex-1 py-3.5 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              style={{
                background: activeTab === 'losers' ? '#fef2f2' : 'white',
                color: activeTab === 'losers' ? '#dc2626' : '#7880a4',
                borderBottom: activeTab === 'losers' ? '2px solid #dc2626' : '2px solid transparent'
              }}>
              <TrendingDown size={16} />
              Losing Momentum ({losers.length})
            </button>
          </div>

          {/* SKU list */}
          {activeList.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">
                {activeTab === 'gainers' ? '📈' : '📉'}
              </div>
              <p className="font-medium text-navy">
                {activeTab === 'gainers' ? 'No SKUs gaining momentum yet' : 'No SKUs losing momentum'}
              </p>
              <p className="text-sm mt-1" style={{color: '#7880a4'}}>
                {activeTab === 'gainers'
                  ? 'Add more sales data to see trends emerge'
                  : 'Great! All your SKUs are holding steady or growing'}
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{divideColor: '#f0edf8'}}>
              {activeList.map((metric, index) => {
                const sku = metric.skus
                const growth = parseFloat(metric.growth_rate_pct || 0)
                const drr7 = parseFloat(metric.drr_7d || 0)
                const drr30 = parseFloat(metric.drr_30d || 0)
                const isSelected = selectedSku === metric.sku_id
                const isGainer = activeTab === 'gainers'

                return (
                  <div
                    key={metric.sku_id}
                    onClick={() => setSelectedSku(metric.sku_id)}
                    className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    style={{background: isSelected ? (isGainer ? '#f0fdf4' : '#fef2f2') : 'white'}}
                  >
                    {/* Rank */}
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold"
                      style={{
                        background: isGainer ? '#f0fdf4' : '#fef2f2',
                        color: isGainer ? '#0f9b58' : '#dc2626'
                      }}>
                      {index + 1}
                    </div>

                    {/* SKU info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-navy text-sm truncate">{sku?.item_name}</p>
                      <p className="text-xs truncate" style={{color: '#7880a4'}}>
                        {sku?.sku_code}
                        {sku?.variant_name ? ` · ${sku.variant_name}` : ''}
                      </p>
                    </div>

                    {/* DRR comparison */}
                    <div className="hidden sm:flex items-center gap-4 text-center flex-shrink-0">
                      <div>
                        <p className="text-sm font-bold"
                          style={{color: isGainer ? '#0f9b58' : '#dc2626'}}>
                          {drr7.toFixed(1)}
                        </p>
                        <p className="text-xs" style={{color: '#7880a4'}}>7d avg</p>
                      </div>
                      <div className="text-xs" style={{color: '#b0b4c8'}}>vs</div>
                      <div>
                        <p className="text-sm font-bold text-navy">{drr30.toFixed(1)}</p>
                        <p className="text-xs" style={{color: '#7880a4'}}>30d avg</p>
                      </div>
                    </div>

                    {/* Growth rate */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 px-3 py-1.5 rounded-xl"
                      style={{
                        background: isGainer ? '#f0fdf4' : '#fef2f2',
                        color: isGainer ? '#0f9b58' : '#dc2626'
                      }}>
                      {isGainer
                        ? <TrendingUp size={14} />
                        : <TrendingDown size={14} />
                      }
                      <span className="text-sm font-bold">
                        {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
                      </span>
                    </div>

                    {/* View chart hint */}
                    <div className="text-xs flex-shrink-0" style={{color: '#b0b4c8'}}>
                      {isSelected ? '▲ chart above' : 'click for chart'}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </Layout>
  )
}