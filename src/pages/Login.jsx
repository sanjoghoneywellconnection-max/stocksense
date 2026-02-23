import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setMessage({ text: '', type: '' })

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage({ text: error.message, type: 'error' })
    } else {
      setMessage({ text: 'Logged in successfully!', type: 'success' })
    }
    setLoading(false)
  }

  async function handleSignup(e) {
    e.preventDefault()
    setLoading(true)
    setMessage({ text: '', type: '' })

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    })

    if (error) {
      setMessage({ text: error.message, type: 'error' })
    } else {
      setMessage({
        text: 'Account created! Please check your email to confirm your account.',
        type: 'success'
      })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-cream flex">

      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-cream font-bold text-xl">StockSense</span>
          </div>
        </div>

        <div>
          <h1 className="text-cream text-4xl font-bold leading-tight mb-6">
            Inventory Intelligence<br />
            <span className="text-peach">for Indian Brands</span>
          </h1>
          <p className="text-blue-200 text-lg leading-relaxed mb-10" style={{color: 'rgba(254,254,253,0.6)'}}>
            Know exactly when your stock will run out — before it does. Stop losing lakhs to stockouts and dead inventory.
          </p>

          <div className="space-y-4">
            {[
              { stat: 'DRR', desc: 'Daily Run Rate at child ASIN level' },
              { stat: 'DOC', desc: 'Days of Cover — colour coded urgency' },
              { stat: 'BCG', desc: 'Star, Cash Cow, Dog, Question Mark' },
            ].map((item) => (
              <div key={item.stat} className="flex items-center gap-4">
                <div className="w-14 h-8 bg-pink rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">{item.stat}</span>
                </div>
                <span style={{color: 'rgba(254,254,253,0.7)'}} className="text-sm">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="inline-block bg-peach bg-opacity-20 rounded-2xl px-5 py-3" style={{background: 'rgba(255,199,163,0.15)', border: '1px solid rgba(255,199,163,0.3)'}}>
            <p className="text-peach text-sm font-medium">
              "Save even 1 lakh — pay 5K a month. Simple math."
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-pink rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-navy font-bold text-xl">StockSense</span>
          </div>

          <h2 className="text-2xl font-bold text-navy mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-sm mb-8" style={{color: '#7880a4'}}>
            {mode === 'login'
              ? 'Log in to your StockSense dashboard'
              : 'Start your 14-day free trial. No credit card required.'}
          </p>

          <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4">

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Sanjog Kumar"
                  required
                  className="w-full px-4 py-3 rounded-xl border text-navy placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink focus:border-transparent transition-all"
                  style={{borderColor: '#e8e5f0', background: '#fefefd'}}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@brand.com"
                required
                className="w-full px-4 py-3 rounded-xl border text-navy placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink focus:border-transparent transition-all"
                style={{borderColor: '#e8e5f0', background: '#fefefd'}}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl border text-navy placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink focus:border-transparent transition-all"
                style={{borderColor: '#e8e5f0', background: '#fefefd'}}
              />
            </div>

            {message.text && (
              <div
                className="px-4 py-3 rounded-xl text-sm font-medium"
                style={{
                  background: message.type === 'error' ? '#fef2f2' : '#f0fdf4',
                  color: message.type === 'error' ? '#dc2626' : '#16a34a',
                  border: `1px solid ${message.type === 'error' ? '#fecaca' : '#bbf7d0'}`
                }}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 mt-2"
              style={{
                background: loading ? '#9ca3af' : '#d63683',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading
                ? 'Please wait...'
                : mode === 'login' ? 'Log In' : 'Create Account'}
            </button>

          </form>

          <div className="mt-6 text-center">
            <span className="text-sm" style={{color: '#7880a4'}}>
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login')
                setMessage({ text: '', type: '' })
              }}
              className="text-sm font-semibold text-pink hover:underline"
            >
              {mode === 'login' ? 'Sign up free' : 'Log in'}
            </button>
          </div>

          <p className="text-center text-xs mt-8" style={{color: '#b0b4c8'}}>
            Rs. 4,999 / month after trial · Cancel anytime
          </p>

        </div>
      </div>

    </div>
  )
}