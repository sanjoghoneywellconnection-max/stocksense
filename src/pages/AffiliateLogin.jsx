import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function AffiliateLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: err } = await supabase
      .from('affiliates')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .eq('password', password)
      .single()

    if (err || !data) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    if (data.status === 'pending') {
      setError('Your application is pending approval. We will email you within 24 hours.')
      setLoading(false)
      return
    }

    if (data.status === 'paused' || data.status === 'terminated') {
      setError('Your affiliate account has been paused. Contact hello@inventsight.in')
      setLoading(false)
      return
    }

    sessionStorage.setItem('inventsight_affiliate', JSON.stringify({
      id: data.id,
      name: data.name,
      email: data.email,
      code: data.affiliate_code,
    }))

    navigate('/affiliate/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{background: '#f8f7fc'}}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{background: '#1e2b71'}}>
              <span className="text-white font-bold text-sm">I</span>
            </div>
            <span className="font-bold text-navy">InventSight</span>
          </Link>
          <h1 className="text-2xl font-bold text-navy mb-2">Affiliate Login</h1>
          <p className="text-sm" style={{color: '#7880a4'}}>
            Access your affiliate dashboard
          </p>
        </div>

        <form onSubmit={handleLogin}
          className="bg-white rounded-3xl border p-8 space-y-4"
          style={{borderColor: '#e8e5f0'}}>

          <div>
            <label className="block text-xs font-semibold text-navy mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="your@email.com"
              className="w-full px-4 py-3 rounded-xl border text-navy text-sm focus:outline-none"
              style={{borderColor: '#e8e5f0'}} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy mb-1.5">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="Your password"
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
            style={{background: loading ? '#9ca3af' : '#1e2b71'}}>
            {loading ? 'Logging in...' : 'Login to Dashboard'}
          </button>

          <p className="text-xs text-center" style={{color: '#b0b4c8'}}>
            Not an affiliate yet?{' '}
            <Link to="/affiliate/apply" style={{color: '#d63683'}}>Apply here</Link>
          </p>
        </form>
      </div>
    </div>
  )
}