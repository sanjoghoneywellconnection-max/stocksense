import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export function useOrg() {
  const [org, setOrg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchOrg() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        const { data, error } = await supabase
          .from('org_members')
          .select('org_id, role, organizations(*)')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle()

        if (error) {
          console.error('useOrg error:', error)
          setOrg(null)
        } else if (!data) {
          setOrg(null)
        } else {
          setOrg({ ...data.organizations, role: data.role })
        }
      } catch (err) {
        console.error('useOrg catch:', err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }
    fetchOrg()
  }, [])

  return { org, loading, error }
}