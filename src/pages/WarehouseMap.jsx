import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useOrg } from '../hooks/useOrg'
import { supabase } from '../supabaseClient'
import { Warehouse, Package, TrendingUp, AlertTriangle, RefreshCw, MapPin } from 'lucide-react'

const TYPE_CONFIG = {
  fba:  { label: 'FBA',  color: '#d63683', bg: '#fff0f7' },
  self: { label: 'Self', color: '#1e2b71', bg: '#f0f1fa' },
  '3pl': { label: '3PL', color: '#f97316', bg: '#fff7ed' },
}

const DOC_CONFIG = {
  green: { label: 'Healthy',  color: '#0f9b58', bg: '#f0fdf4', border: '#bbf7d0' },
  amber: { label: 'Plan Now', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  red:   { label: 'Act Now',  color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  black: { label: 'Critical', color: '#111827', bg: '#f3f4f6', border: '#d1d5db' },
}

export default function WarehouseMap() {
  const { org } = useOrg()
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [skuDetails, setSkuDetails] = useState([])
  const [loadingSkus, setLoadingSkus] = useState(false)

  useEffect(() => { if (org) fetchWarehouses() }, [org])
  useEffect(() => { if (selected) fetchSkuDetails(selected) }, [selected])

  async function fetchWarehouses() {
    setLoading(true)

    const { data: whs } = await supabase
      .from('warehouses')
      .select('*')
      .eq('org_id', org.id)
      .eq('is_active', true)
      .order('name')

    if (!whs) { setLoading(false); return }

    // For each warehouse get stock and metrics
    const enriched = await Promise.all(whs.map(async wh => {
      // Total stock in this warehouse
      const { data: stockData } = await supabase
        .from('sku_warehouse_stock')
        .select('current_qty, sku_id')
        .eq('warehouse_id', wh.id)

      const totalUnits = stockData?.reduce((s, r) => s + (r.current_qty || 0), 0) || 0
      const skuCount = stockData?.length || 0
      const skuIds = stockData?.map(s => s.sku_id) || []

      // Get DOC status for each SKU in this warehouse
      let docCounts = { green: 0, amber: 0, red: 0, black: 0 }
      let totalStockValue = 0

      if (skuIds.length > 0) {
        const { data: metrics } = await supabase
          .from('sku_metrics')
          .select('sku_id, doc_status, total_current_stock, skus(cost_price)')
          .in('sku_id', skuIds)
          .order('calculated_on', { ascending: false })

        // Deduplicate
        const seen = new Set()
        const unique = (metrics || []).filter(m => {
          if (seen.has(m.sku_id)) return false
          seen.add(m.sku_id)
          return true
        })

        unique.forEach(m => {
          if (docCounts[m.doc_status] !== undefined) docCounts[m.doc_status]++
          const stock = stockData?.find(s => s.sku_id === m.sku_id)
          if (stock) {
            totalStockValue += (stock.current_qty || 0) * parseFloat(m.skus?.cost_price || 0)
          }
        })
      }

      // Health score — % of SKUs that are green or amber
      const healthyCount = docCounts.green + docCounts.amber
      const healthScore = skuCount > 0 ? Math.round((healthyCount / skuCount) * 100) : 100

      return {
        ...wh,
        totalUnits,
        skuCount,
        docCounts,
        totalStockValue,
        healthScore,
      }
    }))

    setWarehouses(enriched)
    if (enriched.length > 0) setSelected(enriched[0].id)
    setLoading(false)
  }

  async function fetchSkuDetails(warehouseId) {
    setLoadingSkus(true)

    const { data: stockData } = await supabase
      .from('sku_warehouse_stock')
      .select(`
        current_qty, opening_qty, opening_date,
        skus(
          id, sku_code, item_name, variant_name,
          cost_price, selling_price,
          brands_master(name)
        )
      `)
      .eq('warehouse_id', warehouseId)
      .order('current_qty', { ascending: false })

    if (!stockData) { setLoadingSkus(false); return }

    // Get metrics for each SKU
    const skuIds = stockData.map(s => s.skus?.id).filter(Boolean)
    let metricsMap = {}

    if (skuIds.length > 0) {
      const { data: metrics } = await supabase
        .from('sku_metrics')
        .select('sku_id, doc_status, doc_days, drr_30d, reorder_deadline, days_to_reorder')
        .in('sku_id', skuIds)
        .order('calculated_on', { ascending: false })

      const seen = new Set()
      ;(metrics || []).forEach(m => {
        if (!seen.has(m.sku_id)) {
          seen.add(m.sku_id)
          metricsMap[m.sku_id] = m
        }
      })
    }

    const enriched = stockData.map(s => ({
      ...s,
      metrics: metricsMap[s.skus?.id] || null
    }))

    setSkuDetails(enriched)
    setLoadingSkus(false)
  }

  const selectedWh = warehouses.find(w => w.id === selected)

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
          style={{borderColor: '#d63683', borderTopColor: 'transparent'}} />
      </div>
    </Layout>
  )

  if (warehouses.length === 0) return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-navy mb-2">Warehouse Map</h1>
        <div className="bg-white rounded-2xl border p-16 text-center" style={{borderColor: '#e8e5f0'}}>
          <Warehouse size={48} className="mx-auto mb-4" style={{color: '#b0b4c8'}} />
          <p className="font-medium text-navy mb-1">No warehouses set up yet</p>
          <p className="text-sm" style={{color: '#7880a4'}}>
            Go to Master Data to add your warehouses
          </p>
          <a href="/settings"
            className="inline-block mt-4 px-5 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{background: '#d63683'}}>
            → Go to Master Data
          </a>
        </div>
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-navy">Warehouse Map</h1>
          <p className="text-sm mt-0.5" style={{color: '#7880a4'}}>
            {warehouses.length} warehouse{warehouses.length > 1 ? 's' : ''} · Click a warehouse to see its SKU inventory
          </p>
        </div>

        {/* Warehouse cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map(wh => {
            const typeConf = TYPE_CONFIG[wh.type] || TYPE_CONFIG.self
            const isSelected = selected === wh.id
            const urgentCount = (wh.docCounts?.red || 0) + (wh.docCounts?.black || 0)

            return (
              <button
                key={wh.id}
                onClick={() => setSelected(wh.id)}
                className="text-left rounded-2xl border p-5 transition-all hover:shadow-md"
                style={{
                  borderColor: isSelected ? '#1e2b71' : '#e8e5f0',
                  borderWidth: isSelected ? '2px' : '1px',
                  background: isSelected ? '#f8f7fc' : 'white',
                }}
              >
                {/* Warehouse header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{background: typeConf.bg}}>
                      <Warehouse size={18} style={{color: typeConf.color}} />
                    </div>
                    <div>
                      <p className="font-semibold text-navy text-sm">{wh.name}</p>
                      <p className="text-xs flex items-center gap-1 mt-0.5" style={{color: '#7880a4'}}>
                        <MapPin size={10} /> {wh.city}, {wh.state}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-lg"
                    style={{background: typeConf.bg, color: typeConf.color}}>
                    {typeConf.label}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-xl p-3" style={{background: '#f8f7fc'}}>
                    <p className="text-xl font-bold text-navy">{wh.totalUnits.toLocaleString('en-IN')}</p>
                    <p className="text-xs" style={{color: '#7880a4'}}>total units</p>
                  </div>
                  <div className="rounded-xl p-3" style={{background: '#f8f7fc'}}>
                    <p className="text-xl font-bold text-navy">{wh.skuCount}</p>
                    <p className="text-xs" style={{color: '#7880a4'}}>SKUs stored</p>
                  </div>
                </div>

                {/* Stock value */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs" style={{color: '#7880a4'}}>Stock Value</span>
                  <span className="text-sm font-semibold text-navy">
                    Rs. {(wh.totalStockValue / 1000).toFixed(1)}K
                  </span>
                </div>

                {/* Health bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{color: '#7880a4'}}>Stock Health</span>
                    <span className="text-xs font-semibold"
                      style={{color: wh.healthScore >= 80 ? '#0f9b58' : wh.healthScore >= 50 ? '#d97706' : '#dc2626'}}>
                      {wh.healthScore}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{background: '#e8e5f0'}}>
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${wh.healthScore}%`,
                        background: wh.healthScore >= 80 ? '#0f9b58' : wh.healthScore >= 50 ? '#d97706' : '#dc2626'
                      }} />
                  </div>
                </div>

                {/* DOC breakdown */}
                <div className="flex gap-1.5 flex-wrap">
                  {Object.entries(wh.docCounts || {}).map(([status, count]) => {
                    if (count === 0) return null
                    const conf = DOC_CONFIG[status]
                    return (
                      <span key={status}
                        className="text-xs px-2 py-0.5 rounded-lg font-medium"
                        style={{background: conf.bg, color: conf.color, border: `1px solid ${conf.border}`}}>
                        {count} {conf.label}
                      </span>
                    )
                  })}
                  {wh.skuCount === 0 && (
                    <span className="text-xs" style={{color: '#b0b4c8'}}>No SKUs yet</span>
                  )}
                </div>

                {/* Urgent alert */}
                {urgentCount > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl"
                    style={{background: '#fef2f2', color: '#dc2626'}}>
                    <AlertTriangle size={12} />
                    {urgentCount} SKU{urgentCount > 1 ? 's' : ''} need urgent attention
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Selected warehouse detail */}
        {selectedWh && (
          <div className="bg-white rounded-2xl border overflow-hidden" style={{borderColor: '#e8e5f0'}}>

            {/* Detail header */}
            <div className="px-6 py-4 border-b flex items-center justify-between"
              style={{borderColor: '#e8e5f0', background: '#f8f7fc'}}>
              <div className="flex items-center gap-3">
                <Warehouse size={20} style={{color: '#1e2b71'}} />
                <div>
                  <h2 className="font-semibold text-navy">{selectedWh.name}</h2>
                  <p className="text-xs" style={{color: '#7880a4'}}>
                    {selectedWh.city}, {selectedWh.state} · {selectedWh.skuCount} SKUs · {selectedWh.totalUnits.toLocaleString('en-IN')} units total
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-navy">Rs. {(selectedWh.totalStockValue / 1000).toFixed(1)}K</p>
                <p className="text-xs" style={{color: '#7880a4'}}>total stock value</p>
              </div>
            </div>

            {/* SKU list */}
            {loadingSkus ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
                  style={{borderColor: '#d63683', borderTopColor: 'transparent'}} />
              </div>
            ) : skuDetails.length === 0 ? (
              <div className="text-center py-12">
                <Package size={36} className="mx-auto mb-3" style={{color: '#b0b4c8'}} />
                <p className="font-medium text-navy">No SKUs in this warehouse yet</p>
                <p className="text-sm mt-1" style={{color: '#7880a4'}}>
                  Add SKUs with opening stock in Master Data
                </p>
              </div>
            ) : (
              <>
                {/* Table header */}
                <div className="grid px-6 py-3 text-xs font-semibold uppercase tracking-wider border-b"
                  style={{
                    gridTemplateColumns: '2fr 100px 100px 100px 110px 120px',
                    borderColor: '#e8e5f0', color: '#7880a4', background: '#faf9fd'
                  }}>
                  <span>Product</span>
                  <span className="text-center">Stock</span>
                  <span className="text-center">DRR 30d</span>
                  <span className="text-center">DOC</span>
                  <span className="text-center">Status</span>
                  <span className="text-center">Reorder In</span>
                </div>

                {/* SKU rows */}
                <div className="divide-y" style={{divideColor: '#f0edf8'}}>
                  {skuDetails.map((item, i) => {
                    const sku = item.skus
                    const m = item.metrics
                    const doc = DOC_CONFIG[m?.doc_status] || DOC_CONFIG.green
                    const stockPct = selectedWh.totalUnits > 0
                      ? Math.round((item.current_qty / selectedWh.totalUnits) * 100)
                      : 0

                    return (
                      <div key={i}
                        className="grid items-center px-6 py-3.5 hover:bg-gray-50"
                        style={{gridTemplateColumns: '2fr 100px 100px 100px 110px 120px'}}>

                        {/* Product */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-1.5 h-10 rounded-full flex-shrink-0"
                            style={{background: doc.color}} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-navy truncate">{sku?.item_name}</p>
                            <p className="text-xs truncate" style={{color: '#7880a4'}}>
                              {sku?.sku_code}
                              {sku?.variant_name ? ` · ${sku.variant_name}` : ''}
                            </p>
                          </div>
                        </div>

                        {/* Stock */}
                        <div className="text-center">
                          <p className="text-sm font-bold text-navy">{item.current_qty}</p>
                          <p className="text-xs" style={{color: '#b0b4c8'}}>{stockPct}% of WH</p>
                        </div>

                        {/* DRR */}
                        <div className="text-center">
                          <p className="text-sm font-semibold text-navy">
                            {m ? parseFloat(m.drr_30d || 0).toFixed(1) : '—'}
                          </p>
                          {m && <p className="text-xs" style={{color: '#b0b4c8'}}>/day</p>}
                        </div>

                        {/* DOC */}
                        <div className="text-center">
                          <p className="text-sm font-semibold" style={{color: doc.color}}>
                            {m ? (m.doc_days > 0 ? `${parseFloat(m.doc_days).toFixed(0)}d` : 'OOS') : '—'}
                          </p>
                        </div>

                        {/* Status */}
                        <div className="flex justify-center">
                          {m ? (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                              style={{background: doc.bg, color: doc.color, border: `1px solid ${doc.border}`}}>
                              {doc.label}
                            </span>
                          ) : <span className="text-xs" style={{color: '#b0b4c8'}}>No data</span>}
                        </div>

                        {/* Reorder */}
                        <div className="text-center">
                          {m?.days_to_reorder !== null && m?.days_to_reorder !== undefined ? (
                            <p className="text-sm font-semibold"
                              style={{color: m.days_to_reorder <= 7 ? '#dc2626' : m.days_to_reorder <= 14 ? '#d97706' : '#0f9b58'}}>
                              {m.days_to_reorder === 0 ? 'Today!' : `${m.days_to_reorder}d`}
                            </p>
                          ) : <p className="text-xs" style={{color: '#b0b4c8'}}>—</p>}
                        </div>

                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </Layout>
  )
}