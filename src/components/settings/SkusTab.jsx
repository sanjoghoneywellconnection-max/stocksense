import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { Plus, Trash2, ChevronDown, ChevronUp, Package } from 'lucide-react'

export default function SkusTab({ orgId }) {
  const [skus, setSkus] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [expandedSku, setExpandedSku] = useState(null)

  const [form, setForm] = useState({
    sku_code: '', item_name: '', variant_name: '',
    parent_asin: '', child_asin: '',
    brand_id: '', category_id: '',
    mrp: '', cost_price: '', selling_price: '',
    lead_time_days: '', lead_time_type: 'procurement',
    vendor_name: '', minimum_order_qty: '1',
    hsn_code: '',
    // Opening stock
    opening_date: new Date().toISOString().split('T')[0],
    warehouse_stocks: []
  })

  useEffect(() => { fetchAll() }, [orgId])

  async function fetchAll() {
    const [skuRes, catRes, brandRes, whRes] = await Promise.all([
      supabase.from('skus').select(`
        *, brands_master(name), categories(name),
        sku_warehouse_stock(current_qty, opening_qty, opening_date, warehouses(name))
      `).eq('org_id', orgId).eq('is_active', true).order('item_name'),
      supabase.from('categories').select('*').eq('org_id', orgId).order('name'),
      supabase.from('brands_master').select('*').eq('org_id', orgId).order('name'),
      supabase.from('warehouses').select('*').eq('org_id', orgId).eq('is_active', true).order('name'),
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
        })
        .select()
        .single()

      if (skuError) throw skuError

      // Insert opening stock for each warehouse that has a qty
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

  async function deleteSku(id) {
    if (!confirm('Delete this SKU?')) return
    await supabase.from('skus').update({ is_active: false }).eq('id', id)
    await fetchAll()
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border p-6" style={{borderColor: '#e8e5f0'}}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-navy">SKU Master ({skus.length} SKUs)</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{background: '#d63683'}}
          >
            <Plus size={15} /> Add SKU
          </button>
        </div>

        {warehouses.length === 0 && (
          <div className="p-4 rounded-xl mb-4 text-sm" style={{background: '#fff3ec', color: '#d63683', border: '1px solid #ffc7a3'}}>
            ⚠️ Please add at least one warehouse first before adding SKUs.
          </div>
        )}

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
                  className="w-full px-3 py-2.5 rounded-xl border text-navy text-sm focus:outline-none focus:ring-2 focus:ring-pink"
                  style={{borderColor: '#e8e5f0'}}>
                  <option value="">Select brand</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-navy mb-1">Category</label>
                <select name="category_id" value={form.category_id} onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-xl border text-navy text-sm focus:outline-none focus:ring-2 focus:ring-pink"
                  style={{borderColor: '#e8e5f0'}}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-navy mb-1">Parent ASIN</label>
                <input name="parent_asin" value={form.parent_asin} onChange={handleChange}
                  placeholder="Amazon Parent ASIN"
                  className="w-full px-3 py-2.5 rounded-xl border text-navy text-sm focus:outline-none focus:ring-2 focus:ring-pink"
                  style={{borderColor: '#e8e5f0'}} />
              </div>
              <div>
                <label className="block text-xs font-medium text-navy mb-1">Child ASIN</label>
                <input name="child_asin" value={form.child_asin} onChange={handleChange}
                  placeholder="Amazon Child ASIN"
                  className="w-full px-3 py-2.5 rounded-xl border text-navy text-sm focus:outline-none focus:ring-2 focus:ring-pink"
                  style={{borderColor: '#e8e5f0'}} />
              </div>
              <div>
                <label className="block text-xs font-medium text-navy mb-1">HSN Code</label>
                <input name="hsn_code" value={form.hsn_code} onChange={handleChange}
                  placeholder="e.g. 3304"
                  className="w-full px-3 py-2.5 rounded-xl border text-navy text-sm focus:outline-none focus:ring-2 focus:ring-pink"
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
                    className="w-full px-3 py-2.5 rounded-xl border text-navy text-sm focus:outline-none focus:ring-2 focus:ring-pink"
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
                  className="w-full px-3 py-2.5 rounded-xl border text-navy text-sm focus:outline-none focus:ring-2 focus:ring-pink"
                  style={{borderColor: '#e8e5f0'}} />
              </div>
              <div>
                <label className="block text-xs font-medium text-navy mb-1">Lead Time Type *</label>
                <select name="lead_time_type" value={form.lead_time_type} onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-xl border text-navy text-sm focus:outline-none focus:ring-2 focus:ring-pink"
                  style={{borderColor: '#e8e5f0'}}>
                  <option value="procurement">Procurement (from vendor)</option>
                  <option value="manufacturing">Manufacturing (self-produced)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-navy mb-1">Vendor / MFG Name</label>
                <input name="vendor_name" value={form.vendor_name} onChange={handleChange}
                  placeholder="e.g. ABC Pharma Pvt Ltd"
                  className="w-full px-3 py-2.5 rounded-xl border text-navy text-sm focus:outline-none focus:ring-2 focus:ring-pink"
                  style={{borderColor: '#e8e5f0'}} />
              </div>
              <div>
                <label className="block text-xs font-medium text-navy mb-1">Min. Order Qty (MOQ)</label>
                <input name="minimum_order_qty" value={form.minimum_order_qty} onChange={handleChange} type="number"
                  placeholder="1"
                  className="w-full px-3 py-2.5 rounded-xl border text-navy text-sm focus:outline-none focus:ring-2 focus:ring-pink"
                  style={{borderColor: '#e8e5f0'}} />
              </div>
            </div>

            <p className="text-xs font-semibold text-navy uppercase tracking-wider pt-2">Opening Stock (Day Zero)</p>
            <div className="mb-3">
              <label className="block text-xs font-medium text-navy mb-1">As of Date *</label>
              <input name="opening_date" value={form.opening_date} onChange={handleChange} required type="date"
                className="px-3 py-2.5 rounded-xl border text-navy text-sm focus:outline-none focus:ring-2 focus:ring-pink"
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
                    className="w-full px-3 py-2.5 rounded-xl border text-navy text-sm focus:outline-none focus:ring-2 focus:ring-pink"
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
              <p className="text-sm font-medium text-navy mb-1">No SKUs yet</p>
              <p className="text-xs" style={{color: '#b0b4c8'}}>Add your first SKU using the button above</p>
            </div>
          )}
          {skus.map(sku => (
            <div key={sku.id} className="rounded-xl border overflow-hidden" style={{borderColor: '#e8e5f0'}}>
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedSku(expandedSku === sku.id ? null : sku.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background: '#fff3ec'}}>
                    <Package size={14} style={{color: '#d63683'}} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-navy">{sku.item_name}</p>
                    <p className="text-xs" style={{color: '#7880a4'}}>
                      {sku.sku_code} {sku.variant_name ? `· ${sku.variant_name}` : ''} {sku.brands_master ? `· ${sku.brands_master.name}` : ''}
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
                  {expandedSku === sku.id ? <ChevronUp size={16} style={{color: '#7880a4'}} /> : <ChevronDown size={16} style={{color: '#7880a4'}} />}
                </div>
              </div>

              {expandedSku === sku.id && (
                <div className="px-4 py-3 border-t text-xs space-y-2" style={{borderColor: '#e8e5f0', background: '#f8f7fc'}}>
                  <div className="grid grid-cols-3 gap-3">
                    <div><span style={{color: '#7880a4'}}>MRP</span><p className="font-medium text-navy">Rs. {sku.mrp}</p></div>
                    <div><span style={{color: '#7880a4'}}>Cost</span><p className="font-medium text-navy">Rs. {sku.cost_price}</p></div>
                    <div><span style={{color: '#7880a4'}}>Selling Price</span><p className="font-medium text-navy">Rs. {sku.selling_price}</p></div>
                    <div><span style={{color: '#7880a4'}}>Lead Time Type</span><p className="font-medium text-navy capitalize">{sku.lead_time_type}</p></div>
                    <div><span style={{color: '#7880a4'}}>MOQ</span><p className="font-medium text-navy">{sku.minimum_order_qty} units</p></div>
                    <div><span style={{color: '#7880a4'}}>Category</span><p className="font-medium text-navy">{sku.categories?.name || '—'}</p></div>
                  </div>
                  {sku.sku_warehouse_stock?.length > 0 && (
                    <div>
                      <p style={{color: '#7880a4'}} className="mb-1">Stock by warehouse:</p>
                      <div className="flex gap-3 flex-wrap">
                        {sku.sku_warehouse_stock.map(s => (
                          <span key={s.warehouses?.name} className="px-2.5 py-1 rounded-lg font-medium" style={{background: '#e8f4f0', color: '#0f9b58'}}>
                            {s.warehouses?.name}: {s.current_qty} units
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <button onClick={() => deleteSku(sku.id)}
                    className="flex items-center gap-1 text-red-400 hover:text-red-600 mt-1">
                    <Trash2 size={12} /> Delete SKU
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}