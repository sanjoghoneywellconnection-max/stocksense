import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff } from 'lucide-react'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleReset(e) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('Could not reset password. The link may have expired. Please request a new one.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => navigate('/dashboard'), 3000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{background: 'linear-gradient(135deg, #1e2b71 0%, #2d3e9e 100%)'}}>
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{background: '#d63683'}}>
              <span style={{color: 'white', fontWeight: '800', fontSize: '18px'}}>I</span>
            </div>
            <span style={{color: 'white', fontWeight: '700', fontSize: '22px'}}>InventSight</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          {!success ? (
            <>
              <h2 className="text-xl font-bold text-navy mb-1">Set new password</h2>
              <p className="text-sm mb-6" style={{color: '#7880a4'}}>
                Choose a strong password for your account
              </p>

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{color: '#b0b4c8'}} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      required
                      className="w-full pl-9 pr-10 py-3 rounded-xl border text-sm text-navy focus:outline-none"
                      style={{borderColor: '#e8e5f0'}}
                    />
                    <button type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2">
                      {showPassword
                        ? <EyeOff size={15} style={{color: '#b0b4c8'}} />
                        : <Eye size={15} style={{color: '#b0b4c8'}} />
                      }
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{color: '#b0b4c8'}} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Repeat your password"
                      required
                      className="w-full pl-9 pr-4 py-3 rounded-xl border text-sm text-navy focus:outline-none"
                      style={{borderColor: '#e8e5f0'}}
                    />
                  </div>
                </div>

                {error && (
                  <div className="px-4 py-3 rounded-xl text-sm font-medium"
                    style={{background: '#fef2f2', color: '#dc2626'}}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-white text-sm"
                  style={{background: loading ? '#9ca3af' : '#d63683'}}>
                  {loading ? 'Updating...' : 'Set new password →'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{background: '#f0fdf4'}}>
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-xl font-bold text-navy mb-2">Password updated!</h2>
              <p className="text-sm" style={{color: '#7880a4'}}>
                Your password has been changed successfully. Redirecting to dashboard...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}