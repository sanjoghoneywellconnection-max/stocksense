import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { Plus, Trash2 } from 'lucide-react'

export default function BrandsTab({ orgId }) {
  const [brands, setBrands] = useState([])
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchBrands() }, [orgId])

  async function fetchBrands() {
    const { data } = await supabase
      .from('brands_master')
      .select('*')
      .eq('org_id', orgId)
      .order('name')
    setBrands(data || [])
  }

  async function addBrand(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setLoading(true)
    await supabase.from('brands_master').insert({ org_id: orgId, name: newName.trim() })
    setNewName('')
    await fetchBrands()
    setLoading(false)
  }

  async function deleteBrand(id) {
    await supabase.from('brands_master').delete().eq('id', id)
    await fetchBrands()
  }

  return (
    <div className="bg-white rounded-2xl border p-6" style={{borderColor: '#e8e5f0'}}>
      <h2 className="font-semibold text-navy mb-4">Brand Names</h2>

      <form onSubmit={addBrand} className="flex gap-3 mb-6">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="e.g. Dot & Key, WOW Science, Minimalist"
          className="flex-1 px-4 py-2.5 rounded-xl border text-navy placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink"
          style={{borderColor: '#e8e5f0'}}
        />
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
          style={{background: '#d63683'}}
        >
          <Plus size={16} /> Add
        </button>
      </form>

      <div className="space-y-2">
        {brands.length === 0 && (
          <p className="text-sm text-center py-8" style={{color: '#b0b4c8'}}>
            No brands yet. Add your first one above.
          </p>
        )}
        {brands.map(brand => (
          <div key={brand.id} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{background: '#f8f7fc'}}>
            <span className="text-sm font-medium text-navy">{brand.name}</span>
            <button onClick={() => deleteBrand(brand.id)} className="text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}