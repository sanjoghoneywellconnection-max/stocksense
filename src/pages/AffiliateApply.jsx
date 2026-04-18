import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { CheckCircle, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

function generateCode(name) {
  const clean = name.trim().toUpperCase().replace(/\s+/g, '').slice(0, 6)
  const num = Math.floor(1000 + Math.random() * 9000)
  return `${clean}${num}`
}

function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({length: 10}, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function AffiliateApply() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', how_promote: '',
    payment_method: 'upi', payment_details: '',
  })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const code = generateCode(form.name)
      const password = generatePassword()

      const { error: err } = await supabase.from('affiliates').insert({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        how_promote: form.how_promote.trim(),
        payment_method: form.payment_method,
        payment_details: { detail: form.payment_details.trim() },
        affiliate_code: code,
        password,
        status: 'pending',
      })

      if (err) {
        if (err.message.includes('unique')) {
          setError('This email is already registered as an affiliate.')
        } else {
          setError(err.message)
        }
        setLoading(false)
        return
      }

      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (done) return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{background: '#f8f7fc'}}>
      <div className="bg-white rounded-3xl border p-12 max-w-md w-full text-center"
        style={{borderColor: '#e8e5f0'}}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{background: '#f0fdf4'}}>
          <CheckCircle size={32} style={{color: '#0f9b58'}} />
        </div>
        <h2 className="text-2xl font-bold text-navy mb-3">Application Submitted!</h2>
        <p className="text-sm mb-6" style={{color: '#7880a4'}}>
          We will review your application and send your affiliate code and login
          credentials to <strong>{form.email}</strong> within 24 hours.
        </p>
        <Link to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white"
          style={{background: '#1e2b71'}}>
          Back to Home <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen py-16 px-6" style={{background: '#f8f7fc'}}>
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{background: '#1e2b71'}}>
              <span className="text-white font-bold text-sm">I</span>
            </div>
            <span className="font-bold text-navy">InventSight</span>
          </Link>
          <h1 className="text-3xl font-bold text-navy mb-3">Join as Affiliate Partner</h1>
          <p style={{color: '#7880a4'}}>
            Earn Rs. 2,000 for every brand you refer + Rs. 500/month as long as they stay active.
          </p>
        </div>

        {/* Commission cards */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { emoji: '🎯', label: 'First Month', value: 'Rs. 2,000' },
            { emoji: '🔄', label: 'Every Month After', value: 'Rs. 500' },
            { emoji: '📈', label: 'No Earnings Cap', value: 'Unlimited' },
          ].map(({ emoji, label, value }) => (
            <div key={label} className="bg-white rounded-2xl border p-4 text-center"
              style={{borderColor: '#e8e5f0'}}>
              <div className="text-2xl mb-1">{emoji}</div>
              <p className="text-sm font-bold text-navy">{value}</p>
              <p className="text-xs mt-0.5" style={{color: '#7880a4'}}>{label}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}
          className="bg-white rounded-3xl border p-8 space-y-5"
          style={{borderColor: '#e8e5f0'}}>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-navy mb-1.5">Full Name *</label>
              <input name="name" value={form.name} onChange={handleChange} required
                placeholder="Rahul Sharma"
                className="w-full px-4 py-3 rounded-xl border text-navy text-sm focus:outline-none"
                style={{borderColor: '#e8e5f0'}} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy mb-1.5">Email *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required
                placeholder="rahul@example.com"
                className="w-full px-4 py-3 rounded-xl border text-navy text-sm focus:outline-none"
                style={{borderColor: '#e8e5f0'}} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy mb-1.5">Phone *</label>
              <input name="phone" value={form.phone} onChange={handleChange} required
                placeholder="98XXXXXXXX"
                className="w-full px-4 py-3 rounded-xl border text-navy text-sm focus:outline-none"
                style={{borderColor: '#e8e5f0'}} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy mb-1.5">
              How will you promote InventSight? *
            </label>
            <textarea name="how_promote" value={form.how_promote} onChange={handleChange} required
              rows={3}
              placeholder="e.g. I run a WhatsApp group of 500 D2C founders, YouTube channel on ecommerce..."
              className="w-full px-4 py-3 rounded-xl border text-navy text-sm focus:outline-none resize-none"
              style={{borderColor: '#e8e5f0'}} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy mb-1.5">Payment Method *</label>
            <div className="flex gap-3">
              {['upi', 'bank'].map(m => (
                <button type="button" key={m}
                  onClick={() => setForm(p => ({ ...p, payment_method: m }))}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all"
                  style={{
                    background: form.payment_method === m ? '#1e2b71' : 'white',
                    color: form.payment_method === m ? 'white' : '#7880a4',
                    borderColor: form.payment_method === m ? '#1e2b71' : '#e8e5f0',
                  }}>
                  {m === 'upi' ? '📱 UPI' : '🏦 Bank Transfer'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy mb-1.5">
              {form.payment_method === 'upi' ? 'UPI ID *' : 'Bank Account Details *'}
            </label>
            <input name="payment_details" value={form.payment_details} onChange={handleChange} required
              placeholder={form.payment_method === 'upi'
                ? 'rahul@paytm'
                : 'Account No, IFSC, Bank Name'}
              className="w-full px-4 py-3 rounded-xl border text-navy text-sm focus:outline-none"
              style={{borderColor: '#e8e5f0'}} />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm"
              style={{background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca'}}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm"
            style={{background: loading ? '#9ca3af' : '#d63683'}}>
            {loading ? 'Submitting...' : 'Submit Application →'}
          </button>

          <p className="text-xs text-center" style={{color: '#b0b4c8'}}>
            Already an affiliate?{' '}
            <Link to="/affiliate/login" style={{color: '#d63683'}}>Login here</Link>
          </p>
        </form>
      </div>
    </div>
  )
}