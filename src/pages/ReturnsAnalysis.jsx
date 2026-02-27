import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useOrg } from '../hooks/useOrg'
import { supabase } from '../supabaseClient'
import { RefreshCw, ChevronDown, ChevronUp, Package } from 'lucide-react'
import TrainingButton from '../components/TrainingButton'


export default function ReturnsAnalysis() {
  const { org } = useOrg()
  const [skuData, setSkuData] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(30)
  const [expanded, setExpanded] = useState(null)
  const [totalSold, setTotalSold] = useState(0)
  const [totalReturned, setTotalReturned] = useState(0)

  useEffect(() => { if (org) fetchData() }, [org, period])

  async function fetchData() {
    setLoading(true)
    const since = new Date()
    since.setDate(since.getDate() - period)
    const sinceStr = since.toISOString().split('T')[0]

    const { data } = await supabase
      .from('daily_sales')
      .select(`
        sku_id, units_sold, units_returned, gmv, channel,
        skus(item_name, variant_name, sku_code, categories(name), brands_master(name))
      `)
      .eq('org_id', org.id)
      .gte('sale_date', sinceStr)

    if (!data) { setLoading(false); return }

    // Aggregate by SKU
    const bySkuMap = {}
    let tSold = 0, tReturned = 0

    data.forEach(row => {
      const id = row.sku_id
      if (!bySkuMap[id]) {
        bySkuMap[id] = {
          sku_id: id,
          item_name: row.skus?.item_name,
          variant_name: row.skus?.variant_name,
          sku_code: row.skus?.sku_code,
          category: row.skus?.categories?.name || 'Uncategorized',
          brand: row.skus?.brands_master?.name || '',
          units_sold: 0,
          units_returned: 0,
          gmv: 0,
          channels: {},
        }
      }
      bySkuMap[id].units_sold += row.units_sold || 0
      bySkuMap[id].units_returned += row.units_returned || 0
      bySkuMap[id].gmv += parseFloat(row.gmv || 0)

      // Channel breakdown
      const ch = row.channel || 'Unknown'
      if (!bySkuMap[id].channels[ch]) {
        bySkuMap[id].channels[ch] = { units_sold: 0, units_returned: 0 }
      }
      bySkuMap[id].channels[ch].units_sold += row.units_sold || 0
      bySkuMap[id].channels[ch].units_returned += row.units_returned || 0

      tSold += row.units_sold || 0
      tReturned += row.units_returned || 0
    })

    setTotalSold(tSold)
    setTotalReturned(tReturned)

    const result = Object.values(bySkuMap).map(s => ({
      ...s,
      return_rate: s.units_sold > 0
        ? parseFloat(((s.units_returned / s.units_sold) * 100).toFixed(1))
        : 0,
      net_units: s.units_sold - s.units_returned,
    }))

    result.sort((a, b) => b.return_rate - a.return_rate)
    setSkuData(result)
    setLoading(false)
  }

  const overallReturnRate = totalSold > 0
    ? ((totalReturned / totalSold) * 100).toFixed(1)
    : 0

  const highReturnSkus = skuData.filter(s => s.return_rate >= 10).length

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#d63683', borderTopColor: 'transparent' }} />
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-5">

        {/* Header */}
        <TrainingButton title="Returns Training" />
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-navy">Returns Analysis</h1>
            <p className="text-sm mt-0.5" style={{ color: '#7880a4' }}>
              SKUs ranked by return rate · expand any SKU to see channel-wise breakdown
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select value={period} onChange={e => setPeriod(Number(e.target.value))}
              className="px-4 py-2.5 rounded-xl border text-sm text-navy focus:outline-none"
              style={{ borderColor: '#e8e5f0' }}>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border"
              style={{ borderColor: '#e8e5f0', color: '#7880a4', background: 'white' }}>
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: 'Units Sold',
              value: totalSold.toLocaleString('en-IN'),
              sub: `Last ${period} days`,
              color: '#1e2b71', bg: '#f0f1fa',
            },
            {
              label: 'Units Returned',
              value: totalReturned.toLocaleString('en-IN'),
              sub: `Last ${period} days`,
              color: '#dc2626', bg: '#fef2f2',
            },
            {
              label: 'Overall Return Rate',
              value: `${overallReturnRate}%`,
              sub: overallReturnRate > 10 ? '⚠ High — investigate' : '✓ Within range',
              color: overallReturnRate > 10 ? '#dc2626' : '#0f9b58',
              bg: overallReturnRate > 10 ? '#fef2f2' : '#f0fdf4',
            },
            {
              label: 'High Return SKUs',
              value: highReturnSkus,
              sub: 'Return rate ≥ 10%',
              color: highReturnSkus > 0 ? '#dc2626' : '#0f9b58',
              bg: highReturnSkus > 0 ? '#fef2f2' : '#f0fdf4',
            },
          ].map(({ label, value, sub, color, bg }) => (
            <div key={label} className="rounded-2xl border p-5"
              style={{ background: bg, borderColor: '#e8e5f0' }}>
              <p className="text-xs font-medium uppercase tracking-wider mb-2"
                style={{ color: '#7880a4' }}>{label}</p>
              <p className="text-3xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs mt-1 font-medium" style={{ color }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* SKU Table */}
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#e8e5f0' }}>

          {skuData.length === 0 ? (
            <div className="text-center py-16">
              <Package size={40} className="mx-auto mb-3" style={{ color: '#b0b4c8' }} />
              <p className="font-medium text-navy">No sales data found</p>
              <p className="text-sm mt-1" style={{ color: '#7880a4' }}>
                Enter daily sales with return data to see analysis
              </p>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="grid px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b"
                style={{
                  gridTemplateColumns: '2fr 90px 90px 90px 110px 100px 40px',
                  borderColor: '#e8e5f0', color: '#7880a4', background: '#f8f7fc'
                }}>
                <span>Product</span>
                <span className="text-center">Sold</span>
                <span className="text-center">Returned</span>
                <span className="text-center">Net</span>
                <span className="text-center">Return Rate</span>
                <span className="text-center">Risk</span>
                <span></span>
              </div>

              {skuData.map(sku => {
                const isHigh = sku.return_rate >= 10
                const isMed = sku.return_rate >= 5 && sku.return_rate < 10
                const isExpanded = expanded === sku.sku_id
                const channelList = Object.entries(sku.channels || {})

                return (
                  <div key={sku.sku_id}>
                    {/* SKU row */}
                    <div
                      className="grid items-center px-5 py-4 border-b hover:bg-gray-50 cursor-pointer"
                      style={{
                        gridTemplateColumns: '2fr 90px 90px 90px 110px 100px 40px',
                        borderColor: '#f0edf8',
                        background: isHigh ? '#fff8f8' : 'white',
                      }}
                      onClick={() => setExpanded(isExpanded ? null : sku.sku_id)}
                    >
                      {/* Product */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-1.5 h-10 rounded-full flex-shrink-0"
                          style={{ background: isHigh ? '#dc2626' : isMed ? '#d97706' : '#0f9b58' }} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-navy truncate">{sku.item_name}</p>
                          <p className="text-xs truncate" style={{ color: '#7880a4' }}>
                            {sku.sku_code}
                            {sku.variant_name ? ` · ${sku.variant_name}` : ''}
                            {sku.category ? ` · ${sku.category}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="text-center">
                        <p className="text-sm font-semibold text-navy">{sku.units_sold}</p>
                      </div>

                      <div className="text-center">
                        <p className="text-sm font-semibold"
                          style={{ color: sku.units_returned > 0 ? '#dc2626' : '#7880a4' }}>
                          {sku.units_returned}
                        </p>
                      </div>

                      <div className="text-center">
                        <p className="text-sm font-semibold text-navy">{sku.net_units}</p>
                      </div>

                      {/* Return rate with bar */}
                      <div className="flex flex-col items-center gap-1">
                        <p className="text-sm font-bold"
                          style={{ color: isHigh ? '#dc2626' : isMed ? '#d97706' : '#0f9b58' }}>
                          {sku.return_rate}%
                        </p>
                        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: '#f0edf8' }}>
                          <div className="h-full rounded-full"
                            style={{
                              width: `${Math.min(sku.return_rate * 5, 100)}%`,
                              background: isHigh ? '#dc2626' : isMed ? '#d97706' : '#0f9b58'
                            }} />
                        </div>
                      </div>

                      {/* Risk badge */}
                      <div className="flex justify-center">
                        {isHigh ? (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                            style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                            🔴 High
                          </span>
                        ) : isMed ? (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                            style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>
                            ⚡ Medium
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                            style={{ background: '#f0fdf4', color: '#0f9b58', border: '1px solid #bbf7d0' }}>
                            ✓ Normal
                          </span>
                        )}
                      </div>

                      {/* Expand icon */}
                      <div className="flex justify-center">
                        {isExpanded
                          ? <ChevronUp size={16} style={{ color: '#7880a4' }} />
                          : <ChevronDown size={16} style={{ color: '#7880a4' }} />
                        }
                      </div>
                    </div>

                    {/* Channel breakdown — expanded */}
                    {isExpanded && (
                      <div className="border-b px-5 py-4"
                        style={{ background: '#f8f7fc', borderColor: '#f0edf8' }}>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-3"
                          style={{ color: '#7880a4' }}>
                          Channel-wise Breakdown
                        </p>
                        {channelList.length === 0 ? (
                          <p className="text-sm" style={{ color: '#7880a4' }}>No channel data available</p>
                        ) : (
                          <div className="space-y-2">
                            {channelList.map(([channel, stats]) => {
                              const chReturnRate = stats.units_sold > 0
                                ? parseFloat(((stats.units_returned / stats.units_sold) * 100).toFixed(1))
                                : 0
                              const chHigh = chReturnRate >= 10
                              const chMed = chReturnRate >= 5 && chReturnRate < 10

                              return (
                                <div key={channel}
                                  className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border"
                                  style={{ borderColor: '#e8e5f0' }}>
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                                      style={{ background: '#f0f1fa' }}>
                                      {channel === 'Amazon' ? '🛒'
                                        : channel === 'Flipkart' ? '🛍'
                                          : channel === 'Meesho' ? '🏷'
                                            : channel === 'D2C Website' ? '🌐'
                                              : '📦'}
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-navy">{channel}</p>
                                      <p className="text-xs" style={{ color: '#7880a4' }}>
                                        {stats.units_sold} sold · {stats.units_returned} returned
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="text-right">
                                      <p className="text-sm font-bold"
                                        style={{ color: chHigh ? '#dc2626' : chMed ? '#d97706' : '#0f9b58' }}>
                                        {chReturnRate}% return rate
                                      </p>
                                    </div>
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                                      style={{
                                        background: chHigh ? '#fef2f2' : chMed ? '#fffbeb' : '#f0fdf4',
                                        color: chHigh ? '#dc2626' : chMed ? '#d97706' : '#0f9b58',
                                        border: `1px solid ${chHigh ? '#fecaca' : chMed ? '#fde68a' : '#bbf7d0'}`
                                      }}>
                                      {chHigh ? '🔴 High' : chMed ? '⚡ Medium' : '✓ Normal'}
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Root cause hint */}
                        {isHigh && (
                          <div className="mt-3 flex items-start gap-2 px-4 py-3 rounded-xl"
                            style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                            <span className="text-base">💡</span>
                            <p className="text-xs" style={{ color: '#dc2626' }}>
                              <strong>Investigate:</strong> Check if returns are concentrated on one channel.
                              High returns on Meesho often indicate price-sensitive buyers or listing mismatch.
                              High returns on Amazon may indicate quality or packaging issues.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}
        </div>

      </div>
    </Layout>
  )
}