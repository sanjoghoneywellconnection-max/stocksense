import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff } from 'lucide-react'

// 🔐 CHANGE THIS PASSWORD TO SOMETHING ONLY YOU KNOW
const ADMIN_PASSWORD = 'Urmila@8384075067'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  function handleLogin(e) {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('inventsight_admin', 'true')
      navigate('/admin-inventsight-2026/dashboard')
    } else {
      setError('Incorrect password.')
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{background: 'linear-gradient(135deg, #111827 0%, #1e2b71 100%)'}}>
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{background: '#d63683'}}>
            <Lock size={24} color="white" />
          </div>
          <h1 style={{color: 'white', fontWeight: '800', fontSize: '22px', fontFamily: 'Sora, sans-serif'}}>
            InventSight Admin
          </h1>
          <p style={{color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '6px'}}>
            Restricted access — authorised personnel only
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-navy mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{color: '#b0b4c8'}} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                  className="w-full pl-9 pr-10 py-3 rounded-xl border text-sm text-navy focus:outline-none"
                  style={{borderColor: '#e8e5f0'}}
                />
                <button type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showPassword
                    ? <EyeOff size={15} style={{color: '#b0b4c8'}} />
                    : <Eye size={15} style={{color: '#b0b4c8'}} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm font-medium"
                style={{background: '#fef2f2', color: '#dc2626'}}>
                {error}
              </div>
            )}

            <button type="submit"
              className="w-full py-3 rounded-xl font-semibold text-white text-sm"
              style={{background: '#d63683'}}>
              Enter Admin Panel →
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}