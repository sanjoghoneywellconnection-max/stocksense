import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, ArrowLeft, User, Building2 } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [signupSuccess, setSignupSuccess] = useState(false)

  function resetForm() {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setFullName('')
    setOrgName('')
    setAgreedToTerms(false)
    setError('')
    setShowPassword(false)
  }

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Incorrect email or password. Please try again.')
      setLoading(false)
      return
    }
    navigate('/dashboard')
  }

  async function handleSignup(e) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (!orgName.trim()) {
      setError('Please enter your business name.')
      return
    }
    if (!agreedToTerms) {
      setError('Please read and accept the Terms & Conditions to continue.')
      return
    }

    setLoading(true)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName.trim() } }
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    const userId = authData.user?.id
    if (!userId) {
      setError('Signup failed. Please try again.')
      setLoading(false)
      return
    }

    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: orgName.trim(),
        contact_email: email,
        created_by: userId,
      })
      .select()
      .single()

    if (orgError) {
      setError('Could not create your account. Please try again.')
      setLoading(false)
      return
    }

    await supabase.from('org_members').insert({
      org_id: orgData.id,
      user_id: userId,
      role: 'owner',
    })

    setSignupSuccess(true)
    setLoading(false)
  }

  async function handleForgotPassword(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      setError('Could not send reset email. Please check the email address.')
      setLoading(false)
      return
    }
    setForgotSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{background: 'linear-gradient(135deg, #1e2b71 0%, #2d3e9e 100%)'}}>

      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{background: '#d63683'}}>
              <span style={{color: 'white', fontWeight: '800', fontSize: '18px'}}>I</span>
            </div>
            <span style={{color: 'white', fontWeight: '700', fontSize: '22px'}}>InventSight</span>
          </div>
          <p style={{color: 'rgba(255,255,255,0.5)', fontSize: '14px'}}>
            Inventory Intelligence for Indian Brands
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">

          {/* LOGIN */}
          {mode === 'login' && (
            <>
              <h2 className="text-xl font-bold text-navy mb-1">Welcome back</h2>
              <p className="text-sm mb-6" style={{color: '#7880a4'}}>
                Sign in to your InventSight account
              </p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{color: '#b0b4c8'}} />
                    <input type="email" value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@company.com" required
                      className="w-full pl-9 pr-4 py-3 rounded-xl border text-sm text-navy focus:outline-none"
                      style={{borderColor: '#e8e5f0'}} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy mb-1.5">Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{color: '#b0b4c8'}} />
                    <input type={showPassword ? 'text' : 'password'}
                      value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your password" required
                      className="w-full pl-9 pr-10 py-3 rounded-xl border text-sm text-navy focus:outline-none"
                      style={{borderColor: '#e8e5f0'}} />
                    <button type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2">
                      {showPassword
                        ? <EyeOff size={15} style={{color: '#b0b4c8'}} />
                        : <Eye size={15} style={{color: '#b0b4c8'}} />}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <button type="button"
                    onClick={() => { setMode('forgot'); setError('') }}
                    className="text-xs font-medium" style={{color: '#d63683'}}>
                    Forgot password?
                  </button>
                </div>

                {error && (
                  <div className="px-4 py-3 rounded-xl text-sm font-medium"
                    style={{background: '#fef2f2', color: '#dc2626'}}>{error}</div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-white text-sm"
                  style={{background: loading ? '#9ca3af' : '#d63683'}}>
                  {loading ? 'Signing in...' : 'Sign in →'}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t text-center" style={{borderColor: '#f0edf8'}}>
                <p className="text-sm" style={{color: '#7880a4'}}>
                  New to InventSight?{' '}
                  <button onClick={() => { setMode('signup'); resetForm() }}
                    className="font-semibold" style={{color: '#d63683'}}>
                    Start free 14-day trial
                  </button>
                </p>
              </div>
            </>
          )}

          {/* SIGNUP */}
          {mode === 'signup' && !signupSuccess && (
            <>
              <button onClick={() => { setMode('login'); resetForm() }}
                className="flex items-center gap-1.5 text-sm mb-5"
                style={{color: '#7880a4'}}>
                <ArrowLeft size={14} /> Back to login
              </button>

              <h2 className="text-xl font-bold text-navy mb-1">Start your free trial</h2>
              <p className="text-sm mb-6" style={{color: '#7880a4'}}>
                14 days free · No credit card required · Cancel anytime
              </p>

              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1.5">Your Name</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{color: '#b0b4c8'}} />
                    <input type="text" value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="e.g. Sanjog" required
                      className="w-full pl-9 pr-4 py-3 rounded-xl border text-sm text-navy focus:outline-none"
                      style={{borderColor: '#e8e5f0'}} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy mb-1.5">Business Name</label>
                  <div className="relative">
                    <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{color: '#b0b4c8'}} />
                    <input type="text" value={orgName}
                      onChange={e => setOrgName(e.target.value)}
                      placeholder="e.g. Wozoyo Brands" required
                      className="w-full pl-9 pr-4 py-3 rounded-xl border text-sm text-navy focus:outline-none"
                      style={{borderColor: '#e8e5f0'}} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{color: '#b0b4c8'}} />
                    <input type="email" value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@company.com" required
                      className="w-full pl-9 pr-4 py-3 rounded-xl border text-sm text-navy focus:outline-none"
                      style={{borderColor: '#e8e5f0'}} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy mb-1.5">Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{color: '#b0b4c8'}} />
                    <input type={showPassword ? 'text' : 'password'}
                      value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters" required
                      className="w-full pl-9 pr-10 py-3 rounded-xl border text-sm text-navy focus:outline-none"
                      style={{borderColor: '#e8e5f0'}} />
                    <button type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2">
                      {showPassword
                        ? <EyeOff size={15} style={{color: '#b0b4c8'}} />
                        : <Eye size={15} style={{color: '#b0b4c8'}} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{color: '#b0b4c8'}} />
                    <input type="password"
                      value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password" required
                      className="w-full pl-9 pr-4 py-3 rounded-xl border text-sm text-navy focus:outline-none"
                      style={{borderColor: '#e8e5f0'}} />
                  </div>
                </div>

                {/* Terms & Conditions Checkbox */}
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl"
                  style={{background: agreedToTerms ? '#f0fdf4' : '#f8f7fc', border: `1px solid ${agreedToTerms ? '#bbf7d0' : '#e8e5f0'}`}}>
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={e => setAgreedToTerms(e.target.checked)}
                    style={{
                      width: '18px', height: '18px', marginTop: '1px',
                      accentColor: '#d63683', cursor: 'pointer', flexShrink: 0,
                    }}
                  />
                  <label htmlFor="terms" className="text-sm cursor-pointer" style={{color: '#374151', lineHeight: '1.6'}}>
                    I have read and agree to the{' '}
                    <button
                      type="button"
                      onClick={() => window.open('/terms', '_blank')}
                      className="font-semibold underline"
                      style={{color: '#d63683'}}>
                      Terms & Conditions
                    </button>
                    {' '}and{' '}
                    <button
                      type="button"
                      onClick={() => window.open('/privacy', '_blank')}
                      className="font-semibold underline"
                      style={{color: '#d63683'}}>
                      Privacy Policy
                    </button>
                    . I understand my inventory data is encrypted and will never be sold.
                  </label>
                </div>

                {error && (
                  <div className="px-4 py-3 rounded-xl text-sm font-medium"
                    style={{background: '#fef2f2', color: '#dc2626'}}>{error}</div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all"
                  style={{background: loading ? '#9ca3af' : !agreedToTerms ? '#b0b4c8' : '#d63683',
                    cursor: !agreedToTerms ? 'not-allowed' : 'pointer'}}>
                  {loading ? 'Creating account...' : 'Start free trial →'}
                </button>
              </form>
            </>
          )}

          {/* SIGNUP SUCCESS */}
          {mode === 'signup' && signupSuccess && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{background: '#f0fdf4'}}>
                <span className="text-3xl">🎉</span>
              </div>
              <h2 className="text-xl font-bold text-navy mb-2">Account created!</h2>
              <p className="text-sm mb-2" style={{color: '#7880a4'}}>
                Welcome to InventSight. Your 14-day free trial has started.
              </p>
              <p className="text-sm mb-6" style={{color: '#7880a4'}}>
                Check your email to verify your account, then sign in.
              </p>
              <button onClick={() => { setMode('login'); resetForm() }}
                className="w-full py-3 rounded-xl font-semibold text-white text-sm"
                style={{background: '#d63683'}}>
                Go to login →
              </button>
            </div>
          )}

          {/* FORGOT PASSWORD */}
          {mode === 'forgot' && !forgotSent && (
            <>
              <button onClick={() => { setMode('login'); setError('') }}
                className="flex items-center gap-1.5 text-sm mb-5"
                style={{color: '#7880a4'}}>
                <ArrowLeft size={14} /> Back to login
              </button>

              <h2 className="text-xl font-bold text-navy mb-1">Reset your password</h2>
              <p className="text-sm mb-6" style={{color: '#7880a4'}}>
                Enter your email and we will send you a reset link
              </p>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{color: '#b0b4c8'}} />
                    <input type="email" value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@company.com" required
                      className="w-full pl-9 pr-4 py-3 rounded-xl border text-sm text-navy focus:outline-none"
                      style={{borderColor: '#e8e5f0'}} />
                  </div>
                </div>

                {error && (
                  <div className="px-4 py-3 rounded-xl text-sm font-medium"
                    style={{background: '#fef2f2', color: '#dc2626'}}>{error}</div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-white text-sm"
                  style={{background: loading ? '#9ca3af' : '#d63683'}}>
                  {loading ? 'Sending...' : 'Send reset link →'}
                </button>
              </form>
            </>
          )}

          {/* FORGOT SUCCESS */}
          {mode === 'forgot' && forgotSent && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{background: '#f0fdf4'}}>
                <span className="text-3xl">📧</span>
              </div>
              <h2 className="text-xl font-bold text-navy mb-2">Check your email</h2>
              <p className="text-sm mb-6" style={{color: '#7880a4'}}>
                We sent a password reset link to <strong>{email}</strong>.
                Click the link to set a new password.
              </p>
              <p className="text-xs mb-4" style={{color: '#b0b4c8'}}>
                Didn't get it? Check your spam folder.
              </p>
              <button onClick={() => { setMode('login'); setForgotSent(false); setEmail('') }}
                className="text-sm font-medium" style={{color: '#d63683'}}>
                ← Back to login
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}