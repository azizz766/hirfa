'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, User, ChevronLeft, LayoutGrid, Feather, Brush, Pickaxe, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ClientNav } from '@/components/nav/ClientNav'
import { Skel } from '@/components/ui/Skel'
import { toast } from '@/components/ui/Toast'
import type { ArtistProfile, OpenBrief } from '@/types'
import { useTranslation } from '@/lib/theme'

type IconComponent = React.ComponentType<{ size?: number; color?: string }>

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

const CATEGORY_DEFS: { key: string; value: string; Icon: IconComponent }[] = [
  { key: 'cat.all',         value: 'الكل',    Icon: LayoutGrid },
  { key: 'cat.calligraphy', value: 'خط عربي', Icon: Feather },
  { key: 'cat.painting',    value: 'رسم',     Icon: Brush },
  { key: 'cat.pottery',     value: 'فخار',    Icon: PotteryIcon },
  { key: 'cat.crochet',     value: 'كروشيه',  Icon: CrochetIcon },
  { key: 'cat.sculpture',   value: 'نحت',     Icon: Pickaxe },
]

const CATEGORY_IMAGES: Record<string, string> = {
  'خط عربي': 'https://images.unsplash.com/photo-1596548438137-d51ea5c83ca5?w=400&q=80',
  'رسم': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=80',
  'فخار': 'https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=400&q=80',
  'كروشيه': 'https://images.unsplash.com/photo-1615486511484-92e172cc4b0f?w=400&q=80',
  'نحت': 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=800&q=80',
}

