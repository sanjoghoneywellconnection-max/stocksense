import { useSubscription } from '../hooks/useSubscription'
import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'

export default function PaywallBlur({ children }) {
  const { hasAccess, loading } = useSubscription()
  const navigate = useNavigate()

  if (loading) return <>{children}</>
  if (hasAccess) return <>{children}</>

  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="pointer-events-none select-none" style={{filter: 'blur(6px)', opacity: 0.4}}>
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="bg-white rounded-2xl shadow-2xl border p-8 text-center max-w-sm mx-4"
          style={{borderColor: '#e8e5f0'}}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{background: '#fff0f7'}}>
            <Lock size={28} style={{color: '#d63683'}} />
          </div>
          <h3 className="text-lg font-bold text-navy mb-2">
            Subscription Required
          </h3>
          <p className="text-sm mb-5" style={{color: '#7880a4'}}>
            Your free trial has ended. Subscribe to continue accessing your inventory intelligence.
          </p>
          <div className="rounded-xl p-4 mb-5" style={{background: '#f8f7fc'}}>
            <p className="text-2xl font-bold text-navy">Rs. 4,999</p>
            <p className="text-sm" style={{color: '#7880a4'}}>per month · cancel anytime</p>
          </div>
          <button
            onClick={() => navigate('/subscribe')}
            className="w-full py-3 rounded-xl font-semibold text-white text-sm"
            style={{background: '#d63683'}}>
            Subscribe Now →
          </button>
          <p className="text-xs mt-3" style={{color: '#b0b4c8'}}>
            Have a promo code? Apply it on the next screen.
          </p>
        </div>
      </div>
    </div>
  )
}