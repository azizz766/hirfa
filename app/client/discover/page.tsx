'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, LayoutGrid, Feather, Brush, Pickaxe, Star } from 'lucide-react'

function PotteryIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3h8l1 3H7L8 3z"/>
      <path d="M7 6c0 0-3 3-3 7s2 6 2 6h12s2-2 2-6-3-7-3-7"/>
      <path d="M9 19v2M15 19v2"/>
      <path d="M9 6.5c1 1.5 5 1.5 6 0"/>
    </svg>
  )
}

function CrochetIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 4L8 16"/>
      <path d="M8 16c0 0-2 0-3-1.5S4.5 11 6 10"/>
      <circle cx="18.5" cy="5.5" r="1.5"/>
      <path d="M4 20l4-4"/>
    </svg>
  )
}
import { createClient } from '@/lib/supabase/client'
import { ClientNav } from '@/components/nav/ClientNav'
import { Skel } from '@/components/ui/Skel'
import { toast } from '@/components/ui/Toast'
import { useTranslation, useAppSettings } from '@/lib/theme'
import { LocationPicker } from '@/components/ui/LocationPicker'

// ─── Types ────────────────────────────────────────────────────

type Artist = {
  id: string
  categories: string[]
  rating_avg: number
  orders_count: number
  city: string | null
  userName: string
  userAvatar: string | null
}

// ─── Constants ────────────────────────────────────────────────

const CATEGORIES = ['الكل', 'خط عربي', 'رسم', 'فخار', 'كروشيه', 'نحت']

const CAT_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  'الكل': LayoutGrid,
  'خط عربي': Feather,
  'رسم': Brush,
  'فخار': PotteryIcon,
  'كروشيه': CrochetIcon,
  'نحت': Pickaxe,
}

const CAT_KEY: Record<string, string> = {
  'الكل':    'cat.all',
  'خط عربي': 'cat.calligraphy',
  'رسم':     'cat.painting',
  'فخار':    'cat.pottery',
  'كروشيه':  'cat.crochet',
  'نحت':     'cat.sculpture',
}

// ─── Page ─────────────────────────────────────────────────────

export default function DiscoverPage() {
  const router = useRouter()
  const t = useTranslation()
  const { lang } = useAppSettings()
  const supabase = useMemo(() => createClient(), [])

  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('الكل')
  const [query, setQuery] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        let q = supabase
          .from('artist_profiles')
          .select('*, users!user_id(name, avatar_url)')
          .eq('status', 'approved')
        if (activeCategory !== 'الكل') {
          q = q.contains('categories', [activeCategory])
        }
        const { data, error } = await q
          .order('orders_count', { ascending: false })
          .limit(20)
        if (error) throw error
        setArtists(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (data ?? []).map((a: any) => ({
            ...a,
            userName: a.users?.name ?? t('discover.artists'),
            userAvatar: a.users?.avatar_url ?? null,
          }))
        )
      } catch {
        toast.error(t('discover.errload'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [supabase, activeCategory])

  const filtered = artists.filter((a) => {
    const matchQ = !debouncedQuery || a.userName.includes(debouncedQuery) || a.categories.some((c) => c.includes(debouncedQuery))
    const matchLoc = !locationFilter || a.city?.includes(locationFilter)
    return matchQ && matchLoc
  })

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', background: 'var(--bg-page)', minHeight: '100dvh', direction: 'rtl', paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', padding: '12px 16px' }}>
        <div style={{ background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', marginBottom: 12 }}>
          <Search size={16} color="var(--ink-muted)" />
          <input
            type="text"
            placeholder={t('discover.search')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, color: 'var(--ink-primary)', background: 'transparent', textAlign: 'right', direction: 'rtl' }}
          />
        </div>

        {/* Location filter */}
        <div style={{ marginBottom: 10 }}>
          <LocationPicker
            value={locationFilter ? { city: locationFilter } : {}}
            onChange={(loc) => {
              const display = loc.city || loc.stateName || loc.countryName || ''
              setLocationFilter(display)
            }}
            placeholder={lang === 'en' ? 'Filter by location...' : 'فلتر حسب الموقع...'}
          />
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', flexDirection: 'row-reverse', gap: 8, overflowX: 'auto' }}>
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat
            const CatIcon = CAT_ICONS[cat]
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 'var(--radius-pill)', border: active ? 'none' : '1px solid var(--border)', background: active ? 'var(--accent)' : 'var(--bg-surface)', color: active ? '#FFFFFF' : 'var(--ink-secondary)', fontSize: 12, fontWeight: active ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                {CatIcon && <CatIcon size={13} />}
                {t(CAT_KEY[cat])}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 12, textAlign: 'left' }}>
          {loading ? '' : `${filtered.length} ${t('discover.artists')}`}
        </p>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[0,1,2,3,4,5].map((i) => (
              <div key={i} style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <Skel h={100} r={0} />
                <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Skel h={14} w="70%" />
                  <Skel h={12} w="50%" />
                  <Skel h={12} w="40%" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--ink-muted)' }}>
            <Search size={40} color="var(--border)" style={{ margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontSize: 14, margin: 0 }}>{t('discover.noresults')}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {filtered.map((artist) => (
              <div
                key={artist.id}
                onClick={() => router.push(`/client/artist/${artist.id}`)}
                style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', cursor: 'pointer' }}
              >
                {/* Avatar area */}
                <div style={{
                  height: 100,
                  background: 'var(--img-placeholder)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  {(() => {
                    const categoryImages: Record<string, string> = {
                      'خط عربي': 'https://images.unsplash.com/photo-1585007600263-71228e40c8d1?w=400&q=80',
                      'رسم': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=80',
                      'فخار': 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&q=80',
                      'كروشيه': 'https://images.unsplash.com/photo-1615486511484-92e172cc4b0f?w=400&q=80',
                      'نحت': 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=400&q=80',
                    }
                    const src = artist.userAvatar || categoryImages[artist.categories?.[0]] || null
                    return src ? (
                      <img
                        src={src}
                        alt={artist.userName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Brush size={32} color="var(--ink-muted)" />
                    )
                  })()}
                  {artist.city && (
                    <span style={{
                      position: 'absolute',
                      bottom: 6,
                      left: 6,
                      fontSize: 9,
                      background: 'rgba(0,0,0,0.5)',
                      color: '#fff',
                      borderRadius: 4,
                      padding: '2px 6px',
                    }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="white" style={{ flexShrink: 0 }}>
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      {artist.city}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: '10px 10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <p style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--ink-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      margin: 0,
                      flex: 1,
                    }}>
                      {artist.userName}
                    </p>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginRight: 4 }}>
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#1D9BF0"/>
                      <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--ink-secondary)', marginBottom: 4, margin: '0 0 4px' }}>
                    {artist.categories[0] ?? '—'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ fontSize: 11, color: 'var(--ink-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Star size={11} fill="var(--warning)" color="var(--warning)" /> {artist.rating_avg.toFixed(1)}
                    </p>
                    <p style={{ fontSize: 10, color: 'var(--ink-muted)', margin: 0 }}>
                      {artist.orders_count} {t('discover.orders')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ClientNav />
    </div>
  )
}
