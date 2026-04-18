import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { Copy, CheckCircle, ExternalLink, LogOut, TrendingUp } from 'lucide-react'

const BASE_URL = 'https://stocksense-sigma.vercel.app'

const COMMISSION_FIRST = 2000
const COMMISSION_RECURRING = 500

export default function AffiliateDashboard() {
  const navigate = useNavigate()
  const [affiliate, setAffiliate] = useState(null)
  const [referrals, setReferrals] = useState([])
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [superLink, setSuperLink] = useState('')
  const [campaign, setCampaign] = useState('')

  useEffect(() => {
    const stored = sessionStorage.getItem('inventsight_affiliate')
    if (!stored) { navigate('/affiliate/login'); return }
    const parsed = JSON.parse(stored)
    setAffiliate(parsed)
    fetchData(parsed.id)
  }, [])

  async function fetchData(affiliateId) {
    setLoading(true)

    const [affRes, refRes, payRes] = await Promise.all([
      supabase.from('affiliates').select('*').eq('id', affiliateId).single(),
      supabase.from('affiliate_referrals')
        .select(`*, organizations(name, contact_email)`)
        .eq('affiliate_id', affiliateId)
        .order('referred_at', { ascending: false }),
      supabase.from('affiliate_payouts')
        .select('*')
        .eq('affiliate_id', affiliateId)
        .order('month', { ascending: false }),
    ])

    if (affRes.data) {
      setAffiliate(prev => ({ ...prev, ...affRes.data }))
      sessionStorage.setItem('inventsight_affiliate', JSON.stringify({
        id: affRes.data.id,
        name: affRes.data.name,
        email: affRes.data.email,
        code: affRes.data.affiliate_code,
      }))
    }
    setReferrals(refRes.data || [])
    setPayouts(payRes.data || [])
    setLoading(false)
  }

  function copyLink(url) {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function generateSuperLink() {
    if (!affiliate) return
    let url = `${BASE_URL}/?ref=${affiliate.affiliate_code}`
    if (campaign.trim()) url += `&utm_campaign=${encodeURIComponent(campaign.trim())}`
    setSuperLink(url)
  }

  function handleLogout() {
    sessionStorage.removeItem('inventsight_affiliate')
    navigate('/affiliate/login')
  }

  const baseLink = affiliate ? `${BASE_URL}/?ref=${affiliate.affiliate_code}` : ''

  const totalEarned = affiliate?.total_earned || 0
  const totalPaid = affiliate?.total_paid || 0
  const unpaidBalance = totalEarned - totalPaid
  const activeReferrals = referrals.filter(r => r.status === 'active').length
  const trialReferrals = referrals.filter(r => r.status === 'trial').length

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{background: '#f8f7fc'}}>
      <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
        style={{borderColor: '#d63683', borderTopColor: 'transparent'}} />
    </div>
  )

  return (
    <div className="min-h-screen" style={{background: '#f8f7fc'}}>

      {/* Top nav */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between"
        style={{borderColor: '#e8e5f0'}}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{background: '#1e2b71'}}>
            <span className="text-white font-bold text-sm">I</span>
          </div>
          <div>
            <p className="font-bold text-navy text-sm">InventSight Affiliate</p>
            <p className="text-xs" style={{color: '#7880a4'}}>
              Welcome, {affiliate?.name} · Code: <strong>{affiliate?.affiliate_code}</strong>
            </p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl border"
          style={{borderColor: '#e8e5f0', color: '#7880a4'}}>
          <LogOut size={14} /> Logout
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Earned', value: `Rs. ${totalEarned.toLocaleString('en-IN')}`, color: '#0f9b58', bg: '#f0fdf4', border: '#bbf7d0' },
            { label: 'Unpaid Balance', value: `Rs. ${unpaidBalance.toLocaleString('en-IN')}`, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
            { label: 'Active Users', value: activeReferrals, color: '#1e2b71', bg: '#f0f1fa', border: '#c7c9e8' },
            { label: 'In Trial', value: trialReferrals, color: '#7880a4', bg: '#f8f7fc', border: '#e8e5f0' },
          ].map(({ label, value, color, bg, border }) => (
            <div key={label} className="rounded-2xl border p-5"
              style={{background: bg, borderColor: border}}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{color}}>{label}</p>
              <p className="text-2xl font-bold" style={{color}}>{value}</p>
            </div>
          ))}
        </div>

        {/* Your affiliate link */}
        <div className="bg-white rounded-2xl border p-6" style={{borderColor: '#e8e5f0'}}>
          <h2 className="font-bold text-navy mb-4">Your Affiliate Link</h2>

          <div className="flex items-center gap-3 p-4 rounded-xl border mb-4"
            style={{background: '#f8f7fc', borderColor: '#e8e5f0'}}>
            <code className="flex-1 text-sm text-navy font-mono break-all">{baseLink}</code>
            <button onClick={() => copyLink(baseLink)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold flex-shrink-0"
              style={{background: copied ? '#0f9b58' : '#1e2b71', color: 'white'}}>
              {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* Super link generator */}
          <div className="border-t pt-4" style={{borderColor: '#e8e5f0'}}>
            <p className="text-xs font-semibold text-navy mb-3 uppercase tracking-wider">
              Super Link Generator — track different campaigns
            </p>
            <div className="flex gap-3">
              <input
                value={campaign}
                onChange={e => setCampaign(e.target.value)}
                placeholder="Campaign name e.g. whatsapp-group, youtube-video"
                className="flex-1 px-4 py-2.5 rounded-xl border text-sm text-navy focus:outline-none"
                style={{borderColor: '#e8e5f0'}}
              />
              <button onClick={generateSuperLink}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex-shrink-0"
                style={{background: '#d63683'}}>
                Generate
              </button>
            </div>
            {superLink && (
              <div className="flex items-center gap-3 p-3 rounded-xl border mt-3"
                style={{background: '#fff0f7', borderColor: '#f9a8d4'}}>
                <code className="flex-1 text-xs text-navy font-mono break-all">{superLink}</code>
                <button onClick={() => copyLink(superLink)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0"
                  style={{background: '#d63683', color: 'white'}}>
                  <Copy size={12} /> Copy
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Commission structure */}
        <div className="bg-white rounded-2xl border p-6" style={{borderColor: '#e8e5f0'}}>
          <h2 className="font-bold text-navy mb-4">How You Earn</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                step: '1',
                title: 'Share your link',
                desc: 'Share your unique link with D2C brand founders via WhatsApp, YouTube, LinkedIn, or any channel.',
                color: '#1e2b71', bg: '#f0f1fa',
              },
              {
                step: '2',
                title: 'They subscribe',
                desc: 'When they sign up and pay their first month, you earn Rs. 2,000 instantly.',
                color: '#d63683', bg: '#fff0f7',
              },
              {
                step: '3',
                title: 'Recurring income',
                desc: 'Every month they stay active, you earn Rs. 500. No cap. No expiry.',
                color: '#0f9b58', bg: '#f0fdf4',
              },
            ].map(({ step, title, desc, color, bg }) => (
              <div key={step} className="rounded-xl p-4" style={{background: bg}}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white mb-3"
                  style={{background: color}}>
                  {step}
                </div>
                <p className="text-sm font-semibold text-navy mb-1">{title}</p>
                <p className="text-xs" style={{color: '#7880a4'}}>{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Referrals table */}
        <div className="bg-white rounded-2xl border overflow-hidden" style={{borderColor: '#e8e5f0'}}>
          <div className="px-6 py-4 border-b" style={{borderColor: '#e8e5f0'}}>
            <h2 className="font-bold text-navy">Your Referrals ({referrals.length})</h2>
          </div>

          {referrals.length === 0 ? (
            <div className="text-center py-16">
              <TrendingUp size={36} className="mx-auto mb-3" style={{color: '#b0b4c8'}} />
              <p className="font-medium text-navy">No referrals yet</p>
              <p className="text-sm mt-1" style={{color: '#7880a4'}}>
                Share your link to start earning
              </p>
            </div>
          ) : (
            <>
              <div className="grid px-6 py-3 text-xs font-semibold uppercase tracking-wider border-b"
                style={{
                  gridTemplateColumns: '1fr 100px 120px 120px 120px',
                  borderColor: '#e8e5f0', color: '#7880a4', background: '#f8f7fc'
                }}>
                <span>Brand</span>
                <span className="text-center">Status</span>
                <span className="text-center">Referred On</span>
                <span className="text-center">First Paid</span>
                <span className="text-center">Earned</span>
              </div>

              {referrals.map((r, i) => {
                const statusConfig = {
                  trial:   { label: 'Trial',   color: '#d97706', bg: '#fffbeb' },
                  active:  { label: 'Active',  color: '#0f9b58', bg: '#f0fdf4' },
                  churned: { label: 'Churned', color: '#6b7280', bg: '#f9fafb' },
                }
                const s = statusConfig[r.status] || statusConfig.trial

                return (
                  <div key={i}
                    className="grid items-center px-6 py-3.5 border-b last:border-0 hover:bg-gray-50"
                    style={{gridTemplateColumns: '1fr 100px 120px 120px 120px', borderColor: '#f0edf8'}}>

                    <div>
                      <p className="text-sm font-medium text-navy">
                        {r.organizations?.name || '—'}
                      </p>
                      <p className="text-xs" style={{color: '#7880a4'}}>
                        {r.organizations?.contact_email || '—'}
                      </p>
                    </div>

                    <div className="flex justify-center">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg"
                        style={{background: s.bg, color: s.color}}>
                        {s.label}
                      </span>
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-navy">
                        {new Date(r.referred_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-navy">
                        {r.first_paid_at
                          ? new Date(r.first_paid_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                          : '—'}
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-sm font-bold" style={{color: '#0f9b58'}}>
                        Rs. {(r.commission_earned || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* Payouts */}
        <div className="bg-white rounded-2xl border overflow-hidden" style={{borderColor: '#e8e5f0'}}>
          <div className="px-6 py-4 border-b" style={{borderColor: '#e8e5f0'}}>
            <h2 className="font-bold text-navy">Payout History</h2>
          </div>

          {payouts.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm" style={{color: '#7880a4'}}>No payouts yet</p>
            </div>
          ) : (
            payouts.map((p, i) => (
              <div key={i}
                className="flex items-center justify-between px-6 py-4 border-b last:border-0"
                style={{borderColor: '#f0edf8'}}>
                <div>
                  <p className="text-sm font-semibold text-navy">{p.month}</p>
                  {p.payment_reference && (
                    <p className="text-xs" style={{color: '#7880a4'}}>Ref: {p.payment_reference}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-bold text-navy">
                    Rs. {p.amount.toLocaleString('en-IN')}
                  </p>
                  <span className="text-xs font-bold px-3 py-1 rounded-lg"
                    style={{
                      background: p.status === 'paid' ? '#f0fdf4' : '#fffbeb',
                      color: p.status === 'paid' ? '#0f9b58' : '#d97706',
                    }}>
                    {p.status === 'paid' ? '✓ Paid' : 'Pending'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Payment details */}
        {affiliate?.payment_details && (
          <div className="bg-white rounded-2xl border p-5" style={{borderColor: '#e8e5f0'}}>
            <p className="text-xs font-semibold text-navy mb-2 uppercase tracking-wider">
              Your Payment Details
            </p>
            <p className="text-sm" style={{color: '#7880a4'}}>
              Method: <strong className="text-navy capitalize">{affiliate.payment_method}</strong>
              {' · '}
              {affiliate.payment_details?.detail}
            </p>
            <p className="text-xs mt-2" style={{color: '#b0b4c8'}}>
              To update payment details, email hello@inventsight.in
            </p>
          </div>
        )}

      </div>
    </div>
  )
}