import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { Building2, ArrowRight, CheckCircle } from 'lucide-react'

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    slug: '',
    gstin: '',
    contact_email: '',
    contact_phone: '',
  })

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'name' ? {
        slug: value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
      } : {})
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: form.name,
          slug: form.slug,
          gstin: form.gstin || null,
          contact_email: form.contact_email || user.email,
          contact_phone: form.contact_phone || null,
          plan: 'trial',
          is_active: true,
        })
        .select()
        .single()

      if (orgError) throw orgError

      // Add user as owner
      const { error: memberError } = await supabase
        .from('org_members')
        .insert({
          org_id: org.id,
          user_id: user.id,
          role: 'owner',
          is_active: true,
        })

      if (memberError) throw memberError

      setStep(2)
      setTimeout(() => navigate('/dashboard'), 2000)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-navy mb-2">Brand setup complete!</h2>
          <p style={{color: '#7880a4'}}>Taking you to your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-navy rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 size={28} className="text-cream" />
          </div>
          <h1 className="text-2xl font-bold text-navy mb-1">Set up your brand</h1>
          <p style={{color: '#7880a4'}} className="text-sm">
            This takes 2 minutes. You can change everything later.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm border" style={{borderColor: '#e8e5f0'}}>
          <div className="space-y-5">

            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">
                Brand Name <span className="text-pink">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Mamaearth, Boat, Sugar Cosmetics"
                required
                className="w-full px-4 py-3 rounded-xl border text-navy placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink focus:border-transparent"
                style={{borderColor: '#e8e5f0'}}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">
                Brand URL Slug <span className="text-pink">*</span>
              </label>
              <div className="flex items-center rounded-xl border overflow-hidden focus-within:ring-2 focus-within:ring-pink" style={{borderColor: '#e8e5f0'}}>
                <span className="px-3 py-3 text-sm bg-gray-50" style={{color: '#7880a4'}}>stocksense.app/</span>
                <input
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  placeholder="your-brand"
                  required
                  className="flex-1 px-3 py-3 text-navy focus:outline-none bg-white"
                />
              </div>
              <p className="text-xs mt-1" style={{color: '#b0b4c8'}}>Auto-generated from brand name. Lowercase letters and hyphens only.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">
                Contact Email <span className="text-pink">*</span>
              </label>
              <input
                name="contact_email"
                type="email"
                value={form.contact_email}
                onChange={handleChange}
                placeholder="owner@yourbrand.com"
                required
                className="w-full px-4 py-3 rounded-xl border text-navy placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink focus:border-transparent"
                style={{borderColor: '#e8e5f0'}}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Phone</label>
                <input
                  name="contact_phone"
                  value={form.contact_phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-3 rounded-xl border text-navy placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink focus:border-transparent"
                  style={{borderColor: '#e8e5f0'}}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">GSTIN</label>
                <input
                  name="gstin"
                  value={form.gstin}
                  onChange={handleChange}
                  placeholder="Optional"
                  className="w-full px-4 py-3 rounded-xl border text-navy placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink focus:border-transparent"
                  style={{borderColor: '#e8e5f0'}}
                />
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm font-medium bg-red-50 text-red-600 border border-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all"
              style={{ background: loading ? '#9ca3af' : '#d63683' }}
            >
              {loading ? 'Setting up...' : (
                <>Let's go <ArrowRight size={18} /></>
              )}
            </button>

          </div>
        </form>

        <p className="text-center text-xs mt-4" style={{color: '#b0b4c8'}}>
          14-day free trial · No credit card required
        </p>
      </div>
    </div>
  )
}