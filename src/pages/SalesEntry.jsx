import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useOrg } from '../hooks/useOrg'
import { supabase } from '../supabaseClient'
import { Save, ChevronDown, CheckCircle, ShoppingBag } from 'lucide-react'

const CHANNELS = [
  { value: 'amazon_india', label: 'Amazon India' },
  { value: 'flipkart', label: 'Flipkart' },
  { value: 'meesho', label: 'Meesho' },
]

export default function SalesEntry() {
  const { org } = useOrg()
  const [skus, setSkus] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [channel, setChannel] = useState('amazon_india')
  const [warehouseId, setWarehouseId] = useState('')
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [existingData, setExistingData] = useState({})

  useEffect(() => {
    if (org) fetchMasterData()
  }, [org])

  useEffect(() => {
    if (org && warehouseId && date && channel) fetchExistingEntries()
  }, [org, warehouseId, date, channel])

  async function fetchMasterData() {
    const [skuRes, whRes] = await Promise.all([
      supabase.from('skus').select('id, sku_code, item_name, variant_name')
        .eq('org_id', org.id).eq('is_active', true).order('item_name'),
      supabase.from('warehouses').select('id, name, city')
        .eq('org_id', org.id).eq('is_active', true).order('name'),
    ])
    const skuData = skuRes.data || []
    const whData = whRes.data || []
    setSkus(skuData)
    setWarehouses(whData)
    if (whData.length > 0) setWarehouseId(whData[0].id)
    setEntries(skuData.map(sku => ({
      sku_id: sku.id,
      sku_code: sku.sku_code,
      item_name: sku.item_name,
      variant_name: sku.variant_name,
      units_sold: '',
      units_returned: '',
    })))
  }

  async function fetchExistingEntries() {
    const { data } = await supabase
      .from('daily_sales')
      .select('sku_id, units_sold, units_returned, gmv')
      .eq('org_id', org.id)
      .eq('warehouse_id', warehouseId)
      .eq('channel', channel)
      .eq('sale_date', date)

    const map = {}
    if (data) data.forEach(d => { map[d.sku_id] = d })
    setExistingData(map)

    setEntries(prev => prev.map(e => ({
      ...e,
      units_sold: map[e.sku_id]?.units_sold?.toString() || '',
      units_returned: map[e.sku_id]?.units_returned?.toString() || '',
    })))
  }

  function handleChange(skuId, field, value) {
    setEntries(prev => prev.map(e =>
      e.sku_id === skuId ? { ...e, [field]: value } : e
    ))
  }

  async function handleSave() {
    if (!warehouseId) return
    setLoading(true)
    setSaved(false)

    try {
      const toSave = entries.filter(e =>
        e.units_sold !== '' || e.units_returned !== ''
      )

      if (toSave.length === 0) {
        alert('Please enter at least one sale or return before saving.')
        setLoading(false)
        return
      }

      for (const entry of toSave) {
        const unitsSold = parseInt(entry.units_sold) || 0
        const unitsReturned = parseInt(entry.units_returned) || 0

        const sku = skus.find(s => s.id === entry.sku_id)
        const { data: skuDetails } = await supabase
          .from('skus').select('selling_price').eq('id', entry.sku_id).single()

        const gmv = unitsSold * (skuDetails?.selling_price || 0)

        const existing = existingData[entry.sku_id]

        if (existing) {
          await supabase.from('daily_sales')
            .update({ units_sold: unitsSold, units_returned: unitsReturned, gmv })
            .eq('org_id', org.id)
            .eq('sku_id', entry.sku_id)
            .eq('warehouse_id', warehouseId)
            .eq('channel', channel)
            .eq('sale_date', date)
        } else {
          await supabase.from('daily_sales').insert({
            org_id: org.id,
            sku_id: entry.sku_id,
            warehouse_id: warehouseId,
            channel,
            sale_date: date,
            units_sold: unitsSold,
            units_returned: unitsReturned,
            gmv,
          })
        }
      }

      setSaved(true)
      await fetchExistingEntries()
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      alert('Error saving: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const totalSold = entries.reduce((sum, e) => sum + (parseInt(e.units_sold) || 0), 0)
  const totalReturned = entries.reduce((sum, e) => sum + (parseInt(e.units_returned) || 0), 0)
  const filledCount = entries.filter(e => e.units_sold !== '' || e.units_returned !== '').length

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy">Daily Sales Entry</h1>
          <p className="text-sm mt-1" style={{color: '#7880a4'}}>
            Enter units sold and returned for each SKU. Stock updates automatically when you save.
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl border p-5 mb-5" style={{borderColor: '#e8e5f0'}}>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-navy mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border text-navy text-sm focus:outline-none focus:ring-2 focus:ring-pink"
                style={{borderColor: '#e8e5f0'}}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-navy mb-1.5">Channel</label>
              <select
                value={channel}
                onChange={e => setChannel(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border text-navy text-sm focus:outline-none focus:ring-2 focus:ring-pink"
                style={{borderColor: '#e8e5f0'}}
              >
                {CHANNELS.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-navy mb-1.5">Warehouse</label>
              <select
                value={warehouseId}
                onChange={e => setWarehouseId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border text-navy text-sm focus:outline-none focus:ring-2 focus:ring-pink"
                style={{borderColor: '#e8e5f0'}}
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name} — {w.city}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Summary bar */}
        {filledCount > 0 && (
          <div className="rounded-xl px-5 py-3 mb-4 flex items-center gap-6 text-sm font-medium"
            style={{background: '#fff3ec', border: '1px solid #ffc7a3'}}>
            <span style={{color: '#7880a4'}}>{filledCount} SKUs entered</span>
            <span className="text-navy">{totalSold} units sold</span>
            <span style={{color: '#d63683'}}>{totalReturned} units returned</span>
            <span className="text-navy">Net: {totalSold - totalReturned} units</span>
          </div>
        )}

        {/* SKU Entry Table */}
        <div className="bg-white rounded-2xl border overflow-hidden mb-5" style={{borderColor: '#e8e5f0'}}>
          {/* Table header */}
          <div className="grid px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b"
            style={{gridTemplateColumns: '1fr 120px 120px 80px', borderColor: '#e8e5f0', color: '#7880a4', background: '#f8f7fc'}}>
            <span>Product</span>
            <span className="text-center">Units Sold</span>
            <span className="text-center">Units Returned</span>
            <span className="text-center">Stock</span>
          </div>

          {/* Rows */}
          <div className="divide-y" style={{divideColor: '#e8e5f0'}}>
            {entries.length === 0 && (
              <div className="text-center py-12">
                <ShoppingBag size={36} className="mx-auto mb-3" style={{color: '#b0b4c8'}} />
                <p className="text-sm text-navy font-medium">No SKUs found</p>
                <p className="text-xs mt-1" style={{color: '#b0b4c8'}}>Add SKUs in Master Data → Settings first</p>
              </div>
            )}
            {entries.map(entry => {
              const hasData = existingData[entry.sku_id]
              return (
                <div
                  key={entry.sku_id}
                  className="grid items-center px-5 py-3 hover:bg-gray-50 transition-colors"
                  style={{gridTemplateColumns: '1fr 120px 120px 80px'}}
                >
                  {/* Product name */}
                  <div className="flex items-center gap-3 min-w-0">
                    {hasData && (
                      <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{background: '#d63683'}} />
                    )}
                    {!hasData && (
                      <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{background: '#e8e5f0'}} />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-navy truncate">{entry.item_name}</p>
                      <p className="text-xs truncate" style={{color: '#7880a4'}}>
                        {entry.sku_code}{entry.variant_name ? ` · ${entry.variant_name}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Units sold */}
                  <div className="px-2">
                    <input
                      type="number"
                      min="0"
                      value={entry.units_sold}
                      onChange={e => handleChange(entry.sku_id, 'units_sold', e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl border text-center text-sm text-navy focus:outline-none focus:ring-2 focus:ring-pink transition-all"
                      style={{
                        borderColor: entry.units_sold ? '#d63683' : '#e8e5f0',
                        background: entry.units_sold ? '#fff3ec' : 'white'
                      }}
                    />
                  </div>

                  {/* Units returned */}
                  <div className="px-2">
                    <input
                      type="number"
                      min="0"
                      value={entry.units_returned}
                      onChange={e => handleChange(entry.sku_id, 'units_returned', e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl border text-center text-sm text-navy focus:outline-none focus:ring-2 focus:ring-pink transition-all"
                      style={{
                        borderColor: entry.units_returned ? '#ffc7a3' : '#e8e5f0',
                        background: entry.units_returned ? '#fff9f5' : 'white'
                      }}
                    />
                  </div>

                  {/* Current stock */}
                  <StockBadge orgId={org?.id} skuId={entry.sku_id} warehouseId={warehouseId} />
                </div>
              )
            })}
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{color: '#b0b4c8'}}>
            Only rows with values entered will be saved. Empty rows are skipped.
          </p>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all"
            style={{background: saved ? '#0f9b58' : loading ? '#9ca3af' : '#d63683'}}
          >
            {saved ? (
              <><CheckCircle size={18} /> Saved!</>
            ) : loading ? (
              <>Saving...</>
            ) : (
              <><Save size={18} /> Save Sales Data</>
            )}
          </button>
        </div>

      </div>
    </Layout>
  )
}

// Shows live current stock for each SKU in the selected warehouse
function StockBadge({ orgId, skuId, warehouseId }) {
  const [qty, setQty] = useState(null)

  useEffect(() => {
    if (!orgId || !skuId || !warehouseId) return
    supabase
      .from('sku_warehouse_stock')
      .select('current_qty')
      .eq('sku_id', skuId)
      .eq('warehouse_id', warehouseId)
      .single()
      .then(({ data }) => setQty(data?.current_qty ?? null))
  }, [orgId, skuId, warehouseId])

  if (qty === null) return <div className="text-center text-xs" style={{color: '#b0b4c8'}}>—</div>

  const color = qty <= 0 ? '#ef4444' : qty < 20 ? '#f97316' : '#0f9b58'

  return (
    <div className="text-center">
      <span className="text-sm font-semibold" style={{color}}>{qty}</span>
    </div>
  )
}