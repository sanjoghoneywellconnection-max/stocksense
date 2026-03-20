import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { Plus, ChevronDown, ChevronUp, Package, AlertTriangle } from 'lucide-react'

const STATUS_CONFIG = {
  active:       { label: 'Active',        bg: '#f0fdf4', color: '#0f9b58', border: '#bbf7d0' },
  inactive:     { label: 'Inactive',      bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  discontinued: { label: 'Discontinued',  bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
}

export default function SkusTab({ orgId }) {
  const [skus, setSkus] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [expandedSku, setExpandedSku] = useState(null)
  const [statusFilter, setStatusFilter] = useState('active')
  const [deleteConfirm, setDeleteConfirm] = useState(null) // sku id awaiting confirm
  const [deleteInput, setDeleteInput] = useState('')
  const [counts, setCounts] = useState({ active: 0, inactive: 0, discontinued: 0 })

  const [form, setForm] = useState({
    sku_code: '', item_name: '', variant_name: '',
    parent_asin: '', child_asin: '',
    brand_id: '', category_id: '',
    mrp: '', cost_price: '', selling_price: '',
    lead_time_days: '', lead_time_type: 'procurement',
    vendor_name: '', minimum_order_qty: '1',
    hsn_code: '',
    opening_date: new Date().toISOString().split('T')[0],
    warehouse_stocks: []
  })

  useEffect(() => { fetchAll() }, [orgId, statusFilter])

  async function fetchAll() {
    const [skuRes, catRes, brandRes, whRes, countRes] = await Promise.all([
      supabase.from('skus').select(`
        *, brands_master(name), categories(name),
        sku_warehouse_stock(current_qty, opening_qty, opening_date, warehouses(name))
      `).eq('org_id', orgId).eq('status', statusFilter).order('item_name'),
      supabase.from('categories').select('*').eq('org_id', orgId).order('name'),
      supabase.from('brands_master').select('*').eq('org_id', orgId).order('name'),
      supabase.from('warehouses').select('*').eq('org_id', orgId).eq('is_active', true).order('name'),
      supabase.from('skus').select('status').eq('org_id', orgId),
    ])

    setSkus(skuRes.data || [])
    setCategories(catRes.data || [])
    setBrands(brandRes.data || [])
    const whs = whRes.data || []
    setWarehouses(whs)
    setForm(p => ({
      ...p,
      warehouse_stocks: whs.map(w => ({ warehouse_id: w.id, warehouse_name: w.name, qty: '' }))
    }))

    // Count by status
    const all = countRes.data || []
    setCounts({
      active:       all.filter(s => s.status === 'active').length,
      inactive:     all.filter(s => s.status === 'inactive').length,
      discontinued: all.filter(s => s.status === 'discontinued').length,
    })
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
  }

  function handleStockChange(warehouseId, qty) {
    setForm(p => ({
      ...p,
      warehouse_stocks: p.warehouse_stocks.map(ws =>
        ws.warehouse_id === warehouseId ? { ...ws, qty } : ws
      )
    }))
  }

  async function addSku(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const { data: sku, error: skuError } = await supabase
        .from('skus')
        .insert({
          org_id: orgId,
          sku_code: form.sku_code,
          item_name: form.item_name,
          variant_name: form.variant_name || null,
          parent_asin: form.parent_asin || null,
          child_asin: form.child_asin || null,
          brand_id: form.brand_id || null,
          category_id: form.category_id || null,
          mrp: parseFloat(form.mrp),
          cost_price: parseFloat(form.cost_price),
          selling_price: parseFloat(form.selling_price),
          lead_time_days: parseInt(form.lead_time_days),
          lead_time_type: form.lead_time_type,
          vendor_name: form.vendor_name || null,
          minimum_order_qty: parseInt(form.minimum_order_qty) || 1,
          hsn_code: form.hsn_code || null,
          is_active: true,
          status: 'active',
        })
        .select()
        .single()

      if (skuError) throw skuError

      const stockInserts = form.warehouse_stocks
        .filter(ws => ws.qty !== '' && parseInt(ws.qty) >= 0)
        .map(ws => ({
          org_id: orgId,
          sku_id: sku.id,
          warehouse_id: ws.warehouse_id,
          opening_qty: parseInt(ws.qty),
          opening_date: form.opening_date,
          current_qty: parseInt(ws.qty),
        }))

      if (stockInserts.length > 0) {
        await supabase.from('sku_warehouse_stock').insert(stockInserts)
      }

      setShowForm(false)
      setForm(p => ({
        sku_code: '', item_name: '', variant_name: '',
        parent_asin: '', child_asin: '',
        brand_id: '', category_id: '',
        mrp: '', cost_price: '', selling_price: '',
        lead_time_days: '', lead_time_type: 'procurement',
        vendor_name: '', minimum_order_qty: '1', hsn_code: '',
        opening_date: new Date().toISOString().split('T')[0],
        warehouse_stocks: warehouses.map(w => ({ warehouse_id: w.id, warehouse_name: w.name, qty: '' }))
      }))
      await fetchAll()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function changeStatus(skuId, newStatus) {
    await supabase.from('skus')
      .update({ status: newStatus, is_active: newStatus === 'active' })
      .eq('id', skuId)

    // If deactivating — remove from sku_metrics so it stops showing in recommendations
    if (newStatus !== 'active') {
      await supabase.from('sku_metrics').delete().eq('sku_id', skuId)
    }

    setExpandedSku(null)
    await fetchAll()
  }

  async function hardDeleteSku(skuId) {
    if (deleteInput !== 'DELETE') return
    // Delete in order — child records first
    await supabase.from('sku_metrics').delete().eq('sku_id', skuId)
    await supabase.from('daily_sales').delete().eq('sku_id', skuId)
    await supabase.from('sku_warehouse_stock').delete().eq('sku_id', skuId)
    await supabase.from('skus').delete().eq('id', skuId)
    setDeleteConfirm(null)
    setDeleteInput('')
    await fetchAll()
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border p-6" style={{borderColor: '#e8e5f0'}}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h2 className="font-semibold text-navy">SKU Master</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{background: '#d63683'}}>
            <Plus size={15} /> Add SKU
          </button>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {[
            { key: 'active',       label: 'Active',        count: counts.active },
            { key: 'inactive',     label: 'Inactive',      count: counts.inactive },
            { key: 'discontinued', label: 'Discontinued',  count: counts.discontinued },
          ].map(({ key, label, count }) => {
            const s = STATUS_CONFIG[key]
            const isSelected = statusFilter === key
            return (
              <button key={key}
                onClick={() => { setStatusFilter(key); setExpandedSku(null) }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all"
                style={{
                  background: isSelected ? s.bg : 'white',
                  color: isSelected ? s.color : '#7880a4',
                  borderColor: isSelected ? s.border : '#e8e5f0',
                }}>
                {label}
                <span className="px-1.5 py-0.5 rounded-lg text-xs font-bold"
                  style={{
                    background: isSelected ? s.color : '#e8e5f0',
                    color: isSelected ? 'white' : '#7880a4',
                  }}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Info banners per status */}
        {statusFilter === 'inactive' && (
          <div className="flex items-start gap-3 p-4 rounded-xl mb-4 text-sm"
            style={{background: '#fffbeb', border: '1px solid #fde68a', color: '#d97706'}}>
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <p>Inactive SKUs are hidden from all recommendations. Sales history is fully preserved. You can reactivate anytime.</p>
          </div>
        )}
        {statusFilter === 'discontinued' && (
          <div className="flex items-start gap-3 p-4 rounded-xl mb-4 text-sm"
            style={{background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626'}}>
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <p>Discontinued SKUs are permanently removed from all screens. Sales history is preserved for reporting. Use hard delete only if you want to wipe all data.</p>
          </div>
        )}

        {warehouses.length === 0 && (
          <div className="p-4 rounded-xl mb-4 text-sm" style={{background: '#fff3ec', color: '#d63683', border: '1px solid #ffc7a3'}}>
            ⚠️ Please add at least one warehouse before adding SKUs.
          </div>
        )}

        {/* Add SKU form */}
        {showForm && warehouses.length > 0 && (
          <form onSubmit={addSku} className="mb-6 p-5 rounded-xl border space-y-5" style={{borderColor: '#e8e5f0', background: '#f8f7fc'}}>
            <p className="text-xs font-semibold text-navy uppercase tracking-wider">Product Details</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-navy mb-1">SKU Code *</label>
                <input name="sku_code" value={form.sku_code} onChange={handleChange} required
                  placeholder="e.g. SKU-001"
                  className="w-full px-3 py-2.5 rounded-xl border text-navy text-sm focus:outline-none focus:ring-2 focus:ring-pink"
                  style={{borderColor: '#e8e5f0'}} />
              </div>
              <div>
                <label className="block text-xs font-medium text-navy mb-1">Item Name *</label>
                <input name="item_name" value={form.item_name} onChange={handleChange} required
                  placeholder="e.g. Vitamin C Face Serum"
                  className="w-full px-3 py-2.5 rounded-xl border text-navy text-sm focus:outline-none focus:ring-2 focus:ring-pink"
                  style={{borderColor: '#e8e5f0'}} />
              </div>
              <div>
                <label className="block text-xs font-medium text-navy mb-1">Variant</label>
                <input name="variant_name" value={form.variant_name} onChange={handleChange}
                  placeholder="e.g. 30ml / Rose"
                  className="w-full px-3 py-2.5 rounded-xl border text-navy text-sm focus:outline-none focus:ring-2 focus:ring-pink"
                  style={{borderColor: '#e8e5f0'}} />
              </div>
              <div>
                <label className="block text-xs font-medium text-navy mb-1">Brand</label>
                <select name="brand_id" value={form.brand_id} onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-xl border text-navy text-sm focus:outline-none"
                  style={{borderColor: '#e8e5f0'}}>
                  <option value="">Select brand</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-navy mb-1">Category</label>
                <select name="category_id" value={form.category_id} onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-xl border text-navy text-sm focus:outline-none"
                  style={{borderColor: '#e8e5f0'}}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-navy mb-1">Parent ASIN</label>
                <input name="parent_asin" value={form.parent_asin} onChange={handleChange}
                  placeholder="Amazon Parent ASIN"
                  className="w-full px-3 py-2.5 rounded-xl border text-navy text-sm focus:outline-none"
                  style={{borderColor: '#e8e5f0'}} />
              </div>
              <div>
                <label className="block text-xs font-medium text-navy mb-1">Child ASIN</label>
                <input name="child_asin" value={form.child_asin} onChange={handleChange}
                  placeholder="Amazon Child ASIN"
                  className="w-full px-3 py-2.5 rounded-xl border text-navy text-sm focus:outline-none"
                  style={{borderColor: '#e8e5f0'}} />
              </div>
              <div>
                <label className="block text-xs font-medium text-navy mb-1">HSN Code</label>
                <input name="hsn_code" value={form.hsn_code} onChange={handleChange}
                  placeholder="e.g. 3304"
                  className="w-full px-3 py-2.5 rounded-xl border text-navy text-sm focus:outline-none"
                  style={{borderColor: '#e8e5f0'}} />
              </div>
            </div>

            <p className="text-xs font-semibold text-navy uppercase tracking-wider pt-2">Pricing</p>
            <div className="grid grid-cols-3 gap-4">
              {[['mrp','MRP (Rs.)'],['cost_price','Cost Price (Rs.)'],['selling_price','Selling Price (Rs.)']].map(([n,l]) => (
                <div key={n}>
                  <label className="block text-xs font-medium text-navy mb-1">{l} *</label>
                  <input name={n} value={form[n]} onChange={handleChange} required type="number" step="0.01"
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 rounded-xl border text-navy text-sm focus:outline-none"
                    style={{borderColor: '#e8e5f0'}} />
                </div>
              ))}
            </div>

            <p className="text-xs font-semibold text-navy uppercase tracking-wider pt-2">Lead Time & Procurement</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-navy mb-1">Lead Time (days) *</label>
                <input name="lead_time_days" value={form.lead_time_days} onChange={handleChange} required type="number"
                  placeholder="e.g. 15"
                  className="w-full px-3 py-2.5 rounded-xl border text-navy text-sm focus:outline-none"
                  style={{borderColor: '#e8e5f0'}} />
              </div>
              <div>
                <label className="block text-xs font-medium text-navy mb-1">Lead Time Type *</label>
                <select name="lead_time_type" value={form.lead_time_type} onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-xl border text-navy text-sm focus:outline-none"
                  style={{borderColor: '#e8e5f0'}}>
                  <option value="procurement">Procurement (from vendor)</option>
                  <option value="manufacturing">Manufacturing (self-produced)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-navy mb-1">Vendor / MFG Name</label>
                <input name="vendor_name" value={form.vendor_name} onChange={handleChange}
                  placeholder="e.g. ABC Pharma Pvt Ltd"
                  className="w-full px-3 py-2.5 rounded-xl border text-navy text-sm focus:outline-none"
                  style={{borderColor: '#e8e5f0'}} />
              </div>
              <div>
                <label className="block text-xs font-medium text-navy mb-1">Min. Order Qty (MOQ)</label>
                <input name="minimum_order_qty" value={form.minimum_order_qty} onChange={handleChange} type="number"
                  placeholder="1"
                  className="w-full px-3 py-2.5 rounded-xl border text-navy text-sm focus:outline-none"
                  style={{borderColor: '#e8e5f0'}} />
              </div>
            </div>

            <p className="text-xs font-semibold text-navy uppercase tracking-wider pt-2">Opening Stock (Day Zero)</p>
            <div className="mb-3">
              <label className="block text-xs font-medium text-navy mb-1">As of Date *</label>
              <input name="opening_date" value={form.opening_date} onChange={handleChange} required type="date"
                className="px-3 py-2.5 rounded-xl border text-navy text-sm focus:outline-none"
                style={{borderColor: '#e8e5f0'}} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {form.warehouse_stocks.map(ws => (
                <div key={ws.warehouse_id}>
                  <label className="block text-xs font-medium text-navy mb-1">{ws.warehouse_name}</label>
                  <input
                    type="number"
                    value={ws.qty}
                    onChange={e => handleStockChange(ws.warehouse_id, e.target.value)}
                    placeholder="0 units"
                    className="w-full px-3 py-2.5 rounded-xl border text-navy text-sm focus:outline-none"
                    style={{borderColor: '#e8e5f0'}}
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{background: '#d63683'}}>
                {loading ? 'Saving...' : 'Save SKU'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium"
                style={{background: '#e8e5f0', color: '#7880a4'}}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* SKU List */}
        <div className="space-y-2">
          {skus.length === 0 && (
            <div className="text-center py-12">
              <Package size={40} className="mx-auto mb-3" style={{color: '#b0b4c8'}} />
              <p className="text-sm font-medium text-navy mb-1">
                No {statusFilter} SKUs
              </p>
              <p className="text-xs" style={{color: '#b0b4c8'}}>
                {statusFilter === 'active' ? 'Add your first SKU using the button above' : `No SKUs marked as ${statusFilter} yet`}
              </p>
            </div>
          )}

          {skus.map(sku => {
            const s = STATUS_CONFIG[sku.status || 'active']
            return (
              <div key={sku.id} className="rounded-xl border overflow-hidden" style={{borderColor: '#e8e5f0'}}>

                {/* Row header */}
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedSku(expandedSku === sku.id ? null : sku.id)}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{background: '#fff3ec'}}>
                      <Package size={14} style={{color: '#d63683'}} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-navy">{sku.item_name}</p>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-lg"
                          style={{background: s.bg, color: s.color, border: `1px solid ${s.border}`}}>
                          {s.label}
                        </span>
                      </div>
                      <p className="text-xs" style={{color: '#7880a4'}}>
                        {sku.sku_code}
                        {sku.variant_name ? ` · ${sku.variant_name}` : ''}
                        {sku.brands_master ? ` · ${sku.brands_master.name}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs font-semibold text-navy">
                        {sku.sku_warehouse_stock?.reduce((sum, s) => sum + (s.current_qty || 0), 0) || 0} units
                      </p>
                      <p className="text-xs" style={{color: '#7880a4'}}>{sku.lead_time_days}d lead time</p>
                    </div>
                    {expandedSku === sku.id
                      ? <ChevronUp size={16} style={{color: '#7880a4'}} />
                      : <ChevronDown size={16} style={{color: '#7880a4'}} />}
                  </div>
                </div>

                {/* Expanded detail */}
                {expandedSku === sku.id && (
                  <div className="px-4 py-4 border-t space-y-4"
                    style={{borderColor: '#e8e5f0', background: '#f8f7fc'}}>

                    {/* SKU details */}
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div><span style={{color: '#7880a4'}}>MRP</span><p className="font-medium text-navy">Rs. {sku.mrp}</p></div>
                      <div><span style={{color: '#7880a4'}}>Cost</span><p className="font-medium text-navy">Rs. {sku.cost_price}</p></div>
                      <div><span style={{color: '#7880a4'}}>Selling Price</span><p className="font-medium text-navy">Rs. {sku.selling_price}</p></div>
                      <div><span style={{color: '#7880a4'}}>Lead Time Type</span><p className="font-medium text-navy capitalize">{sku.lead_time_type}</p></div>
                      <div><span style={{color: '#7880a4'}}>MOQ</span><p className="font-medium text-navy">{sku.minimum_order_qty} units</p></div>
                      <div><span style={{color: '#7880a4'}}>Category</span><p className="font-medium text-navy">{sku.categories?.name || '—'}</p></div>
                    </div>

                    {sku.sku_warehouse_stock?.length > 0 && (
                      <div className="text-xs">
                        <p style={{color: '#7880a4'}} className="mb-1">Stock by warehouse:</p>
                        <div className="flex gap-3 flex-wrap">
                          {sku.sku_warehouse_stock.map(s => (
                            <span key={s.warehouses?.name} className="px-2.5 py-1 rounded-lg font-medium"
                              style={{background: '#e8f4f0', color: '#0f9b58'}}>
                              {s.warehouses?.name}: {s.current_qty} units
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Status actions */}
                    <div className="border-t pt-4" style={{borderColor: '#e8e5f0'}}>
                      <p className="text-xs font-semibold text-navy mb-3 uppercase tracking-wider">Change Status</p>
                      <div className="flex gap-2 flex-wrap">
                        {sku.status !== 'active' && (
                          <button onClick={() => changeStatus(sku.id, 'active')}
                            className="px-4 py-2 rounded-xl text-xs font-semibold border transition-all"
                            style={{background: '#f0fdf4', color: '#0f9b58', border: '1px solid #bbf7d0'}}>
                            ✓ Set Active
                          </button>
                        )}
                        {sku.status !== 'inactive' && (
                          <button onClick={() => changeStatus(sku.id, 'inactive')}
                            className="px-4 py-2 rounded-xl text-xs font-semibold border transition-all"
                            style={{background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a'}}>
                            ⏸ Set Inactive
                          </button>
                        )}
                        {sku.status !== 'discontinued' && (
                          <button onClick={() => changeStatus(sku.id, 'discontinued')}
                            className="px-4 py-2 rounded-xl text-xs font-semibold border transition-all"
                            style={{background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca'}}>
                            ✕ Discontinue
                          </button>
                        )}
                        <button
                          onClick={() => { setDeleteConfirm(sku.id); setDeleteInput('') }}
                          className="ml-auto px-4 py-2 rounded-xl text-xs font-semibold border transition-all"
                          style={{background: '#fff', color: '#b0b4c8', border: '1px solid #e8e5f0'}}>
                          🗑 Permanently Delete
                        </button>
                      </div>

                      {/* Hard delete confirmation */}
                      {deleteConfirm === sku.id && (
                        <div className="mt-4 p-4 rounded-xl border"
                          style={{background: '#fef2f2', borderColor: '#fecaca'}}>
                          <p className="text-xs font-bold text-red-600 mb-1">⚠️ This will permanently delete this SKU</p>
                          <p className="text-xs mb-3" style={{color: '#dc2626'}}>
                            All sales history, stock records, and metrics for this SKU will be wiped forever. This cannot be undone.
                          </p>
                          <p className="text-xs font-semibold text-navy mb-2">Type DELETE to confirm:</p>
                          <div className="flex gap-2">
                            <input
                              value={deleteInput}
                              onChange={e => setDeleteInput(e.target.value)}
                              placeholder="Type DELETE"
                              className="px-3 py-2 rounded-xl border text-sm font-mono focus:outline-none"
                              style={{borderColor: '#fecaca', width: '140px'}}
                            />
                            <button
                              onClick={() => hardDeleteSku(sku.id)}
                              disabled={deleteInput !== 'DELETE'}
                              className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all"
                              style={{
                                background: deleteInput === 'DELETE' ? '#dc2626' : '#f0edf8',
                                color: deleteInput === 'DELETE' ? 'white' : '#b0b4c8',
                                cursor: deleteInput === 'DELETE' ? 'pointer' : 'not-allowed',
                              }}>
                              Delete Everything
                            </button>
                            <button
                              onClick={() => { setDeleteConfirm(null); setDeleteInput('') }}
                              className="px-4 py-2 rounded-xl text-xs font-semibold"
                              style={{background: '#e8e5f0', color: '#7880a4'}}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}