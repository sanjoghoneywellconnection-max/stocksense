import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../supabaseClient'
import { useOrg } from '../hooks/useOrg'
import { User, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function Profile() {
  const { org } = useOrg()
  const [user, setUser] = useState(null)
  const [displayName, setDisplayName] = useState('')
  const [nameLoading, setNameLoading] = useState(false)
  const [nameSuccess, setNameSuccess] = useState(false)
  const [nameError, setNameError] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser(data.user)
        setDisplayName(data.user.user_metadata?.full_name || '')
      }
    })
  }, [])

  async function handleUpdateName(e) {
    e.preventDefault()
    if (!displayName.trim()) return
    setNameLoading(true)
    setNameError('')
    setNameSuccess(false)

    const { error } = await supabase.auth.updateUser({
      data: { full_name: displayName.trim() }
    })

    if (error) {
      setNameError('Could not update name. Please try again.')
    } else {
      setNameSuccess(true)
      setTimeout(() => setNameSuccess(false), 3000)
    }
    setNameLoading(false)
  }

  async function handleUpdatePassword(e) {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)

    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match.')
      return
    }

    setPwLoading(true)

    // Re-authenticate first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (signInError) {
      setPwError('Current password is incorrect.')
      setPwLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setPwError('Could not update password. Please try again.')
    } else {
      setPwSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPwSuccess(false), 3000)
    }
    setPwLoading(false)
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-navy">My Profile</h1>
          <p className="text-sm mt-0.5" style={{color: '#7880a4'}}>
            Manage your account details and password
          </p>
        </div>

        {/* Account info card */}
        <div className="bg-white rounded-2xl border p-6" style={{borderColor: '#e8e5f0'}}>
          <div className="flex items-center gap-4 mb-6 pb-6 border-b" style={{borderColor: '#f0edf8'}}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
              style={{background: '#d63683'}}>
              {(displayName || user?.email || 'U')[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-navy text-lg">
                {displayName || user?.email?.split('@')[0]}
              </p>
              <p className="text-sm" style={{color: '#7880a4'}}>{user?.email}</p>
              <p className="text-xs mt-1" style={{color: '#b0b4c8'}}>
                {org?.name}
              </p>
            </div>
          </div>

          {/* Display name form */}
          <form onSubmit={handleUpdateName} className="space-y-4">
            <h3 className="font-semibold text-navy flex items-center gap-2">
              <User size={16} style={{color: '#d63683'}} />
              Display Name
            </h3>

            <div>
              <label className="block text-xs font-semibold text-navy mb-1.5">
                Your name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="e.g. Sanjog"
                className="w-full px-4 py-3 rounded-xl border text-sm text-navy focus:outline-none focus:ring-2"
                style={{borderColor: '#e8e5f0'}}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 rounded-xl border text-sm"
                style={{borderColor: '#e8e5f0', background: '#f8f7fc', color: '#7880a4'}}
              />
              <p className="text-xs mt-1" style={{color: '#b0b4c8'}}>
                Email cannot be changed
              </p>
            </div>

            {nameError && (
              <div className="px-4 py-3 rounded-xl text-sm font-medium"
                style={{background: '#fef2f2', color: '#dc2626'}}>
                {nameError}
              </div>
            )}

            {nameSuccess && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                style={{background: '#f0fdf4', color: '#0f9b58'}}>
                <CheckCircle size={15} />
                Display name updated successfully
              </div>
            )}

            <button type="submit" disabled={nameLoading}
              className="px-6 py-2.5 rounded-xl font-semibold text-white text-sm"
              style={{background: nameLoading ? '#9ca3af' : '#d63683'}}>
              {nameLoading ? 'Saving...' : 'Save name'}
            </button>
          </form>
        </div>

        {/* Change password card */}
        <div className="bg-white rounded-2xl border p-6" style={{borderColor: '#e8e5f0'}}>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <h3 className="font-semibold text-navy flex items-center gap-2 mb-2">
              <Lock size={16} style={{color: '#d63683'}} />
              Change Password
            </h3>

            <div>
              <label className="block text-xs font-semibold text-navy mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                required
                className="w-full px-4 py-3 rounded-xl border text-sm text-navy focus:outline-none"
                style={{borderColor: '#e8e5f0'}}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  className="w-full px-4 pr-10 py-3 rounded-xl border text-sm text-navy focus:outline-none"
                  style={{borderColor: '#e8e5f0'}}
                />
                <button type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showNew
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
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                required
                className="w-full px-4 py-3 rounded-xl border text-sm text-navy focus:outline-none"
                style={{borderColor: '#e8e5f0'}}
              />
            </div>

            {pwError && (
              <div className="px-4 py-3 rounded-xl text-sm font-medium"
                style={{background: '#fef2f2', color: '#dc2626'}}>
                {pwError}
              </div>
            )}

            {pwSuccess && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                style={{background: '#f0fdf4', color: '#0f9b58'}}>
                <CheckCircle size={15} />
                Password changed successfully
              </div>
            )}

            <button type="submit" disabled={pwLoading}
              className="px-6 py-2.5 rounded-xl font-semibold text-white text-sm"
              style={{background: pwLoading ? '#9ca3af' : '#1e2b71'}}>
              {pwLoading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </div>

      </div>
    </Layout>
  )
}