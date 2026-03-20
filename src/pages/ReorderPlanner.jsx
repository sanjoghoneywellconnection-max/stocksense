import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useOrg } from '../hooks/useOrg'
import { supabase } from '../supabaseClient'
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import TrainingButton from '../components/TrainingButton'
import { calculateIntelligentReorder, getSaleEvent } from '../data/seasonalData'

export default function ReorderPlanner() {
    const { org } = useOrg()
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [expandedId, setExpandedId] = useState(null)
    const [filter, setFilter] = useState('all')

    useEffect(() => { if (org) fetchData() }, [org])

    async function fetchData() {
        setLoading(true)
        const { data: metrics } = await supabase
            .from('sku_metrics')
            .select(`
        sku_id, doc_status, doc_days, reorder_deadline, days_to_reorder,
        drr_7d, drr_30d, drr_90d, growth_rate_pct, total_current_stock,
        revenue_30d, calculated_on,
        skus(
          id, item_name, variant_name, sku_code,
          lead_time_days, safety_stock_days, moq, selling_price,
          categories(name)
        )
      `)
            .eq('org_id', org.id)
            .order('calculated_on', { ascending: false })

        if (!metrics) { setLoading(false); return }

        // Deduplicate by sku_id + filter out inactive/discontinued SKUs
        const seen = new Set()
        const unique = (metrics || []).filter(m => {
            if (seen.has(m.sku_id)) return false
            if (!m.skus) return false // orphaned metric — SKU deleted
            seen.add(m.sku_id); return true
        })

        // Enrich with intelligent reorder calculation
        const enriched = unique.map(m => {
            const categoryName = m.skus?.categories?.name || ''
            const intel = calculateIntelligentReorder(m.skus, m, categoryName)
            return { ...m, intel, categoryName }
        })

        // Sort by urgency
        const urgencyOrder = { black: 0, red: 1, amber: 2, green: 3 }
        enriched.sort((a, b) => (urgencyOrder[a.doc_status] || 4) - (urgencyOrder[b.doc_status] || 4))

        setItems(enriched)
        setLoading(false)
    }

    async function handleRefresh() {
        setRefreshing(true)
        await supabase.rpc('calculate_sku_metrics', { p_org_id: org.id })
        await fetchData()
        setRefreshing(false)
    }

    const currentMonth = new Date().getMonth() + 1
    const saleEvent = getSaleEvent(currentMonth)

    const filtered = filter === 'all' ? items
        : filter === 'urgent' ? items.filter(i => ['red', 'black'].includes(i.doc_status))
            : items.filter(i => i.doc_status === filter)

    const statusConfig = {
        black: { label: 'Critical', color: '#111827', bg: '#f9fafb', border: '#e5e7eb', dot: '#111827' },
        red: { label: 'Act Now', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', dot: '#dc2626' },
        amber: { label: 'Plan Now', color: '#d97706', bg: '#fffbeb', border: '#fde68a', dot: '#d97706' },
        green: { label: 'Healthy', color: '#0f9b58', bg: '#f0fdf4', border: '#bbf7d0', dot: '#0f9b58' },
    }

    const trendIcon = (status) => {
        if (status === 'accelerating' || status === 'growing') return <TrendingUp size={13} style={{ color: '#0f9b58' }} />
        if (status === 'declining' || status === 'slowing') return <TrendingDown size={13} style={{ color: '#dc2626' }} />
        return <Minus size={13} style={{ color: '#7880a4' }} />
    }

    if (loading) return (
        <Layout>
            <div className="flex items-center justify-center h-96">
                <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: '#d63683', borderTopColor: 'transparent' }} />
            </div>
        </Layout>
    )

    return (
        <Layout>
            <div className="max-w-6xl mx-auto space-y-5">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-navy">Reorder Planner</h1>
                        <p className="text-sm mt-0.5" style={{ color: '#7880a4' }}>
                            Intelligent reorder quantities — trend + season + market events combined
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <TrainingButton title="Reorder Training" />
                        <button onClick={handleRefresh} disabled={refreshing}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border"
                            style={{ borderColor: '#e8e5f0', color: '#7880a4', background: 'white' }}>
                            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                            {refreshing ? 'Recalculating...' : 'Refresh'}
                        </button>
                    </div>
                </div>

                {/* Sale event banner */}
                {saleEvent.event && (
                    <div className="flex items-center gap-4 px-5 py-4 rounded-2xl flex-wrap"
                        style={{ background: 'linear-gradient(135deg, #1e2b71, #2d3e9e)', border: '1px solid #3d52b0' }}>
                        <span style={{ fontSize: '28px' }}>🛍️</span>
                        <div>
                            <p className="font-bold text-white text-sm">{saleEvent.event} — This Month</p>
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
                                Sale event multiplier active — reorder quantities increased by {saleEvent.multiplier}x automatically
                            </p>
                        </div>
                        <div className="ml-auto px-4 py-2 rounded-xl font-bold text-sm"
                            style={{ background: '#d63683', color: 'white' }}>
                            {saleEvent.multiplier}x Active
                        </div>
                    </div>
                )}

                {/* Summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Critical', key: 'black', count: items.filter(i => i.doc_status === 'black').length },
                        { label: 'Act Now', key: 'red', count: items.filter(i => i.doc_status === 'red').length },
                        { label: 'Plan Now', key: 'amber', count: items.filter(i => i.doc_status === 'amber').length },
                        { label: 'Healthy', key: 'green', count: items.filter(i => i.doc_status === 'green').length },
                    ].map(({ label, key, count }) => {
                        const s = statusConfig[key]
                        return (
                            <button key={key}
                                onClick={() => setFilter(filter === key ? 'all' : key)}
                                className="rounded-2xl border p-4 text-left transition-all hover:shadow-sm"
                                style={{
                                    background: filter === key ? s.bg : 'white',
                                    borderColor: filter === key ? s.border : '#e8e5f0',
                                }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.dot }} />
                                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: s.color }}>{label}</p>
                                </div>
                                <p className="text-3xl font-bold" style={{ color: s.color }}>{count}</p>
                            </button>
                        )
                    })}
                </div>

                {/* Intelligence explanation */}
                <div className="rounded-2xl border p-4 flex items-start gap-4"
                    style={{ background: '#f8f7fc', borderColor: '#e8e5f0' }}>
                    <span style={{ fontSize: '24px', flexShrink: 0 }}>🧠</span>
                    <div>
                        <p className="text-sm font-semibold text-navy mb-1">How intelligent reorder quantities work</p>
                        <p className="text-xs" style={{ color: '#7880a4', lineHeight: '1.7' }}>
                            Every quantity is calculated using three signals combined —
                            <strong style={{ color: '#1e2b71' }}> Sales trend</strong> (is this SKU accelerating or slowing?),
                            <strong style={{ color: '#1e2b71' }}> Seasonal demand</strong> (peak or off season for this category?), and
                            <strong style={{ color: '#1e2b71' }}> Market events</strong> (is a major sale event coming?).
                            Click any SKU to see the full reasoning.
                        </p>
                    </div>
                </div>

                {/* Reorder table */}
                {filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl border p-16 text-center" style={{ borderColor: '#e8e5f0' }}>
                        <span className="text-5xl block mb-4">✓</span>
                        <p className="font-semibold text-navy text-lg mb-2">All clear</p>
                        <p className="text-sm" style={{ color: '#7880a4' }}>No SKUs in this category right now</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map(item => {
                            const sku = item.skus
                            const s = statusConfig[item.doc_status] || statusConfig.green
                            const intel = item.intel
                            const isExpanded = expandedId === item.sku_id

                            return (
                                <div key={item.sku_id}
                                    className="bg-white rounded-2xl border overflow-hidden"
                                    style={{ borderColor: isExpanded ? s.border : '#e8e5f0' }}>

                                    {/* Main row */}
                                    <div
                                        className="flex items-center gap-4 p-4 cursor-pointer"
                                        onClick={() => setExpandedId(isExpanded ? null : item.sku_id)}>

                                        {/* Status bar */}
                                        <div className="w-1 h-12 rounded-full flex-shrink-0"
                                            style={{ background: s.dot }} />

                                        {/* SKU info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-semibold text-navy text-sm truncate">{sku?.item_name}</p>
                                                {sku?.variant_name && (
                                                    <span className="text-xs px-2 py-0.5 rounded-lg"
                                                        style={{ background: '#f0edf8', color: '#7880a4' }}>
                                                        {sku.variant_name}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                <p className="text-xs" style={{ color: '#7880a4' }}>{sku?.sku_code}</p>
                                                {item.categoryName && (
                                                    <p className="text-xs" style={{ color: '#b0b4c8' }}>· {item.categoryName}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* DOC */}
                                        <div className="text-center hidden sm:block flex-shrink-0">
                                            <p className="text-xs font-medium mb-0.5" style={{ color: '#7880a4' }}>Stock Left</p>
                                            <p className="font-bold text-sm" style={{ color: s.color }}>
                                                {parseFloat(item.doc_days || 0) > 0
                                                    ? `${parseFloat(item.doc_days).toFixed(0)}d`
                                                    : 'OOS'}
                                            </p>
                                        </div>

                                        {/* DRR */}
                                        <div className="text-center hidden sm:block flex-shrink-0">
                                            <p className="text-xs font-medium mb-0.5" style={{ color: '#7880a4' }}>Daily Sales</p>
                                            <div className="flex items-center gap-1 justify-center">
                                                {trendIcon(intel.trend.status)}
                                                <p className="font-bold text-sm text-navy">
                                                    {parseFloat(item.drr_7d || 0).toFixed(1)}/day
                                                </p>
                                            </div>
                                        </div>

                                        {/* Intelligent order qty */}
                                        <div className="text-center flex-shrink-0">
                                            <p className="text-xs font-medium mb-0.5" style={{ color: '#7880a4' }}>Order Qty</p>
                                            <div className="flex items-center gap-1.5 justify-center">
                                                <p className="font-bold text-lg" style={{ color: '#d63683' }}>
                                                    {intel.finalQty}
                                                </p>
                                                {intel.combined > 1.0 && (
                                                    <span className="text-xs font-bold px-1.5 py-0.5 rounded-lg"
                                                        style={{ background: '#fff0f7', color: '#d63683' }}>
                                                        {intel.combined}x
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Confidence */}
                                        <div className="text-center hidden sm:block flex-shrink-0">
                                            <p className="text-xs font-medium mb-0.5" style={{ color: '#7880a4' }}>Confidence</p>
                                            <span className="text-xs font-bold px-2 py-1 rounded-lg"
                                                style={{ background: `${intel.confidenceColor}15`, color: intel.confidenceColor }}>
                                                {intel.confidence}
                                            </span>
                                        </div>

                                        {/* Status badge */}
                                        <div className="flex-shrink-0">
                                            <span className="text-xs font-bold px-3 py-1.5 rounded-xl"
                                                style={{ background: s.bg, color: s.color }}>
                                                {s.label}
                                            </span>
                                        </div>

                                        {/* Expand */}
                                        <div className="flex-shrink-0" style={{ color: '#b0b4c8' }}>
                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </div>
                                    </div>

                                    {/* Expanded reasoning */}
                                    {isExpanded && (
                                        <div className="border-t px-5 py-5" style={{ borderColor: '#f0edf8', background: '#faf9fd' }}>
                                            <p className="text-xs font-bold uppercase tracking-wider mb-4"
                                                style={{ color: '#7880a4' }}>
                                                🧠 Why {intel.finalQty} units?
                                            </p>

                                            {/* Three signal cards */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">

                                                {/* Trend */}
                                                <div className="rounded-xl p-4 border"
                                                    style={{
                                                        background: intel.trend.status === 'accelerating' || intel.trend.status === 'growing' ? '#f0fdf4'
                                                            : intel.trend.status === 'declining' || intel.trend.status === 'slowing' ? '#fef2f2'
                                                                : 'white',
                                                        borderColor: intel.trend.status === 'accelerating' || intel.trend.status === 'growing' ? '#bbf7d0'
                                                            : intel.trend.status === 'declining' || intel.trend.status === 'slowing' ? '#fecaca'
                                                                : '#e8e5f0',
                                                    }}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        {trendIcon(intel.trend.status)}
                                                        <p className="text-xs font-bold" style={{ color: '#1e2b71' }}>Sales Trend</p>
                                                        <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-lg"
                                                            style={{
                                                                background: intel.trend.multiplier > 1 ? '#f0fdf4'
                                                                    : intel.trend.multiplier < 1 ? '#fef2f2' : '#f8f7fc',
                                                                color: intel.trend.multiplier > 1 ? '#0f9b58'
                                                                    : intel.trend.multiplier < 1 ? '#dc2626' : '#7880a4',
                                                            }}>
                                                            {intel.trend.multiplier}x
                                                        </span>
                                                    </div>
                                                    <p className="text-xs" style={{ color: '#374151', lineHeight: '1.6' }}>
                                                        {intel.trend.label}
                                                    </p>
                                                    <div className="flex gap-3 mt-2 text-xs" style={{ color: '#7880a4' }}>
                                                        <span>7d: {parseFloat(item.drr_7d || 0).toFixed(1)}/day</span>
                                                        <span>30d: {parseFloat(item.drr_30d || 0).toFixed(1)}/day</span>
                                                        <span>90d: {parseFloat(item.drr_90d || 0).toFixed(1)}/day</span>
                                                    </div>
                                                </div>

                                                {/* Seasonal */}
                                                <div className="rounded-xl p-4 border"
                                                    style={{
                                                        background: intel.seasonal.status === 'peak' ? '#fff0f7'
                                                            : intel.seasonal.status === 'off' ? '#f8f7fc' : 'white',
                                                        borderColor: intel.seasonal.status === 'peak' ? '#f9a8d4'
                                                            : intel.seasonal.status === 'off' ? '#e8e5f0' : '#e8e5f0',
                                                    }}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span style={{ fontSize: '13px' }}>
                                                            {intel.seasonal.status === 'peak' ? '🔥' : intel.seasonal.status === 'off' ? '❄️' : '📅'}
                                                        </span>
                                                        <p className="text-xs font-bold" style={{ color: '#1e2b71' }}>Seasonal Demand</p>
                                                        <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-lg"
                                                            style={{
                                                                background: intel.seasonal.multiplier > 1 ? '#fff0f7'
                                                                    : intel.seasonal.multiplier < 1 ? '#f8f7fc' : '#f8f7fc',
                                                                color: intel.seasonal.multiplier > 1 ? '#d63683'
                                                                    : intel.seasonal.multiplier < 1 ? '#7880a4' : '#7880a4',
                                                            }}>
                                                            {intel.seasonal.multiplier}x
                                                        </span>
                                                    </div>
                                                    <p className="text-xs" style={{ color: '#374151', lineHeight: '1.6' }}>
                                                        {intel.seasonal.label}
                                                    </p>
                                                    <p className="text-xs mt-2" style={{ color: '#7880a4' }}>
                                                        {intel.seasonal.status === 'peak' ? '↑ Demand expected to be higher than normal'
                                                            : intel.seasonal.status === 'off' ? '↓ Demand expected to be lower than normal'
                                                                : 'Demand expected to be at normal levels'}
                                                    </p>
                                                </div>

                                                {/* Sale event */}
                                                <div className="rounded-xl p-4 border"
                                                    style={{
                                                        background: intel.saleEvent.event ? 'linear-gradient(135deg, #1e2b71, #2d3e9e)' : 'white',
                                                        borderColor: intel.saleEvent.event ? '#3d52b0' : '#e8e5f0',
                                                    }}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span style={{ fontSize: '13px' }}>🛍️</span>
                                                        <p className="text-xs font-bold"
                                                            style={{ color: intel.saleEvent.event ? 'white' : '#1e2b71' }}>
                                                            Market Event
                                                        </p>
                                                        <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-lg"
                                                            style={{
                                                                background: intel.saleEvent.event ? '#d63683' : '#f8f7fc',
                                                                color: 'white',
                                                            }}>
                                                            {intel.saleEvent.multiplier}x
                                                        </span>
                                                    </div>
                                                    <p className="text-xs"
                                                        style={{ color: intel.saleEvent.event ? 'rgba(255,255,255,0.9)' : '#374151', lineHeight: '1.6' }}>
                                                        {intel.saleEvent.event || 'No major sale event this month'}
                                                    </p>
                                                    {intel.saleEvent.event && (
                                                        <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                                                            ↑ Stock up now — sale traffic drives higher sell-through
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Final calculation */}
                                            <div className="rounded-xl p-4 border"
                                                style={{ background: 'white', borderColor: '#e8e5f0' }}>
                                                <p className="text-xs font-bold text-navy mb-3">Final Calculation</p>
                                                <div className="flex items-center gap-2 flex-wrap text-sm">
                                                    <span className="px-3 py-1.5 rounded-lg font-medium"
                                                        style={{ background: '#f0edf8', color: '#1e2b71' }}>
                                                        Base: {intel.baseQty} units
                                                    </span>
                                                    <span style={{ color: '#b0b4c8' }}>×</span>
                                                    <span className="px-3 py-1.5 rounded-lg font-medium"
                                                        style={{ background: '#f0fdf4', color: '#0f9b58' }}>
                                                        Trend: {intel.trend.multiplier}x
                                                    </span>
                                                    <span style={{ color: '#b0b4c8' }}>×</span>
                                                    <span className="px-3 py-1.5 rounded-lg font-medium"
                                                        style={{ background: '#fff0f7', color: '#d63683' }}>
                                                        Season: {intel.seasonal.multiplier}x
                                                    </span>
                                                    <span style={{ color: '#b0b4c8' }}>×</span>
                                                    <span className="px-3 py-1.5 rounded-lg font-medium"
                                                        style={{ background: '#1e2b71', color: 'white' }}>
                                                        Event: {intel.saleEvent.multiplier}x
                                                    </span>
                                                    <span style={{ color: '#b0b4c8' }}>=</span>
                                                    <span className="px-4 py-1.5 rounded-lg font-bold text-base"
                                                        style={{ background: '#d63683', color: 'white' }}>
                                                        {intel.finalQty} units
                                                    </span>
                                                    <span className="text-xs px-2 py-1 rounded-lg font-bold"
                                                        style={{ background: `${intel.confidenceColor}15`, color: intel.confidenceColor }}>
                                                        {intel.confidence} Confidence
                                                    </span>
                                                </div>
                                                {sku?.moq > 1 && (
                                                    <p className="text-xs mt-2" style={{ color: '#7880a4' }}>
                                                        Rounded up to nearest MOQ of {sku.moq} units
                                                    </p>
                                                )}
                                            </div>

                                            {/* Reorder deadline */}
                                            {item.reorder_deadline && (
                                                <div className="mt-3 flex items-center gap-3 px-4 py-3 rounded-xl"
                                                    style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                                                    <AlertTriangle size={16} style={{ color: s.color, flexShrink: 0 }} />
                                                    <p className="text-sm font-medium" style={{ color: s.color }}>
                                                        Place order by{' '}
                                                        <strong>
                                                            {new Date(item.reorder_deadline).toLocaleDateString('en-IN', {
                                                                day: 'numeric', month: 'long', year: 'numeric'
                                                            })}
                                                        </strong>
                                                        {' '}— {Math.max(0, Math.round(item.days_to_reorder || 0))} days from today
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </Layout>
    )
}