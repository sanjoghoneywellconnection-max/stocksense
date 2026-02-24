import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { Plus, Trash2 } from 'lucide-react'

export default function CategoriesTab({ orgId }) {
  const [categories, setCategories] = useState([])
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchCategories() }, [orgId])

  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('org_id', orgId)
      .order('name')
    setCategories(data || [])
  }

  async function addCategory(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setLoading(true)
    await supabase.from('categories').insert({ org_id: orgId, name: newName.trim() })
    setNewName('')
    await fetchCategories()
    setLoading(false)
  }

  async function deleteCategory(id) {
    await supabase.from('categories').delete().eq('id', id)
    await fetchCategories()
  }

  return (
    <div className="bg-white rounded-2xl border p-6" style={{borderColor: '#e8e5f0'}}>
      <h2 className="font-semibold text-navy mb-4">Product Categories</h2>

      <form onSubmit={addCategory} className="flex gap-3 mb-6">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="e.g. Skincare, Haircare, Supplements"
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
        {categories.length === 0 && (
          <p className="text-sm text-center py-8" style={{color: '#b0b4c8'}}>
            No categories yet. Add your first one above.
          </p>
        )}
        {categories.map(cat => (
          <div key={cat.id} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{background: '#f8f7fc'}}>
            <span className="text-sm font-medium text-navy">{cat.name}</span>
            <button onClick={() => deleteCategory(cat.id)} className="text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}