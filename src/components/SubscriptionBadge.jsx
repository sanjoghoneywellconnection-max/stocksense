import { useSubscription } from '../hooks/useSubscription'
import { useNavigate } from 'react-router-dom'

export default function SubscriptionBadge() {
  const { statusLabel, hasAccess, daysLeft } = useSubscription()
  const navigate = useNavigate()

  return (
    <div className="px-3 mb-2">
      <button
        onClick={() => navigate('/subscribe')}
        className="w-full px-3 py-2.5 rounded-xl text-left transition-all hover:opacity-90"
        style={{
          background: hasAccess ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${hasAccess ? '#bbf7d0' : '#fecaca'}`
        }}>
        <p className="text-xs font-semibold"
          style={{color: hasAccess ? '#0f9b58' : '#dc2626'}}>
          {hasAccess ? '✓ ' : '⚠ '}{statusLabel}
        </p>
        {!hasAccess && (
          <p className="text-xs mt-0.5" style={{color: '#dc2626'}}>
            Tap to subscribe →
          </p>
        )}
        {hasAccess && daysLeft <= 5 && (
          <p className="text-xs mt-0.5" style={{color: '#d97706'}}>
            Renew soon
          </p>
        )}
      </button>
    </div>
  )
}