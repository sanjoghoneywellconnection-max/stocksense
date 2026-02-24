import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { Plus, Trash2, MapPin } from 'lucide-react'

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu & Kashmir','Ladakh','Puducherry','Chandigarh'
]

const WAREHOUSE_TYPES = [
  { value: 'fba', label: 'FBA — Fulfilled by Amazon' },
  { value: 'self', label: 'Self-owned Warehouse' },
  { value: '3pl', label: '3PL — Third Party Logistics' },
]

export default function WarehousesTab({ orgId }) {
  const [warehouses, setWarehouses] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', type: 'self', city: '', state: '', pincode: ''
  })

  useEffect(() => { fetchWarehouses() }, [orgId])

  async function fetchWarehouses() {
    const { data } = await supabase
      .from('warehouses')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('name')
    setWarehouses(data || [])
  }

  async function addWarehouse(e) {
    e.preventDefault()
    setLoading(true)
    await supabase.from('warehouses').insert({
      org_id: orgId,
      name: form.name,
      type: form.type,
      city: form.city,
      state: form.state,
      pincode: form.pincode || null,
      is_active: true,
    })
    setForm({ name: '', type: 'self', city: '', state: '', pincode: '' })
    setShowForm(false)
    await fetchWarehouses()
    setLoading(false)
  }

  async function deleteWarehouse(id) {
    await supabase.from('warehouses').update({ is_active: false }).eq('id', id)
    await fetchWarehouses()
  }

  const typeLabels = { fba: 'FBA', self: 'Self', '3pl': '3PL' }
  const typeColors = { fba: '#d63683', self: '#1e2b71', '3pl': '#f97316' }

  return (
    <div className="bg-white rounded-2xl border p-6" style={{borderColor: '#e8e5f0'}}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-navy">Warehouses</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
          style={{background: '#d63683'}}
        >
          <Plus size={15} /> Add Warehouse
        </button>
      </div>

      {showForm && (
        <form onSubmit={addWarehouse} className="mb-6 p-4 rounded-xl border space-y-4" style={{borderColor: '#e8e5f0', background: '#f8f7fc'}}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-navy mb-1">Warehouse Name *</label>
              <input
                value={form.name}
                onChange={e => setForm(p => ({...p, name: e.target.value}))}
                placeholder="e.g. Delhi FC, Mumbai 3PL"
                required
                className="w-full px-3 py-2.5 rounded-xl border text-navy text-sm focus:outline-none focus:ring-2 focus:ring-pink"
                style={{borderColor: '#e8e5f0'}}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-navy mb-1">Type *</label>
              <select
                value={form.type}
                onChange={e => setForm(p => ({...p, type: e.target.value}))}
                className="w-full px-3 py-2.5 rounded-xl border text-navy text-sm focus:outline-none focus:ring-2 focus:ring-pink"
                style={{borderColor: '#e8e5f0'}}
              >
                {WAREHOUSE_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-navy mb-1">City *</label>
              <input
                value={form.city}
                onChange={e => setForm(p => ({...p, city: e.target.value}))}
                placeholder="e.g. New Delhi"
                required
                className="w-full px-3 py-2.5 rounded-xl border text-navy text-sm focus:outline-none focus:ring-2 focus:ring-pink"
                style={{borderColor: '#e8e5f0'}}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-navy mb-1">State *</label>
              <select
                value={form.state}
                onChange={e => setForm(p => ({...p, state: e.target.value}))}
                required
                className="w-full px-3 py-2.5 rounded-xl border text-navy text-sm focus:outline-none focus:ring-2 focus:ring-pink"
                style={{borderColor: '#e8e5f0'}}
              >
                <option value="">Select state</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-navy mb-1">Pincode</label>
              <input
                value={form.pincode}
                onChange={e => setForm(p => ({...p, pincode: e.target.value}))}
                placeholder="110001"
                className="w-full px-3 py-2.5 rounded-xl border text-navy text-sm focus:outline-none focus:ring-2 focus:ring-pink"
                style={{borderColor: '#e8e5f0'}}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="px-5 py-2 rounded-xl text-sm font-medium text-white"
              style={{background: '#d63683'}}>
              {loading ? 'Saving...' : 'Save Warehouse'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-5 py-2 rounded-xl text-sm font-medium"
              style={{background: '#e8e5f0', color: '#7880a4'}}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {warehouses.length === 0 && (
          <p className="text-sm text-center py-8" style={{color: '#b0b4c8'}}>
            No warehouses yet. Add your first one above.
          </p>
        )}
        {warehouses.map(wh => (
          <div key={wh.id} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{background: '#f8f7fc'}}>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg text-white" style={{background: typeColors[wh.type]}}>
                {typeLabels[wh.type]}
              </span>
              <div>
                <p className="text-sm font-medium text-navy">{wh.name}</p>
                <p className="text-xs flex items-center gap-1" style={{color: '#7880a4'}}>
                  <MapPin size={10} /> {wh.city}, {wh.state}
                </p>
              </div>
            </div>
            <button onClick={() => deleteWarehouse(wh.id)} className="text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}