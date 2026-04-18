import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { Copy, CheckCircle, LogOut, TrendingUp, Edit2, Save, X } from 'lucide-react'

const BASE_URL = 'https://stocksense-sigma.vercel.app'
const FLOOR_PRICE = 4999
const STANDARD_PRICE = 9999
const COMMISSION_RATE = 0.20

export default function AffiliateDashboard() {
  const navigate = useNavigate()
  const [affiliate, setAffiliate] = useState(null)
  const [referrals, setReferrals] = useState([])
  const [commissions, setCommissions] = useState([])
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [superLink, setSuperLink] = useState('')
  const [campaign, setCampaign] = useState('')

  // Price editing state
  const [editingPrice, setEditingPrice] = useState(null) // referral id being edited
  const [priceInput, setPriceInput] = useState('')
  const [savingPrice, setSavingPrice] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('inventsight_affiliate')
    if (!stored) { navigate('/affiliate/login'); return }
    const parsed = JSON.parse(stored)
    setAffiliate(parsed)
    fetchData(parsed.id)
  }, [])

  async function fetchData(affiliateId) {
    setLoading(true)

    const [affRes, refRes, commRes, payRes] = await Promise.all([
      supabase.from('affiliates').select('*').eq('id', affiliateId).single(),
      supabase.from('affiliate_referrals')
        .select('*, organizations(name, contact_email)')
        .eq('affiliate_id', affiliateId)
        .order('referred_at', { ascending: false }),
      supabase.from('affiliate_monthly_commissions')
        .select('*')
        .eq('affiliate_id', affiliateId)
        .order('month', { ascending: false }),
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
    setCommissions(commRes.data || [])
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

  function startEditPrice(referral) {
    setEditingPrice(referral.id)
    setPriceInput(String(referral.amount_offered || STANDARD_PRICE))
  }

  function cancelEditPrice() {
    setEditingPrice(null)
    setPriceInput('')
  }

  async function savePrice(referralId) {
    const amount = parseInt(priceInput)
    if (isNaN(amount) || amount < FLOOR_PRICE || amount > STANDARD_PRICE) {
      alert(`Price must be between Rs. ${FLOOR_PRICE.toLocaleString('en-IN')} and Rs. ${STANDARD_PRICE.toLocaleString('en-IN')}`)
      return
    }
    setSavingPrice(true)
    await supabase
      .from('affiliate_referrals')
      .update({ amount_offered: amount })
      .eq('id', referralId)
    setReferrals(prev => prev.map(r =>
      r.id === referralId ? { ...r, amount_offered: amount } : r
    ))
    setEditingPrice(null)
    setPriceInput('')
    setSavingPrice(false)
  }

  const baseLink = affiliate ? `${BASE_URL}/?ref=${affiliate.affiliate_code}` : ''

  // Calculate totals from actual commission records
  const totalEarned = commissions.reduce((s, c) => s + (c.commission_amount || 0), 0)
  const totalPaid = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + (c.commission_amount || 0), 0)
  const unpaidBalance = totalEarned - totalPaid
  const activeReferrals = referrals.filter(r => r.status === 'active').length
  const trialReferrals = referrals.filter(r => r.status === 'trial').length

  function formatRs(amount) {
    return `Rs. ${amount.toLocaleString('en-IN')}`
  }

  function getCommissionsForReferral(orgId) {
    return commissions.filter(c => c.org_id === orgId)
  }

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
            { label: 'Total Earned',    value: formatRs(totalEarned),    color: '#0f9b58', bg: '#f0fdf4', border: '#bbf7d0' },
            { label: 'Unpaid Balance',  value: formatRs(unpaidBalance),  color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
            { label: 'Active Users',    value: activeReferrals,          color: '#1e2b71', bg: '#f0f1fa', border: '#c7c9e8' },
            { label: 'In Trial',        value: trialReferrals,           color: '#7880a4', bg: '#f8f7fc', border: '#e8e5f0' },
          ].map(({ label, value, color, bg, border }) => (
            <div key={label} className="rounded-2xl border p-5"
              style={{background: bg, borderColor: border}}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{color}}>{label}</p>
              <p className="text-2xl font-bold" style={{color}}>{value}</p>
            </div>
          ))}
        </div>

        {/* Commission info banner */}
        <div className="rounded-2xl border p-5 flex items-start gap-4"
          style={{background: '#1e2b71', borderColor: '#2d3e9e'}}>
          <span style={{fontSize: '24px', flexShrink: 0}}>💰</span>
          <div>
            <p className="font-bold text-white text-sm mb-1">Your commission: 20% of every payment, every month, forever</p>
            <p className="text-xs" style={{color: 'rgba(255,255,255,0.6)', lineHeight: '1.7'}}>
              You can offer customers a price between Rs. 4,999 (floor) and Rs. 9,999 (standard).
              Your commission is 20% of whatever they actually pay.
              Higher discount = lower commission. Even if you leave the program, you continue earning on existing customers for as long as they stay subscribed.
            </p>
          </div>
        </div>

        {/* Commission table */}
        <div className="bg-white rounded-2xl border p-5" style={{borderColor: '#e8e5f0'}}>
          <p className="text-xs font-bold text-navy uppercase tracking-wider mb-4">Commission Reference</p>
          <div className="grid grid-cols-3 gap-2 text-xs font-semibold uppercase tracking-wider mb-2 px-3"
            style={{color: '#7880a4'}}>
            <span>Customer Pays</span>
            <span className="text-center">InventSight Gets</span>
            <span className="text-right">You Earn (20%)</span>
          </div>
          {[
            { pays: 9999, inv: 7999, earns: 2000 },
            { pays: 7999, inv: 6399, earns: 1600 },
            { pays: 5999, inv: 4799, earns: 1200 },
            { pays: 4999, inv: 3999, earns: 1000 },
          ].map(({ pays, inv, earns }) => (
            <div key={pays}
              className="grid grid-cols-3 gap-2 px-3 py-2.5 rounded-xl mb-1"
              style={{background: pays === 9999 ? '#f0fdf4' : pays === 4999 ? '#fef2f2' : '#f8f7fc'}}>
              <span className="text-sm font-semibold text-navy">Rs. {pays.toLocaleString('en-IN')}</span>
              <span className="text-sm text-center" style={{color: '#7880a4'}}>Rs. {inv.toLocaleString('en-IN')}</span>
              <span className="text-sm font-bold text-right"
                style={{color: pays === 9999 ? '#0f9b58' : pays === 4999 ? '#dc2626' : '#d97706'}}>
                Rs. {earns.toLocaleString('en-IN')}/mo
              </span>
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

        {/* Referrals table */}
        <div className="bg-white rounded-2xl border overflow-hidden" style={{borderColor: '#e8e5f0'}}>
          <div className="px-6 py-4 border-b" style={{borderColor: '#e8e5f0'}}>
            <h2 className="font-bold text-navy">Your Referrals ({referrals.length})</h2>
            <p className="text-xs mt-0.5" style={{color: '#7880a4'}}>
              Set the price you offered each customer. Commission = 20% of that amount, every month.
            </p>
          </div>

          {referrals.length === 0 ? (
            <div className="text-center py-16">
              <TrendingUp size={36} className="mx-auto mb-3" style={{color: '#b0b4c8'}} />
              <p className="font-medium text-navy">No referrals yet</p>
              <p className="text-sm mt-1" style={{color: '#7880a4'}}>Share your link to start earning</p>
            </div>
          ) : (
            referrals.map((r, i) => {
              const statusConfig = {
                trial:   { label: 'Trial',   color: '#d97706', bg: '#fffbeb' },
                active:  { label: 'Active',  color: '#0f9b58', bg: '#f0fdf4' },
                churned: { label: 'Churned', color: '#6b7280', bg: '#f9fafb' },
              }
              const s = statusConfig[r.status] || statusConfig.trial
              const offeredPrice = r.amount_offered || STANDARD_PRICE
              const monthlyCommission = Math.round(offeredPrice * COMMISSION_RATE)
              const referralCommissions = getCommissionsForReferral(r.org_id)
              const totalEarnedFromThis = referralCommissions.reduce((sum, c) => sum + c.commission_amount, 0)
              const isEditing = editingPrice === r.id

              return (
                <div key={r.id}
                  className="border-b last:border-0"
                  style={{borderColor: '#f0edf8'}}>

                  {/* Main row */}
                  <div className="flex items-center gap-4 px-6 py-4 flex-wrap">

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-navy">
                          {r.organizations?.name || '—'}
                        </p>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg"
                          style={{background: s.bg, color: s.color}}>
                          {s.label}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{color: '#7880a4'}}>
                        {r.organizations?.contact_email || '—'} ·{' '}
                        Referred {new Date(r.referred_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    {/* Price offered */}
                    <div className="flex-shrink-0">
                      <p className="text-xs font-semibold mb-1" style={{color: '#7880a4'}}>Price Offered</p>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl border"
                            style={{borderColor: '#d63683', background: '#fff0f7'}}>
                            <span className="text-xs text-navy">Rs.</span>
                            <input
                              type="number"
                              value={priceInput}
                              onChange={e => setPriceInput(e.target.value)}
                              min={FLOOR_PRICE}
                              max={STANDARD_PRICE}
                              className="w-20 text-sm font-bold text-navy focus:outline-none bg-transparent"
                            />
                          </div>
                          <button onClick={() => savePrice(r.id)} disabled={savingPrice}
                            className="p-1.5 rounded-lg"
                            style={{background: '#0f9b58', color: 'white'}}>
                            <Save size={13} />
                          </button>
                          <button onClick={cancelEditPrice}
                            className="p-1.5 rounded-lg"
                            style={{background: '#e8e5f0', color: '#7880a4'}}>
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-navy">
                            Rs. {offeredPrice.toLocaleString('en-IN')}/mo
                          </span>
                          {r.status !== 'churned' && (
                            <button onClick={() => startEditPrice(r)}
                              className="p-1.5 rounded-lg"
                              style={{background: '#f8f7fc', color: '#7880a4'}}>
                              <Edit2 size={12} />
                            </button>
                          )}
                        </div>
                      )}
                      <p className="text-xs mt-0.5" style={{color: '#0f9b58'}}>
                        Your cut: Rs. {monthlyCommission.toLocaleString('en-IN')}/mo
                      </p>
                    </div>

                    {/* Total earned from this customer */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-semibold mb-1" style={{color: '#7880a4'}}>Total Earned</p>
                      <p className="text-lg font-bold" style={{color: '#0f9b58'}}>
                        Rs. {totalEarnedFromThis.toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs" style={{color: '#b0b4c8'}}>
                        {referralCommissions.length} month{referralCommissions.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Commission history for this referral */}
                  {referralCommissions.length > 0 && (
                    <div className="px-6 pb-4">
                      <div className="rounded-xl overflow-hidden border" style={{borderColor: '#e8e5f0'}}>
                        {referralCommissions.map((c, j) => (
                          <div key={c.id}
                            className="flex items-center justify-between px-4 py-2.5 border-b last:border-0"
                            style={{borderColor: '#f0edf8', background: j % 2 === 0 ? '#fafafa' : 'white'}}>
                            <p className="text-xs font-medium text-navy">{c.month}</p>
                            <div className="flex items-center gap-4">
                              <p className="text-xs" style={{color: '#7880a4'}}>
                                Customer paid Rs. {c.amount_paid_by_customer.toLocaleString('en-IN')}
                              </p>
                              <p className="text-xs font-bold" style={{color: '#0f9b58'}}>
                                → Your commission: Rs. {c.commission_amount.toLocaleString('en-IN')}
                              </p>
                              <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg"
                                style={{
                                  background: c.status === 'paid' ? '#f0fdf4' : '#fffbeb',
                                  color: c.status === 'paid' ? '#0f9b58' : '#d97706',
                                }}>
                                {c.status === 'paid' ? '✓ Paid' : 'Pending'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Payout history */}
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
              {' · '}{affiliate.payment_details?.detail}
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