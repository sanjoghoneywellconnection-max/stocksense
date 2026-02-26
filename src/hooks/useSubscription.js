import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useOrg } from './useOrg'

export function useSubscription() {
  const { org } = useOrg()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (org) fetchSubscription()
  }, [org])

  async function fetchSubscription() {
    setLoading(true)
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('org_id', org.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    setSubscription(data)
    setLoading(false)
  }

  // Determine access level
  const now = new Date()

  let isTrialActive = false
  let isSubscriptionActive = false
  let hasAccess = false
  let daysLeft = 0
  let trialDaysLeft = 0
  let statusLabel = 'No Plan'

  if (subscription) {
    if (subscription.status === 'trial') {
      const trialEnd = new Date(subscription.trial_ends_at)
      isTrialActive = now < trialEnd
      daysLeft = Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)))
      trialDaysLeft = daysLeft
      hasAccess = isTrialActive
      statusLabel = isTrialActive ? `Trial · ${daysLeft} days left` : 'Trial Expired'
    }

    if (subscription.status === 'active') {
      const periodEnd = new Date(subscription.current_period_end)
      isSubscriptionActive = now < periodEnd
      daysLeft = Math.max(0, Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24)))
      hasAccess = isSubscriptionActive
      statusLabel = isSubscriptionActive ? `Active · ${daysLeft} days left` : 'Subscription Expired'
    }

    if (subscription.status === 'expired') {
      hasAccess = false
      statusLabel = 'Expired'
    }
  }

  return {
    subscription,
    loading,
    hasAccess,
    isTrialActive,
    isSubscriptionActive,
    daysLeft,
    trialDaysLeft,
    statusLabel,
    refetch: fetchSubscription,
  }
}