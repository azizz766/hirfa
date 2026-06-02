'use client'

import { createClient } from '@/lib/supabase/client'

export type Role = 'artist' | 'client'

export async function switchRole(newRole: Role): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  if (newRole === 'artist') {
    const { data: profile } = await supabase
      .from('artist_profiles')
      .select('id, status')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return { success: false, error: 'requires_artist_profile' }
    }
    if (profile.status === 'pending') {
      return { success: false, error: 'profile_pending_approval' }
    }
  }

  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (currentUser) {
    await supabase.from('role_history').insert({
      user_id: user.id,
      from_role: currentUser.role,
      to_role: newRole,
    })
  }

  const { error } = await supabase
    .from('users')
    .update({
      role: newRole,
      secondary_role: currentUser?.role ?? null,
    })
    .eq('id', user.id)

  if (error) return { success: false, error: error.message }

  return { success: true }
}

export async function getCurrentRole(): Promise<Role | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  return (data?.role as Role) ?? null
}