export default function ClientHomePage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const t = useTranslation()

  const [artists, setArtists] = useState<ArtistProfile[]>([])
  const [briefs, setBriefs] = useState<OpenBrief[]>([])
  const [activeCategory, setActiveCategory] = useState('cat.all')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [loadingArtists, setLoadingArtists] = useState(true)
  const [loadingBriefs, setLoadingBriefs] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  const loadArtists = useCallback(async () => {
    setLoadingArtists(true)
    try {
      const activeDef = CATEGORY_DEFS.find(c => c.key === activeCategory)
      let q = supabase.from('artist_profiles').select('*, users!user_id(name, avatar_url)').eq('status', 'approved')
      if (activeCategory !== 'cat.all' && activeDef) q = q.contains('categories', [activeDef.value])
      const { data, error } = await q.order('orders_count', { ascending: false }).limit(6)
      if (error) throw error
      setArtists(data ?? [])
    } catch {
      toast.error(t('discover.errload'))
    } finally {
      setLoadingArtists(false)
    }
  }, [supabase, activeCategory])

  const loadBriefs = useCallback(async () => {
    setLoadingBriefs(true)
    try {
      const { data, error } = await supabase.from('open_briefs').select('*').order('created_at', { ascending: false }).limit(5)
      if (error) throw error
      setBriefs(data ?? [])
    } catch {
      toast.error('تعذّر تحميل الطلبات')
    } finally {
      setLoadingBriefs(false)
    }
  }, [supabase])

  useEffect(() => { loadArtists() }, [loadArtists])
  useEffect(() => { loadBriefs() }, [loadBriefs])

  const filtered = debouncedQuery
    ? artists.filter(a =>
        a.users?.name?.includes(debouncedQuery) ||
        a.bio?.includes(debouncedQuery) ||
        a.categories.some(c => c.includes(debouncedQuery))
      )
    : artists

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-page)', maxWidth: 430, margin: '0 auto', direction: 'rtl', paddingBottom: 80 }}>

      {/* ── Header ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => router.push('/client/profile')} aria-label="الملف الشخصي" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-secondary)', padding: 8, borderRadius: 'var(--radius-md)', display: 'flex' }}>
          <User size={22} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--ink-primary)' }}>حِرفة</span>
          <div style={{ width: 32, height: 32, background: 'var(--accent)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, boxShadow: '0 2px 8px rgba(192,57,43,0.3)' }}>ح</div>
        </div>
      </div>

      <div style={{ padding: '20px 16px 0' }}>

        {/* ── Greeting + Search ── */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink-primary)', margin: '0 0 4px' }}>{t('home.title')}</h1>
          <p style={{ fontSize: 14, color: 'var(--ink-muted)', margin: '0 0 16px' }}>{t('home.subtitle')}</p>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', boxShadow: 'var(--shadow-sm)' }}>
            <Search size={17} color="var(--ink-muted)" />
            <input type="text" placeholder={t('home.search')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ border: 'none', flex: 1, fontSize: 14, color: 'var(--ink-primary)', background: 'transparent', textAlign: 'right', direction: 'rtl' }} />
          </div>
        </div>

        {/* ── Category Pills ── */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 24, direction: 'rtl' }}>
          {CATEGORY_DEFS.map(({ key, Icon }) => {
            const active = activeCategory === key
            return (
              <button key={key} onClick={() => setActiveCategory(key)} style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 'var(--radius-pill)', border: active ? 'none' : '1px solid var(--border)', background: active ? 'var(--accent)' : 'var(--bg-surface)', color: active ? '#fff' : 'var(--ink-secondary)', fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s', boxShadow: active ? '0 2px 8px rgba(192,57,43,0.2)' : 'none' }}>
                <Icon size={14} />
                <span>{t(key)}</span>
              </button>
            )
          })}
        </div>

        {/* ── Featured Artists ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <button onClick={() => router.push('/client/discover')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2, padding: 0 }}>
            {t('home.viewall')} <ChevronLeft size={14} />
          </button>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-primary)', margin: 0 }}>{t('home.featured')}</h2>
        </div>

        {loadingArtists ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <Skel h={120} r={0} />
                <div style={{ padding: '10px 10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Skel h={14} w="70%" />
                  <Skel h={12} w="50%" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-page)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}><Brush size={28} color="var(--ink-muted)" /></div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-primary)', margin: '0 0 6px' }}>{t('home.noartists')}</p>
            <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: 0 }}>{t('home.tryother')}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
            {filtered.map(artist => {
              const src = artist.users?.avatar_url || CATEGORY_IMAGES[artist.categories?.[0]] || null
              return (
                <div key={artist.id} onClick={() => router.push(`/client/artist/${artist.id}`)}
                  style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  {/* Image */}
                  <div style={{ height: 110, background: 'var(--img-placeholder)', overflow: 'hidden', position: 'relative' }}>
                    {src && <img src={src} alt={artist.users?.name ?? 'فنان'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    {artist.city && (
                      <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.55)', borderRadius: 4, padding: '2px 7px', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <span style={{ fontSize: 9, color: '#fff' }}>📍 {artist.city}</span>
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div style={{ padding: '10px 12px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{artist.users?.name}</p>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginRight: 4 }}>
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#1D9BF0"/>
                        <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--ink-secondary)', margin: '0 0 6px' }}>{artist.categories[0]}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: 3 }}><Star size={11} fill="var(--warning)" color="var(--warning)" /> {artist.rating_avg?.toFixed(1) ?? '—'}</span>
                      <span style={{ fontSize: 10, color: 'var(--ink-muted)' }}>{artist.orders_count} {t('general.order')}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Open Briefs ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <button onClick={() => router.push('/client/briefs/new')} style={{ background: 'var(--accent-light)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius-md)', padding: '6px 12px', fontSize: 12, color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}>
            + {t('home.postbrief')}
          </button>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-primary)', margin: 0 }}>{t('home.openbriefs')}</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 8 }}>
          {loadingBriefs ? (
            [...Array(2)].map((_, i) => <Skel key={i} h={110} r={14} />)
          ) : briefs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-primary)', margin: '0 0 4px' }}>{t('home.nobriefs')}</p>
              <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: '0 0 14px' }}>{t('home.befirst')}</p>
              <button onClick={() => router.push('/client/briefs/new')} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                + {t('home.postbrief')}
              </button>
            </div>
          ) : (
            briefs.map(brief => (
              <div key={brief.id} onClick={() => router.push(`/client/briefs/${brief.id}`)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16, cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-primary)', flex: 1, margin: 0 }}>{brief.title}</p>
                  {brief.category && (
                    <span style={{ fontSize: 11, background: 'var(--bg-page)', color: 'var(--ink-secondary)', borderRadius: 'var(--radius-xs)', padding: '3px 8px', whiteSpace: 'nowrap', border: '1px solid var(--border)', flexShrink: 0 }}>{brief.category}</span>
                  )}
                </div>
                {brief.description && (
                  <p style={{ fontSize: 13, color: 'var(--ink-secondary)', margin: '0 0 10px', lineHeight: 1.55 }}>
                    {brief.description.length > 90 ? brief.description.slice(0, 90) + '...' : brief.description}
                  </p>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {brief.budget_min != null && (
                    <span style={{ fontSize: 14, color: 'var(--ink-primary)', fontWeight: 700 }}>
                      {brief.budget_min}–{brief.budget_max} ر.س
                    </span>
                  )}
                  <button onClick={e => { e.stopPropagation(); router.push(`/client/briefs/${brief.id}`) }} style={{ fontSize: 12, color: 'var(--accent)', background: 'var(--accent-light)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius-sm)', padding: '5px 14px', cursor: 'pointer', fontWeight: 600 }}>
                    {t('home.showdetails')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ClientNav />
    </div>
  )
}
