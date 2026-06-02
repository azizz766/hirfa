'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ArtistCompletePage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [msg, setMsg] = useState('جارٍ إعداد حسابك...')

  useEffect(() => {
    async function complete() {
      const supabase = createClient()

      // 1. Get authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) {
        setStatus('error')
        setMsg('تعذّر التحقق من هويتك. حاول مرة أخرى.')
        return
      }

      // 2. Check if artist_profile already exists (idempotent)
      const { data: existing } = await supabase
        .from('artist_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (existing) {
        router.replace('/artist/studio')
        return
      }

      // 3. Read draft from Supabase (works across devices)
      const { data: draft } = await supabase
        .from('artist_drafts')
        .select('*')
        .eq('email', user.email)
        .single()

      // 4. Fallback to localStorage for same-device signups
      const pendingRaw = draft ? null : localStorage.getItem('hirfa_artist_pending')
      const pending = draft ?? (pendingRaw ? JSON.parse(pendingRaw) : null) ?? {
        name: user.email.split('@')[0],
        bio: null,
        city: null,
        years_experience: 0,
        categories: [],
        portfolio_urls: [],
      }

      // 5. Upsert users row
      setMsg('جارٍ إنشاء ملفك الشخصي...')
      await supabase.from('users').upsert({
        id: user.id,
        name: pending.name,
        role: 'artist',
      }, { onConflict: 'id' })

      // 6. Insert artist_profile
      const { data: profile, error: profileError } = await supabase
        .from('artist_profiles')
        .insert({
          user_id: user.id,
          bio: pending.bio ?? null,
          city: pending.city ?? null,
          years_experience: pending.years_experience ?? 0,
          categories: pending.categories ?? [],
          status: 'active',
        })
        .select('id')
        .single()

      if (profileError || !profile) {
        setStatus('error')
        setMsg('حدث خطأ أثناء إنشاء الملف الشخصي. تواصل مع الدعم.')
        return
      }

      // 7. Insert portfolio items
      const urls: string[] = pending.portfolio_urls ?? []
      if (urls.length > 0) {
        setMsg('جارٍ رفع أعمالك...')
        try {
          const { error: portfolioError } = await supabase.from('portfolio_items').insert(
            urls.map((url: string) => ({
              artist_id: profile.id,
              image_url: url,
            }))
          )
          if (portfolioError) {
            console.error('Portfolio insert failed:', portfolioError.message)
          }
        } catch (e) {
          console.error('Portfolio insert exception:', e)
        }
      }

      // 8. Cleanup
      await supabase.from('artist_drafts').delete().eq('email', user.email)
      localStorage.removeItem('hirfa_artist_pending')

      router.replace('/artist/studio')
    }

    complete()
  }, [router])

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg-page)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      direction: 'rtl',
      gap: 16,
    }}>
      {status === 'loading' ? (
        <>
          <div className="hirfa-spin" style={{
            width: 48, height: 48,
            border: '3px solid var(--border)',
            borderTop: '3px solid var(--accent)',
            borderRadius: '50%',
          }} />
          <p style={{ fontSize: 15, color: 'var(--ink-secondary)', margin: 0 }}>{msg}</p>
        </>
      ) : (
        <>
          <p style={{ fontSize: 16, color: 'var(--accent)', fontWeight: 600 }}>⚠️ {msg}</p>
          <button
            onClick={() => window.location.href = '/auth/artist'}
            style={{
              background: 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-md)',
              padding: '12px 24px', fontSize: 14,
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            حاول مرة أخرى
          </button>
        </>
      )}
    </div>
  )
}
