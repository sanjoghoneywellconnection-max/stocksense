import { useState } from 'react'
import Layout from '../components/Layout'
import { useOrg } from '../hooks/useOrg'
import { useSubscription } from '../hooks/useSubscription'
import { supabase } from '../supabaseClient'
import { CheckCircle, Tag, Lock, Zap } from 'lucide-react'

export default function Subscribe() {
    const { org } = useOrg()
    const { subscription, statusLabel, daysLeft, hasAccess, refetch } = useSubscription()
    const isExpiringSoon = hasAccess && daysLeft <= 5
    const showPricingCard = !hasAccess || isExpiringSoon
    const [promoCode, setPromoCode] = useState('')
    const [promoResult, setPromoResult] = useState(null)
    const [promoLoading, setPromoLoading] = useState(false)
    const [promoError, setPromoError] = useState('')
    const [showSuccess, setShowSuccess] = useState(false)

    const BASE_PRICE = 4999
    const finalPrice = promoResult
        ? promoResult.discount_pct === 100
            ? 0
            : Math.round(BASE_PRICE - (BASE_PRICE * promoResult.discount_pct / 100))
        : BASE_PRICE

    async function applyPromoCode() {
        if (!promoCode.trim()) return
        setPromoLoading(true)
        setPromoError('')
        setPromoResult(null)

        const { data, error } = await supabase
            .from('promo_codes')
            .select('*')
            .eq('code', promoCode.trim().toUpperCase())
            .eq('is_active', true)
            .maybeSingle()

        if (!data || error) {
            setPromoError('Invalid promo code. Please check and try again.')
            setPromoLoading(false)
            return
        }

        if (data.used_count >= data.max_uses) {
            setPromoError('This promo code has reached its maximum uses.')
            setPromoLoading(false)
            return
        }

        if (data.expires_at && new Date(data.expires_at) < new Date()) {
            setPromoError('This promo code has expired.')
            setPromoLoading(false)
            return
        }

        setPromoResult(data)
        setPromoLoading(false)
    }

    async function handleFreeSubscription() {
        // For 100% off codes — activate subscription without payment
        if (!promoResult || promoResult.discount_pct !== 100) return

        try {
            const now = new Date()
            const periodEnd = new Date(now)
            periodEnd.setDate(periodEnd.getDate() + 30)

            // Update subscription to active
            await supabase
                .from('subscriptions')
                .update({
                    status: 'active',
                    current_period_start: now.toISOString(),
                    current_period_end: periodEnd.toISOString(),
                    amount_paid: 0,
                    promo_code_used: promoResult.code,
                    updated_at: now.toISOString(),
                })
                .eq('org_id', org.id)

            // Increment promo code usage
            await supabase
                .from('promo_codes')
                .update({ used_count: promoResult.used_count + 1 })
                .eq('id', promoResult.id)

            await refetch()
            setPromoResult(null)
            setPromoCode('')
            setShowSuccess(true)

        } catch (err) {
            alert('Something went wrong. Please try again.')
        }
    }

    const features = [
        'Full SKU Explorer with DOC status',
        'Reorder Planner with smart alerts',
        'Portfolio Analysis (Fast Movers, Steady Earners)',
        'Inventory Trends with charts',
        'Warehouse Map with stock breakdown',
        'Daily sales entry — always free',
        'Unlimited warehouses and SKUs',
        'Automatic metric recalculation',
    ]

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-navy">Subscription</h1>
                    <p className="text-sm mt-0.5" style={{ color: '#7880a4' }}>
                        Current status: <span className="font-semibold" style={{ color: '#d63683' }}>{statusLabel}</span>
                    </p>
                </div>

                {/* Active subscription state */}
                {subscription?.status === 'active' && new Date(subscription.current_period_end) > new Date() && (
                    <div className="bg-white rounded-2xl border p-6" style={{ borderColor: '#bbf7d0', background: '#f0fdf4' }}>
                        <div className="flex items-center gap-3 mb-3">
                            <CheckCircle size={24} style={{ color: '#0f9b58' }} />
                            <h2 className="font-bold text-navy">Subscription Active</h2>
                        </div>
                        <p style={{ color: '#7880a4' }}>
                            Your subscription is active for <strong>{daysLeft} more days</strong>. All features are unlocked.
                        </p>
                        {subscription.promo_code_used && (
                            <p className="text-sm mt-2" style={{ color: '#7880a4' }}>
                                Promo code applied: <strong>{subscription.promo_code_used}</strong>
                            </p>
                        )}
                    </div>
                )}

                <div className={`grid gap-6 ${showPricingCard ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 max-w-lg'}`}>

                    {/* Pricing card — only show when not active or expiring soon */}
                    {showPricingCard && <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#e8e5f0' }}>
                        <div className="p-6 border-b" style={{ borderColor: '#e8e5f0', background: '#1e2b71' }}>
                            <p className="text-white text-sm font-medium mb-1">InventSight Pro</p>
                            <div className="flex items-end gap-2">
                                {promoResult && promoResult.discount_pct > 0 && (
                                    <p className="text-2xl font-bold line-through" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                        Rs. {BASE_PRICE.toLocaleString('en-IN')}
                                    </p>
                                )}
                                <p className="text-4xl font-bold text-white">
                                    Rs. {finalPrice.toLocaleString('en-IN')}
                                </p>
                                <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>/month</p>
                            </div>
                            {promoResult && (
                                <p className="text-sm mt-2 font-semibold" style={{ color: '#ffc7a3' }}>
                                    {promoResult.discount_pct}% off applied — code: {promoResult.code}
                                </p>
                            )}
                        </div>

                        <div className="p-6 space-y-4">

                            {/* Promo code input */}
                            <div>
                                <label className="block text-xs font-medium text-navy mb-1.5">
                                    Promo Code
                                </label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#b0b4c8' }} />
                                        <input
                                            type="text"
                                            value={promoCode}
                                            onChange={e => {
                                                setPromoCode(e.target.value.toUpperCase())
                                                setPromoError('')
                                                if (!e.target.value) setPromoResult(null)
                                            }}
                                            placeholder="Enter promo code"
                                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm text-navy focus:outline-none focus:ring-2"
                                            style={{ borderColor: '#e8e5f0' }}
                                        />
                                    </div>
                                    <button
                                        onClick={applyPromoCode}
                                        disabled={promoLoading || !promoCode}
                                        className="px-4 py-2.5 rounded-xl text-sm font-medium text-white"
                                        style={{ background: promoLoading ? '#9ca3af' : '#1e2b71' }}>
                                        {promoLoading ? '...' : 'Apply'}
                                    </button>
                                </div>

                                {promoError && (
                                    <p className="text-xs mt-1.5 font-medium" style={{ color: '#dc2626' }}>
                                        {promoError}
                                    </p>
                                )}

                                {promoResult && (
                                    <div className="flex items-center gap-2 mt-1.5 text-xs font-semibold"
                                        style={{ color: '#0f9b58' }}>
                                        <CheckCircle size={13} />
                                        Code applied — {promoResult.discount_pct}% off
                                        {promoResult.discount_pct === 100 ? ' — completely free!' : ''}
                                    </div>
                                )}
                            </div>

                            {/* CTA Button */}
                            {finalPrice === 0 ? (
                                <button
                                    onClick={handleFreeSubscription}
                                    className="w-full py-3.5 rounded-xl font-semibold text-white text-sm"
                                    style={{ background: '#0f9b58' }}>
                                    🎉 Activate Free Subscription →
                                </button>
                            ) : (
                                <div>
                                    <button
                                        disabled
                                        className="w-full py-3.5 rounded-xl font-semibold text-white text-sm opacity-60 cursor-not-allowed"
                                        style={{ background: '#d63683' }}>
                                        <Lock size={15} className="inline mr-2" />
                                        Pay Rs. {finalPrice.toLocaleString('en-IN')} — Coming Soon
                                    </button>
                                    <p className="text-xs text-center mt-2" style={{ color: '#b0b4c8' }}>
                                        Online payments launching soon. Contact us to subscribe manually.
                                    </p>
                                </div>
                            )}

                            <p className="text-xs text-center" style={{ color: '#b0b4c8' }}>
                                30-day cycle · Cancel anytime · No hidden charges
                            </p>
                        </div>
                    </div>
                    }

                    {/* Features list */}
                    <div className="bg-white rounded-2xl border p-6" style={{ borderColor: '#e8e5f0' }}>
                        <h3 className="font-semibold text-navy mb-4 flex items-center gap-2">
                            <Zap size={18} style={{ color: '#d63683' }} />
                            What you get
                        </h3>
                        <div className="space-y-3">
                            {features.map((f, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                                        style={{ background: '#fff0f7' }}>
                                        <CheckCircle size={12} style={{ color: '#d63683' }} />
                                    </div>
                                    <p className="text-sm text-navy">{f}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-5 p-4 rounded-xl" style={{ background: '#f8f7fc' }}>
                            <p className="text-xs font-semibold text-navy mb-1">Always free — even without subscription:</p>
                            <p className="text-xs" style={{ color: '#7880a4' }}>
                                Daily Sales Entry · Master Data setup · Basic dashboard (Today's Sales, GMV, Total SKUs)
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            {showSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(30,43,113,0.5)' }}>
                    <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm w-full">
                        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                            style={{ background: '#f0fdf4' }}>
                            <span className="text-4xl">🎉</span>
                        </div>
                        <h2 className="text-xl font-bold text-navy mb-2">You're all set!</h2>
                        <p className="text-sm mb-2" style={{ color: '#7880a4' }}>
                            Your subscription is now active for <strong>30 days</strong>.
                        </p>
                        <p className="text-sm mb-6" style={{ color: '#7880a4' }}>
                            All features are unlocked. Start exploring your inventory intelligence.
                        </p>
                        <div className="rounded-xl p-3 mb-6" style={{ background: '#f0fdf4' }}>
                            <p className="text-sm font-semibold" style={{ color: '#0f9b58' }}>
                                ✓ Promo code {promoResult?.code || ''} applied successfully
                            </p>
                        </div>
                        <button
                            onClick={() => { setShowSuccess(false); navigate('/dashboard') }}
                            className="w-full py-3 rounded-xl font-semibold text-white"
                            style={{ background: '#d63683' }}>
                            Go to Dashboard →
                        </button>
                    </div>
                </div>
            )}
        </Layout>
    )
}