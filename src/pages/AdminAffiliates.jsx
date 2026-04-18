import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react'

export default function AdminAffiliates() {
  const [affiliates, setAffiliates] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [selectedReferrals, setSelectedReferrals] = useState([])
  const [selectedPayouts, setSelectedPayouts] = useState([])
  const [payoutMonth, setPayoutMonth] = useState(new Date().toISOString().slice(0, 7))
  const [payoutRef, setPayoutRef] = useState('')
  const [markingPaid, setMarkingPaid] = useState(false)

  useEffect(() => { fetchAffiliates() }, [])

  async function fetchAffiliates() {
    setLoading(true)

    const { data: affs } = await supabase
      .from('affiliates')
      .select('*')
      .order('created_at', { ascending: false })

    if (!affs) { setLoading(false); return }

    // For each affiliate get referral count and unpaid balance
    const enriched = await Promise.all(affs.map(async aff => {
      const { data: refs } = await supabase
        .from('affiliate_referrals')
        .select('status, commission_earned')
        .eq('affiliate_id', aff.id)

      const totalReferrals = refs?.length || 0
      const activeReferrals = refs?.filter(r => r.status === 'active').length || 0
      const totalEarned = refs?.reduce((s, r) => s + (r.commission_earned || 0), 0) || 0
      const unpaid = totalEarned - (aff.total_paid || 0)

      return { ...aff, totalReferrals, activeReferrals, totalEarned, unpaid }
    }))

    setAffiliates(enriched)
    setLoading(false)
  }

  async function selectAffiliate(aff) {
    setSelected(aff)
    const [refRes, payRes] = await Promise.all([
      supabase.from('affiliate_referrals')
        .select('*, organizations(name, contact_email)')
        .eq('affiliate_id', aff.id)
        .order('referred_at', { ascending: false }),
      supabase.from('affiliate_payouts')
        .select('*')
        .eq('affiliate_id', aff.id)
        .order('month', { ascending: false }),
    ])
    setSelectedReferrals(refRes.data || [])
    setSelectedPayouts(payRes.data || [])
  }

  async function changeStatus(affId, newStatus) {
    await supabase.from('affiliates').update({ status: newStatus }).eq('id', affId)
    await fetchAffiliates()
    if (selected?.id === affId) setSelected(prev => ({ ...prev, status: newStatus }))
  }

  async function markPaid() {
    if (!selected || !payoutRef.trim()) return
    setMarkingPaid(true)

    const amount = selected.unpaid

    await supabase.from('affiliate_payouts').insert({
      affiliate_id: selected.id,
      month: payoutMonth,
      amount,
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_reference: payoutRef.trim(),
    })

    await supabase.from('affiliates')
      .update({ total_paid: (selected.total_paid || 0) + amount })
      .eq('id', selected.id)

    setPayoutRef('')
    await fetchAffiliates()
    await selectAffiliate({ ...selected, total_paid: (selected.total_paid || 0) + amount })
    setMarkingPaid(false)
  }

  async function approveAffiliate(affId) {
    await changeStatus(affId, 'active')
  }

  const filteredAffs = affiliates.filter(a => {
    if (filter === 'all') return true
    if (filter === 'pending') return a.status === 'pending'
    if (filter === 'active') return a.status === 'active'
    if (filter === 'high') return a.activeReferrals >= 5
    if (filter === 'paused') return a.status === 'paused'
    return true
  })

  const totalUnpaid = affiliates.reduce((s, a) => s + (a.unpaid || 0), 0)
  const totalPaidAllTime = affiliates.reduce((s, a) => s + (a.total_paid || 0), 0)
  const totalActiveUsers = affiliates.reduce((s, a) => s + (a.activeReferrals || 0), 0)
  const pendingCount = affiliates.filter(a => a.status === 'pending').length

  const statusConfig = {
    pending:    { label: 'Pending',    color: '#d97706', bg: '#fffbeb' },
    active:     { label: 'Active',     color: '#0f9b58', bg: '#f0fdf4' },
    paused:     { label: 'Paused',     color: '#7880a4', bg: '#f9fafb' },
    terminated: { label: 'Terminated', color: '#dc2626', bg: '#fef2f2' },
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
        style={{borderColor: '#d63683', borderTopColor: 'transparent'}} />
    </div>
  )

  return (
    <div className="space-y-6">

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Affiliates', value: affiliates.length, color: '#1e2b71', bg: '#f0f1fa' },
          { label: 'Active Users Referred', value: totalActiveUsers, color: '#0f9b58', bg: '#f0fdf4' },
          { label: 'Total Owed (Unpaid)', value: `Rs. ${totalUnpaid.toLocaleString('en-IN')}`, color: '#dc2626', bg: '#fef2f2' },
          { label: 'Total Paid (All Time)', value: `Rs. ${totalPaidAllTime.toLocaleString('en-IN')}`, color: '#0f9b58', bg: '#f0fdf4' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="rounded-2xl border p-5"
            style={{background: bg, borderColor: '#e8e5f0'}}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{color}}>{label}</p>
            <p className="text-2xl font-bold" style={{color}}>{value}</p>
          </div>
        ))}
      </div>

      {/* Pending approvals banner */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-4 px-5 py-4 rounded-2xl"
          style={{background: '#fffbeb', border: '1px solid #fde68a'}}>
          <AlertTriangle size={20} style={{color: '#d97706'}} />
          <p className="text-sm font-semibold" style={{color: '#d97706'}}>
            {pendingCount} affiliate application{pendingCount > 1 ? 's' : ''} waiting for your approval
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Affiliates list */}
        <div className="bg-white rounded-2xl border overflow-hidden" style={{borderColor: '#e8e5f0'}}>

          {/* Filter tabs */}
          <div className="flex gap-1 p-3 border-b overflow-x-auto" style={{borderColor: '#e8e5f0', background: '#f8f7fc'}}>
            {[
              { key: 'all',     label: `All (${affiliates.length})` },
              { key: 'pending', label: `Pending (${pendingCount})` },
              { key: 'active',  label: 'Active' },
              { key: 'high',    label: '⭐ High Volume' },
              { key: 'paused',  label: 'Paused' },
            ].map(tab => (
              <button key={tab.key}
                onClick={() => setFilter(tab.key)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap"
                style={{
                  background: filter === tab.key ? '#1e2b71' : 'transparent',
                  color: filter === tab.key ? 'white' : '#7880a4',
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="divide-y" style={{divideColor: '#f0edf8'}}>
            {filteredAffs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm" style={{color: '#7880a4'}}>No affiliates in this filter</p>
              </div>
            )}
            {filteredAffs.map(aff => {
              const s = statusConfig[aff.status] || statusConfig.active
              const isSelected = selected?.id === aff.id

              return (
                <div key={aff.id}
                  onClick={() => selectAffiliate(aff)}
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{background: isSelected ? '#f0f1fa' : 'white'}}>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-navy">{aff.name}</p>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg"
                        style={{background: s.bg, color: s.color}}>
                        {s.label}
                      </span>
                    </div>
                    <p className="text-xs" style={{color: '#7880a4'}}>
                      {aff.affiliate_code} · {aff.email}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs" style={{color: '#b0b4c8'}}>
                      <span>{aff.totalReferrals} referred</span>
                      <span>·</span>
                      <span>{aff.activeReferrals} active</span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-sm font-bold" style={{color: aff.unpaid > 0 ? '#dc2626' : '#0f9b58'}}>
                      Rs. {(aff.unpaid || 0).toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs" style={{color: '#7880a4'}}>unpaid</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected affiliate detail */}
        {selected ? (
          <div className="space-y-4">

            {/* Header */}
            <div className="bg-white rounded-2xl border p-5" style={{borderColor: '#e8e5f0'}}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-navy text-lg">{selected.name}</h3>
                  <p className="text-sm" style={{color: '#7880a4'}}>
                    {selected.email} · {selected.phone}
                  </p>
                  <p className="text-xs mt-1" style={{color: '#b0b4c8'}}>
                    Code: <strong className="text-navy">{selected.affiliate_code}</strong>
                    {' · '}Joined {new Date(selected.created_at).toLocaleDateString('en-IN')}
                  </p>
                  {selected.how_promote && (
                    <p className="text-xs mt-2 p-3 rounded-xl"
                      style={{background: '#f8f7fc', color: '#374151'}}>
                      "{selected.how_promote}"
                    </p>
                  )}
                </div>
              </div>

              {/* Status actions */}
              <div className="flex gap-2 flex-wrap">
                {selected.status === 'pending' && (
                  <button onClick={() => approveAffiliate(selected.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
                    style={{background: '#0f9b58', color: 'white'}}>
                    <CheckCircle size={13} /> Approve Affiliate
                  </button>
                )}
                {selected.status === 'active' && (
                  <button onClick={() => changeStatus(selected.id, 'paused')}
                    className="px-4 py-2 rounded-xl text-xs font-bold border"
                    style={{borderColor: '#fde68a', background: '#fffbeb', color: '#d97706'}}>
                    ⏸ Pause
                  </button>
                )}
                {selected.status === 'paused' && (
                  <button onClick={() => changeStatus(selected.id, 'active')}
                    className="px-4 py-2 rounded-xl text-xs font-bold border"
                    style={{borderColor: '#bbf7d0', background: '#f0fdf4', color: '#0f9b58'}}>
                    ▶ Reactivate
                  </button>
                )}
                {selected.status !== 'terminated' && (
                  <button onClick={() => changeStatus(selected.id, 'terminated')}
                    className="px-4 py-2 rounded-xl text-xs font-bold border"
                    style={{borderColor: '#fecaca', background: '#fef2f2', color: '#dc2626'}}>
                    ✕ Terminate
                  </button>
                )}
              </div>
            </div>

            {/* Mark as paid */}
            {selected.unpaid > 0 && (
              <div className="bg-white rounded-2xl border p-5" style={{borderColor: '#e8e5f0'}}>
                <p className="text-xs font-bold text-navy uppercase tracking-wider mb-4">
                  Mark Payout — Rs. {(selected.unpaid || 0).toLocaleString('en-IN')} unpaid
                </p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-navy mb-1">Month</label>
                    <input type="month" value={payoutMonth}
                      onChange={e => setPayoutMonth(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border text-sm text-navy focus:outline-none"
                      style={{borderColor: '#e8e5f0'}} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy mb-1">Payment Reference</label>
                    <input value={payoutRef} onChange={e => setPayoutRef(e.target.value)}
                      placeholder="UTR / Transaction ID"
                      className="w-full px-3 py-2 rounded-xl border text-sm text-navy focus:outline-none"
                      style={{borderColor: '#e8e5f0'}} />
                  </div>
                </div>
                <div className="p-3 rounded-xl mb-3 text-xs" style={{background: '#f8f7fc', color: '#7880a4'}}>
                  <strong className="text-navy">{selected.payment_method?.toUpperCase()}</strong>
                  {' — '}{selected.payment_details?.detail}
                </div>
                <button onClick={markPaid}
                  disabled={!payoutRef.trim() || markingPaid}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{background: payoutRef.trim() ? '#0f9b58' : '#e8e5f0',
                    color: payoutRef.trim() ? 'white' : '#b0b4c8'}}>
                  {markingPaid ? 'Saving...' : `✓ Mark Rs. ${(selected.unpaid || 0).toLocaleString('en-IN')} as Paid`}
                </button>
              </div>
            )}

            {/* Referrals */}
            <div className="bg-white rounded-2xl border overflow-hidden" style={{borderColor: '#e8e5f0'}}>
              <div className="px-5 py-3 border-b" style={{borderColor: '#e8e5f0', background: '#f8f7fc'}}>
                <p className="text-xs font-bold text-navy uppercase tracking-wider">
                  Referred Orgs ({selectedReferrals.length})
                </p>
              </div>
              {selectedReferrals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm" style={{color: '#7880a4'}}>No referrals yet</p>
                </div>
              ) : (
                selectedReferrals.map((r, i) => {
                  const sConf = {
                    trial:   { label: 'Trial',   color: '#d97706', bg: '#fffbeb' },
                    active:  { label: 'Active',  color: '#0f9b58', bg: '#f0fdf4' },
                    churned: { label: 'Churned', color: '#6b7280', bg: '#f9fafb' },
                  }
                  const sc = sConf[r.status] || sConf.trial
                  return (
                    <div key={i}
                      className="flex items-center justify-between px-5 py-3 border-b last:border-0"
                      style={{borderColor: '#f0edf8'}}>
                      <div>
                        <p className="text-sm font-medium text-navy">
                          {r.organizations?.name || '—'}
                        </p>
                        <p className="text-xs" style={{color: '#7880a4'}}>
                          {new Date(r.referred_at).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg"
                          style={{background: sc.bg, color: sc.color}}>
                          {sc.label}
                        </span>
                        <p className="text-sm font-bold" style={{color: '#0f9b58'}}>
                          Rs. {(r.commission_earned || 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Payout history */}
            {selectedPayouts.length > 0 && (
              <div className="bg-white rounded-2xl border overflow-hidden" style={{borderColor: '#e8e5f0'}}>
                <div className="px-5 py-3 border-b" style={{borderColor: '#e8e5f0', background: '#f8f7fc'}}>
                  <p className="text-xs font-bold text-navy uppercase tracking-wider">Payout History</p>
                </div>
                {selectedPayouts.map((p, i) => (
                  <div key={i}
                    className="flex items-center justify-between px-5 py-3 border-b last:border-0"
                    style={{borderColor: '#f0edf8'}}>
                    <div>
                      <p className="text-sm font-semibold text-navy">{p.month}</p>
                      <p className="text-xs" style={{color: '#7880a4'}}>Ref: {p.payment_reference}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-navy">Rs. {p.amount.toLocaleString('en-IN')}</p>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg"
                        style={{background: '#f0fdf4', color: '#0f9b58'}}>
                        ✓ Paid
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border flex items-center justify-center"
            style={{borderColor: '#e8e5f0', minHeight: '300px'}}>
            <p className="text-sm" style={{color: '#b0b4c8'}}>
              ← Select an affiliate to see details
            </p>
          </div>
        )}
      </div>
    </div>
  )
}