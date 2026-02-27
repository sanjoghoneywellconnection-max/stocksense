import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useOrg } from '../hooks/useOrg'
import { supabase } from '../supabaseClient'
import { RefreshCw, Package } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts'

const COLORS = ['#d63683', '#1e2b71', '#0f9b58', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#84cc16']

export default function CategoryContribution() {
  const { org } = useOrg()
  const [categoryData, setCategoryData] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(30)
  const [sortBy, setSortBy] = useState('revenue')
  const [totalGmv, setTotalGmv] = useState(0)
  const [totalUnits, setTotalUnits] = useState(0)

  useEffect(() => { if (org) fetchData() }, [org, period])

  async function fetchData() {
    setLoading(true)
    const since = new Date()
    since.setDate(since.getDate() - period)
    const sinceStr = since.toISOString().split('T')[0]

    const { data } = await supabase
      .from('daily_sales')
      .select(`
        units_sold, units_returned, gmv,
        skus(categories(name))
      `)
      .eq('org_id', org.id)
      .gte('sale_date', sinceStr)

    if (!data) { setLoading(false); return }

    const byCat = {}
    let tGmv = 0, tUnits = 0

    data.forEach(row => {
      const cat = row.skus?.categories?.name || 'Uncategorized'
      if (!byCat[cat]) byCat[cat] = { category: cat, units_sold: 0, units_returned: 0, gmv: 0 }
      byCat[cat].units_sold += row.units_sold || 0
      byCat[cat].units_returned += row.units_returned || 0
      byCat[cat].gmv += parseFloat(row.gmv || 0)
      tGmv += parseFloat(row.gmv || 0)
      tUnits += row.units_sold || 0
    })

    setTotalGmv(tGmv)
    setTotalUnits(tUnits)

    const result = Object.values(byCat).map(c => ({
      ...c,
      revenue_pct: tGmv > 0 ? parseFloat(((c.gmv / tGmv) * 100).toFixed(1)) : 0,
      units_pct: tUnits > 0 ? parseFloat(((c.units_sold / tUnits) * 100).toFixed(1)) : 0,
      return_rate: c.units_sold > 0
        ? parseFloat(((c.units_returned / c.units_sold) * 100).toFixed(1))
        : 0,
      net_units: c.units_sold - c.units_returned,
    }))

    result.sort((a, b) => b.gmv - a.gmv)
    setCategoryData(result)
    setLoading(false)
  }

  const sorted = [...categoryData].sort((a, b) =>
    sortBy === 'revenue' ? b.revenue_pct - a.revenue_pct : b.units_pct - a.units_pct
  )

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
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-navy">Category Contribution</h1>
            <p className="text-sm mt-0.5" style={{color: '#7880a4'}}>
              How much does each category contribute to your total revenue and units
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select value={period} onChange={e => setPeriod(Number(e.target.value))}
              className="px-4 py-2.5 rounded-xl border text-sm text-navy focus:outline-none"
              style={{borderColor: '#e8e5f0'}}>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border"
              style={{borderColor: '#e8e5f0', color: '#7880a4', background: 'white'}}>
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border p-5" style={{background: '#f0f1fa', borderColor: '#e8e5f0'}}>
            <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{color: '#7880a4'}}>Total Revenue</p>
            <p className="text-3xl font-bold text-navy">Rs. {(totalGmv / 1000).toFixed(1)}K</p>
            <p className="text-xs mt-1" style={{color: '#7880a4'}}>Last {period} days</p>
          </div>
          <div className="rounded-2xl border p-5" style={{background: '#f0fdf4', borderColor: '#e8e5f0'}}>
            <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{color: '#7880a4'}}>Total Units Sold</p>
            <p className="text-3xl font-bold text-navy">{totalUnits.toLocaleString('en-IN')}</p>
            <p className="text-xs mt-1" style={{color: '#7880a4'}}>Last {period} days</p>
          </div>
          <div className="rounded-2xl border p-5" style={{background: '#fff0f7', borderColor: '#e8e5f0'}}>
            <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{color: '#7880a4'}}>Categories</p>
            <p className="text-3xl font-bold text-navy">{categoryData.length}</p>
            <p className="text-xs mt-1" style={{color: '#7880a4'}}>Active categories</p>
          </div>
        </div>

        {/* Sort toggle */}
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium text-navy">Sort by:</p>
          <div className="flex rounded-xl overflow-hidden border" style={{borderColor: '#e8e5f0'}}>
            <button
              onClick={() => setSortBy('revenue')}
              className="px-4 py-2 text-sm font-semibold transition-all"
              style={{
                background: sortBy === 'revenue' ? '#1e2b71' : 'white',
                color: sortBy === 'revenue' ? 'white' : '#7880a4',
              }}>
              Revenue % ↓
            </button>
            <button
              onClick={() => setSortBy('units')}
              className="px-4 py-2 text-sm font-semibold transition-all"
              style={{
                background: sortBy === 'units' ? '#1e2b71' : 'white',
                color: sortBy === 'units' ? 'white' : '#7880a4',
              }}>
              Units % ↓
            </button>
          </div>
        </div>

        {categoryData.length === 0 ? (
          <div className="bg-white rounded-2xl border p-16 text-center" style={{borderColor: '#e8e5f0'}}>
            <Package size={40} className="mx-auto mb-3" style={{color: '#b0b4c8'}} />
            <p className="font-medium text-navy">No category data found</p>
            <p className="text-sm mt-1" style={{color: '#7880a4'}}>
              Make sure your SKUs have categories assigned in Master Data
            </p>
          </div>
        ) : (
          <>
            {/* Chart */}
            <div className="bg-white rounded-2xl border p-6" style={{borderColor: '#e8e5f0'}}>
              <h2 className="font-semibold text-navy mb-1">
                {sortBy === 'revenue' ? 'Revenue Contribution' : 'Units Contribution'} by Category
              </h2>
              <p className="text-xs mb-5" style={{color: '#7880a4'}}>
                % of total {sortBy === 'revenue' ? 'revenue (Rs.)' : 'units sold'}
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={sorted}
                  margin={{top: 5, right: 20, left: -10, bottom: 60}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0edf8" />
                  <XAxis
                    dataKey="category"
                    tick={{fontSize: 12, fill: '#7880a4'}}
                    tickLine={false}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    tick={{fontSize: 11, fill: '#7880a4'}}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => `${v}%`}
                  />
                  <Tooltip
                    formatter={(value) => [`${value}%`, sortBy === 'revenue' ? 'Revenue Share' : 'Units Share']}
                    contentStyle={{
                      border: '1px solid #e8e5f0', borderRadius: '12px',
                      fontSize: '12px', color: '#1e2b71'
                    }}
                  />
                  <Bar
                    dataKey={sortBy === 'revenue' ? 'revenue_pct' : 'units_pct'}
                    radius={[8, 8, 0, 0]}>
                    {sorted.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border overflow-hidden" style={{borderColor: '#e8e5f0'}}>

              {/* Table header */}
              <div className="grid px-6 py-3 text-xs font-semibold uppercase tracking-wider border-b"
                style={{
                  gridTemplateColumns: '2fr 110px 100px 110px 110px 100px',
                  borderColor: '#e8e5f0', color: '#7880a4', background: '#f8f7fc'
                }}>
                <span>Category</span>
                <span className="text-center">Revenue</span>
                <span className="text-center">Rev %</span>
                <span className="text-center">Units Sold</span>
                <span className="text-center">Units %</span>
                <span className="text-center">Return Rate</span>
              </div>

              {sorted.map((cat, i) => (
                <div key={cat.category}
                  className="grid items-center px-6 py-4 border-b last:border-0 hover:bg-gray-50"
                  style={{
                    gridTemplateColumns: '2fr 110px 100px 110px 110px 100px',
                    borderColor: '#f0edf8',
                  }}>

                  {/* Category name */}
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{background: COLORS[i % COLORS.length]}} />
                    <div>
                      <p className="text-sm font-semibold text-navy">{cat.category}</p>
                      <p className="text-xs" style={{color: '#7880a4'}}>
                        {cat.units_sold} sold · {cat.units_returned} returned
                      </p>
                    </div>
                  </div>

                  {/* Revenue */}
                  <div className="text-center">
                    <p className="text-sm font-semibold text-navy">
                      Rs. {(cat.gmv / 1000).toFixed(1)}K
                    </p>
                  </div>

                  {/* Revenue % with bar */}
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-sm font-bold" style={{color: COLORS[i % COLORS.length]}}>
                      {cat.revenue_pct}%
                    </p>
                    <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{background: '#f0edf8'}}>
                      <div className="h-full rounded-full"
                        style={{width: `${cat.revenue_pct}%`, background: COLORS[i % COLORS.length]}} />
                    </div>
                  </div>

                  {/* Units */}
                  <div className="text-center">
                    <p className="text-sm font-semibold text-navy">
                      {cat.units_sold.toLocaleString('en-IN')}
                    </p>
                  </div>

                  {/* Units % with bar */}
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-sm font-bold" style={{color: COLORS[i % COLORS.length]}}>
                      {cat.units_pct}%
                    </p>
                    <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{background: '#f0edf8'}}>
                      <div className="h-full rounded-full"
                        style={{width: `${cat.units_pct}%`, background: COLORS[i % COLORS.length]}} />
                    </div>
                  </div>

                  {/* Return rate */}
                  <div className="text-center">
                    <span className="text-sm font-semibold"
                      style={{color: cat.return_rate >= 10 ? '#dc2626' : cat.return_rate >= 5 ? '#d97706' : '#0f9b58'}}>
                      {cat.return_rate}%
                    </span>
                  </div>
                </div>
              ))}

              {/* Total row */}
              <div className="grid items-center px-6 py-4"
                style={{
                  gridTemplateColumns: '2fr 110px 100px 110px 110px 100px',
                  background: '#1e2b71',
                }}>
                <p className="text-sm font-bold text-white">Total</p>
                <p className="text-center text-sm font-bold text-white">
                  Rs. {(totalGmv / 1000).toFixed(1)}K
                </p>
                <p className="text-center text-sm font-bold text-white">100%</p>
                <p className="text-center text-sm font-bold text-white">
                  {totalUnits.toLocaleString('en-IN')}
                </p>
                <p className="text-center text-sm font-bold text-white">100%</p>
                <p className="text-center text-sm font-bold text-white">
                  {totalUnits > 0
                    ? ((categoryData.reduce((s, c) => s + c.units_returned, 0) / totalUnits) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}