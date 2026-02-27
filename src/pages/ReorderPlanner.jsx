import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useOrg } from '../hooks/useOrg'
import { supabase } from '../supabaseClient'
import {
    AlertTriangle, CheckCircle, Clock, Package,
    RefreshCw, ShoppingCart, ChevronDown, ChevronUp, X
} from 'lucide-react'
import TrainingButton from '../components/TrainingButton'

const DOC_CONFIG = {
    green: { label: 'Healthy', color: '#0f9b58', bg: '#f0fdf4', border: '#bbf7d0' },
    amber: { label: 'Plan Now', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    red: { label: 'Act Now', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    black: { label: 'Critical', color: '#111827', bg: '#f3f4f6', border: '#d1d5db' },
}

export default function ReorderPlanner() {
    const { org } = useOrg()
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [expanded, setExpanded] = useState(null)
    const [orderModal, setOrderModal] = useState(null)
    const [placingOrder, setPlacingOrder] = useState(false)
    const [orderForm, setOrderForm] = useState({
        order_qty: '',
        expected_arrival: '',
        vendor_name: '',
        po_reference: '',
        notes: '',
    })
    const [justOrdered, setJustOrdered] = useState(new Set())

    useEffect(() => { if (org) fetchItems() }, [org])

    async function fetchItems() {
        setLoading(true)
        const { data, error } = await supabase
            .from('sku_metrics')
            .select(`
        sku_id, doc_days, doc_status, drr_30d, drr_7d,
        total_current_stock, reorder_point_qty, reorder_deadline,
        days_to_reorder, bcg_class, revenue_30d, calculated_on,
        skus(
          id, sku_code, item_name, variant_name,
          lead_time_days, lead_time_type, vendor_name,
          minimum_order_qty, cost_price, selling_price,
          brands_master(name), categories(name)
        )
      `)
            .eq('org_id', org.id)
            .in('doc_status', ['black', 'red', 'amber'])
            .order('calculated_on', { ascending: false })

        if (error) { console.error(error); setLoading(false); return }

        // Deduplicate — keep only latest per SKU
        const seen = new Set()
        const unique = (data || []).filter(m => {
            if (seen.has(m.sku_id)) return false
            seen.add(m.sku_id)
            return true
        })

        // Sort by urgency: black first, then red, then amber, then by days_to_reorder
        unique.sort((a, b) => {
            const order = { black: 0, red: 1, amber: 2, green: 3 }
            if (order[a.doc_status] !== order[b.doc_status])
                return order[a.doc_status] - order[b.doc_status]
            return (a.days_to_reorder ?? 999) - (b.days_to_reorder ?? 999)
        })

        setItems(unique)
        setLoading(false)
    }

    async function handleRefresh() {
        setRefreshing(true)
        await supabase.rpc('calculate_sku_metrics', { p_org_id: org.id })
        await fetchItems()
        setRefreshing(false)
    }

    function openOrderModal(item) {
        const sku = item.skus
        const suggestedQty = Math.max(
            sku?.minimum_order_qty || 1,
            Math.ceil((parseFloat(item.drr_30d) || 0) * 45) // 45 days of cover
        )
        const arrivalDate = new Date()
        arrivalDate.setDate(arrivalDate.getDate() + (sku?.lead_time_days || 15))

        setOrderForm({
            order_qty: suggestedQty.toString(),
            expected_arrival: arrivalDate.toISOString().split('T')[0],
            vendor_name: sku?.vendor_name || '',
            po_reference: '',
            notes: '',
        })
        setOrderModal(item)
    }

    async function handlePlaceOrder(e) {
        e.preventDefault()
        setPlacingOrder(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()

            // Get warehouse for this SKU
            const { data: stockData } = await supabase
                .from('sku_warehouse_stock')
                .select('warehouse_id')
                .eq('sku_id', orderModal.sku_id)
                .limit(1)
                .single()

            const totalCost = parseInt(orderForm.order_qty) * (orderModal.skus?.cost_price || 0)

            const { error } = await supabase
                .from('procurement_events')
                .insert({
                    org_id: org.id,
                    sku_id: orderModal.sku_id,
                    destination_wh_id: stockData?.warehouse_id,
                    order_date: new Date().toISOString().split('T')[0],
                    order_qty: parseInt(orderForm.order_qty),
                    unit_cost: orderModal.skus?.cost_price || 0,
                    total_cost: totalCost,
                    vendor_name: orderForm.vendor_name || orderModal.skus?.vendor_name || null,
                    expected_arrival: orderForm.expected_arrival,
                    status: 'ordered',
                    notes: orderForm.notes || null,
                    po_reference: orderForm.po_reference || null,
                    created_by: user.id,
                })

            if (error) throw error

            setJustOrdered(prev => new Set([...prev, orderModal.sku_id]))
            setOrderModal(null)

            // Refresh after 2 seconds
            setTimeout(() => fetchItems(), 2000)

        } catch (err) {
            alert('Error placing order: ' + err.message)
        } finally {
            setPlacingOrder(false)
        }
    }

    const blackCount = items.filter(i => i.doc_status === 'black').length
    const redCount = items.filter(i => i.doc_status === 'red').length
    const amberCount = items.filter(i => i.doc_status === 'amber').length

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
            <div className="max-w-5xl mx-auto space-y-5">

                {/* Header */}
                <TrainingButton title="Reorder Planner Training" />
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-navy">Reorder Planner</h1>
                        <p className="text-sm mt-0.5" style={{ color: '#7880a4' }}>
                            SKUs that need your attention — sorted by urgency
                        </p>
                    </div>
                    <button onClick={handleRefresh} disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all"
                        style={{ borderColor: '#e8e5f0', color: '#7880a4', background: 'white' }}>
                        <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                        {refreshing ? 'Recalculating...' : 'Refresh'}
                    </button>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
                    {[
                        { count: blackCount, label: 'Critical / OOS', color: '#111827', bg: '#f3f4f6', border: '#d1d5db', icon: '⚫' },
                        { count: redCount, label: 'Act Now', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: '🔴' },
                        { count: amberCount, label: 'Plan Now', color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: '⚡' },
                    ].map(({ count, label, color, bg, border, icon }) => (
                        <div key={label} className="rounded-2xl border p-5 text-center"
                            style={{ background: bg, borderColor: border }}>
                            <p className="text-3xl font-bold mb-1" style={{ color }}>{count}</p>
                            <p className="text-sm font-medium" style={{ color }}>{icon} {label}</p>
                        </div>
                    ))}
                </div>

                {/* All clear state */}
                {items.length === 0 && (
                    <div className="bg-white rounded-2xl border p-16 text-center" style={{ borderColor: '#e8e5f0' }}>
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={36} className="text-green-600" />
                        </div>
                        <h2 className="text-xl font-bold text-navy mb-2">All clear! 🎉</h2>
                        <p style={{ color: '#7880a4' }}>
                            No SKUs need reordering right now. Your stock levels are healthy.
                        </p>
                        <button onClick={handleRefresh}
                            className="mt-4 px-5 py-2.5 rounded-xl text-sm font-medium text-white"
                            style={{ background: '#d63683' }}>
                            Refresh Metrics
                        </button>
                    </div>
                )}

                {/* Reorder items */}
                <div className="space-y-3">
                    {items.map(item => {
                        const sku = item.skus
                        const doc = DOC_CONFIG[item.doc_status]
                        const isExpanded = expanded === item.sku_id
                        const ordered = justOrdered.has(item.sku_id)
                        const suggestedQty = Math.max(
                            sku?.minimum_order_qty || 1,
                            Math.ceil((parseFloat(item.drr_30d) || 0) * 45)
                        )
                        const orderValue = suggestedQty * (sku?.cost_price || 0)

                        return (
                            <div key={item.sku_id}
                                className="bg-white rounded-2xl border overflow-hidden transition-all"
                                style={{
                                    borderColor: ordered ? '#bbf7d0' : doc.border,
                                    borderWidth: '1.5px'
                                }}>

                                {/* Main row */}
                                <div className="flex items-center gap-4 p-5">

                                    {/* Urgency indicator */}
                                    <div className="w-1.5 self-stretch rounded-full flex-shrink-0"
                                        style={{ background: doc.color }} />

                                    {/* SKU info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-semibold text-navy">{sku?.item_name}</p>
                                            {sku?.variant_name && (
                                                <span className="text-xs px-2 py-0.5 rounded-lg"
                                                    style={{ background: '#f0edf8', color: '#7880a4' }}>
                                                    {sku.variant_name}
                                                </span>
                                            )}
                                            <span className="text-xs px-2 py-0.5 rounded-lg font-semibold"
                                                style={{ background: doc.bg, color: doc.color, border: `1px solid ${doc.border}` }}>
                                                {doc.label}
                                            </span>
                                            {ordered && (
                                                <span className="text-xs px-2 py-0.5 rounded-lg font-semibold"
                                                    style={{ background: '#f0fdf4', color: '#0f9b58', border: '1px solid #bbf7d0' }}>
                                                    ✓ Order Logged
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs mt-1" style={{ color: '#7880a4' }}>
                                            {sku?.sku_code} · {sku?.brands_master?.name || ''} · {sku?.categories?.name || ''}
                                        </p>
                                    </div>

                                    {/* Key metrics */}
                                    <div className="hidden md:flex items-center gap-6 flex-shrink-0">
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-navy">{item.total_current_stock}</p>
                                            <p className="text-xs" style={{ color: '#7880a4' }}>in stock</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-bold" style={{ color: doc.color }}>
                                                {item.doc_days > 0 ? `${parseFloat(item.doc_days).toFixed(0)}d` : 'OOS'}
                                            </p>
                                            <p className="text-xs" style={{ color: '#7880a4' }}>DOC left</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-navy">
                                                {parseFloat(item.drr_30d || 0).toFixed(1)}
                                            </p>
                                            <p className="text-xs" style={{ color: '#7880a4' }}>units/day</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-bold"
                                                style={{ color: (item.days_to_reorder || 0) <= 3 ? '#dc2626' : '#d97706' }}>
                                                {item.days_to_reorder === 0 ? 'TODAY' : `${item.days_to_reorder || 0}d`}
                                            </p>
                                            <p className="text-xs" style={{ color: '#7880a4' }}>to order</p>
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {!ordered ? (
                                            <button
                                                onClick={() => openOrderModal(item)}
                                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                                                style={{ background: '#d63683' }}>
                                                <ShoppingCart size={15} />
                                                Place Order
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold"
                                                style={{ background: '#f0fdf4', color: '#0f9b58' }}>
                                                <CheckCircle size={15} />
                                                Ordered
                                            </div>
                                        )}
                                        <button
                                            onClick={() => setExpanded(isExpanded ? null : item.sku_id)}
                                            className="p-2.5 rounded-xl border transition-all hover:bg-gray-50"
                                            style={{ borderColor: '#e8e5f0' }}>
                                            {isExpanded
                                                ? <ChevronUp size={16} style={{ color: '#7880a4' }} />
                                                : <ChevronDown size={16} style={{ color: '#7880a4' }} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded detail */}
                                {isExpanded && (
                                    <div className="px-5 pb-5 pt-0 border-t" style={{ borderColor: '#f0edf8', background: '#faf9fd' }}>
                                        <div className="grid grid-cols-2 gap-5 pt-4">
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#7880a4' }}>
                                                    Why this needs attention
                                                </p>
                                                <div className="space-y-2">
                                                    {[
                                                        { label: 'Current Stock', value: `${item.total_current_stock} units` },
                                                        { label: 'Daily Sales Rate (30d avg)', value: `${parseFloat(item.drr_30d || 0).toFixed(1)} units/day` },
                                                        { label: 'Days of Cover Left', value: item.doc_days > 0 ? `${parseFloat(item.doc_days).toFixed(1)} days` : 'OUT OF STOCK' },
                                                        { label: 'Reorder Point', value: `${item.reorder_point_qty} units (stock + safety buffer)` },
                                                        { label: 'Latest Order Deadline', value: item.reorder_deadline ? new Date(item.reorder_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Immediate' },
                                                    ].map(({ label, value }) => (
                                                        <div key={label} className="flex items-center justify-between py-2 border-b"
                                                            style={{ borderColor: '#f0edf8' }}>
                                                            <span className="text-sm" style={{ color: '#7880a4' }}>{label}</span>
                                                            <span className="text-sm font-semibold text-navy">{value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#7880a4' }}>
                                                    Suggested Order
                                                </p>
                                                <div className="bg-white rounded-xl border p-4 space-y-3" style={{ borderColor: '#e8e5f0' }}>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm" style={{ color: '#7880a4' }}>Suggested Quantity</span>
                                                        <span className="text-sm font-bold text-navy">{suggestedQty} units</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm" style={{ color: '#7880a4' }}>Based on</span>
                                                        <span className="text-sm font-medium text-navy">45 days of cover</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm" style={{ color: '#7880a4' }}>Minimum Order (MOQ)</span>
                                                        <span className="text-sm font-medium text-navy">{sku?.minimum_order_qty} units</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm" style={{ color: '#7880a4' }}>Est. Order Value</span>
                                                        <span className="text-sm font-bold" style={{ color: '#d63683' }}>
                                                            Rs. {(orderValue / 1000).toFixed(1)}K
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm" style={{ color: '#7880a4' }}>Lead Time</span>
                                                        <span className="text-sm font-medium text-navy">{sku?.lead_time_days} days</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm" style={{ color: '#7880a4' }}>Vendor</span>
                                                        <span className="text-sm font-medium text-navy">{sku?.vendor_name || '—'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => openOrderModal(item)}
                                                    className="w-full mt-3 py-3 rounded-xl text-sm font-semibold text-white"
                                                    style={{ background: '#d63683' }}>
                                                    Place Order for {suggestedQty} units →
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

            </div>

            {/* Order Modal */}
            {orderModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
                    style={{ background: 'rgba(30,43,113,0.5)' }}>
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-screen overflow-y-auto">

                        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#e8e5f0' }}>
                            <div>
                                <h2 className="font-bold text-navy">Log Purchase Order</h2>
                                <p className="text-xs mt-0.5" style={{ color: '#7880a4' }}>
                                    {orderModal.skus?.item_name} · {orderModal.skus?.variant_name}
                                </p>
                            </div>
                            <button onClick={() => setOrderModal(null)}
                                className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                                <X size={18} style={{ color: '#7880a4' }} />
                            </button>
                        </div>

                        <form onSubmit={handlePlaceOrder} className="p-6 space-y-4">

                            <div>
                                <label className="block text-xs font-medium text-navy mb-1.5">
                                    Order Quantity (units) <span className="text-pink">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={orderForm.order_qty}
                                    onChange={e => setOrderForm(p => ({ ...p, order_qty: e.target.value }))}
                                    required min="1"
                                    className="w-full px-4 py-3 rounded-xl border text-navy focus:outline-none focus:ring-2 focus:ring-pink"
                                    style={{ borderColor: '#e8e5f0' }}
                                />
                                <p className="text-xs mt-1" style={{ color: '#b0b4c8' }}>
                                    MOQ: {orderModal.skus?.minimum_order_qty} units · Suggested: {Math.max(orderModal.skus?.minimum_order_qty || 1, Math.ceil((parseFloat(orderModal.drr_30d) || 0) * 45))} units
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-navy mb-1.5">
                                    Expected Arrival Date <span className="text-pink">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={orderForm.expected_arrival}
                                    onChange={e => setOrderForm(p => ({ ...p, expected_arrival: e.target.value }))}
                                    required
                                    className="w-full px-4 py-3 rounded-xl border text-navy focus:outline-none focus:ring-2 focus:ring-pink"
                                    style={{ borderColor: '#e8e5f0' }}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-navy mb-1.5">Vendor Name</label>
                                <input
                                    type="text"
                                    value={orderForm.vendor_name}
                                    onChange={e => setOrderForm(p => ({ ...p, vendor_name: e.target.value }))}
                                    placeholder={orderModal.skus?.vendor_name || 'Enter vendor name'}
                                    className="w-full px-4 py-3 rounded-xl border text-navy focus:outline-none focus:ring-2 focus:ring-pink"
                                    style={{ borderColor: '#e8e5f0' }}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-navy mb-1.5">PO Reference Number</label>
                                <input
                                    type="text"
                                    value={orderForm.po_reference}
                                    onChange={e => setOrderForm(p => ({ ...p, po_reference: e.target.value }))}
                                    placeholder="e.g. PO-2026-001"
                                    className="w-full px-4 py-3 rounded-xl border text-navy focus:outline-none focus:ring-2 focus:ring-pink"
                                    style={{ borderColor: '#e8e5f0' }}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-navy mb-1.5">Notes</label>
                                <textarea
                                    value={orderForm.notes}
                                    onChange={e => setOrderForm(p => ({ ...p, notes: e.target.value }))}
                                    placeholder="Any special instructions..."
                                    rows={2}
                                    className="w-full px-4 py-3 rounded-xl border text-navy focus:outline-none focus:ring-2 focus:ring-pink resize-none"
                                    style={{ borderColor: '#e8e5f0' }}
                                />
                            </div>

                            {/* Order summary */}
                            <div className="rounded-xl p-4" style={{ background: '#f8f7fc' }}>
                                <div className="flex justify-between text-sm">
                                    <span style={{ color: '#7880a4' }}>Est. Order Value</span>
                                    <span className="font-bold" style={{ color: '#d63683' }}>
                                        Rs. {((parseInt(orderForm.order_qty) || 0) * (orderModal.skus?.cost_price || 0)).toLocaleString('en-IN')}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="submit" disabled={placingOrder}
                                    className="flex-1 py-3 rounded-xl font-semibold text-white transition-all"
                                    style={{ background: placingOrder ? '#9ca3af' : '#d63683' }}>
                                    {placingOrder ? 'Logging order...' : '✓ Confirm Order Placed'}
                                </button>
                                <button type="button" onClick={() => setOrderModal(null)}
                                    className="px-5 py-3 rounded-xl font-medium border"
                                    style={{ borderColor: '#e8e5f0', color: '#7880a4' }}>
                                    Cancel
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}

        </Layout>
    )
}