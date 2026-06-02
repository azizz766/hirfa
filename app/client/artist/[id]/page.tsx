'use client'

import { use, useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Share2, Clock, MapPin, ChevronDown, ChevronUp, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Skel } from '@/components/ui/Skel'
import { toast } from '@/components/ui/Toast'
import { useTranslation } from '@/lib/theme'

type ArtistData = {
  id: string
  user_id: string
  bio: string | null
  categories: string[]
  years_experience: number
  rating_avg: number
  orders_count: number
  response_time: string | null
  status: string
  city: string | null
  users: { name: string; avatar_url: string | null }
}
type PortfolioItem = {
  id: string
  image_url: string
  title: string | null
  category: string | null
}
type Service = {
  id: string
  name: string
  size_label: string
  dimensions: string | null
  delivery_days: number
  base_price: number
  currency: string
}

const CATEGORY_IMAGES: Record<string, string> = {
  'خط عربي': 'https://images.unsplash.com/photo-1596548438137-d51ea5c83ca5?w=800&q=80',
  'رسم': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80',
  'فخار': 'https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=800&q=80',
  'كروشيه': 'https://images.unsplash.com/photo-1615486511484-92e172cc4b0f?w=800&q=80',
  'نحت': 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=800&q=80',
}

function PageSkeleton() {
  return (
    <div style={{ maxWidth: 430, margin: '0 auto', background: 'var(--bg-page)', minHeight: '100dvh', direction: 'rtl' }}>
      <div style={{ height: 280, background: 'var(--skeleton)' }} />
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Skel h={24} w="60%" />
        <Skel h={16} w="40%" />
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <Skel h={36} w={80} r={20} />
          <Skel h={36} w={80} r={20} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, padding: '0 20px' }}>
        {[0,1,2,3,4,5].map(i => <Skel key={i} h={120} r={4} />)}
      </div>
    </div>
  )
}

export default function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const t = useTranslation()
  const supabase = useMemo(() => createClient(), [])

  const [artist, setArtist] = useState<ArtistData | null>(null)
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [bioExpanded, setBioExpanded] = useState(false)
  const [activeService, setActiveService] = useState<Service | null>(null)
  const [showServicesDropdown, setShowServicesDropdown] = useState(false)
  const [serviceNote, setServiceNote] = useState('')
  const [lightboxImg, setLightboxImg] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [{ data: profileData }, { data: portfolioData }, { data: servicesData }] =
          await Promise.all([
            supabase.from('artist_profiles').select('id, user_id, bio, categories, years_experience, rating_avg, orders_count, response_time, status, city').eq('id', id).single(),
            supabase.from('portfolio_items').select('id, image_url, title, category').eq('artist_id', id).order('sort_order', { ascending: true }).limit(9),
            supabase.from('services').select('id, name, size_label, dimensions, delivery_days, base_price, currency').eq('artist_id', id).eq('is_active', true),
          ])
        const userId = profileData?.user_id
        const { data: userData } = userId
          ? await supabase.from('users').select('name, avatar_url').eq('id', userId).single()
          : { data: null }
        if (profileData) {
          setArtist({ ...profileData, users: userData ?? { name: 'فنان', avatar_url: null } } as ArtistData)
        }
        setPortfolio(portfolioData ?? [])
        setServices(servicesData ?? [])
      } catch {
        toast.error('تعذّر تحميل الملف الشخصي')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [supabase, id])

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: artist?.users?.name ?? 'حِرفة فنان', url: window.location.href })
    } else {
      navigator.clipboard?.writeText(window.location.href)
      toast.success('تم نسخ الرابط')
    }
  }

  if (loading) return <PageSkeleton />
  if (!artist) {
    return (
      <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100dvh', background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'rtl', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 40 }}>😔</p>
        <p style={{ color: 'var(--ink-secondary)', fontSize: 15, fontWeight: 600 }}>{t('artist.notfound')}</p>
        <button onClick={() => router.back()} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          {t('artist.goback')}
        </button>
      </div>
    )
  }

  const name = artist.users?.name ?? 'فنان'
  const avatarUrl = artist.users?.avatar_url ?? null
  const heroImage = avatarUrl || CATEGORY_IMAGES[artist.categories?.[0]] || null
  const bioLong = (artist.bio?.length ?? 0) > 150
  const bioText = bioLong && !bioExpanded ? (artist.bio?.slice(0, 150) + '...') : (artist.bio ?? '')

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', background: 'var(--bg-page)', minHeight: '100dvh', direction: 'rtl', paddingBottom: 100 }}>

      {/* ── Hero Image ── */}
      <div style={{ position: 'relative', height: 300, background: 'var(--img-placeholder)', overflow: 'hidden' }}>
        {heroImage && (
          <img src={heroImage} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%, rgba(0,0,0,0.6) 100%)' }} />

        {/* Header buttons */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '48px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={handleShare} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Share2 size={18} />
          </button>
          <button onClick={() => router.back()} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <ArrowRight size={20} />
          </button>
        </div>

        {/* Artist info overlay */}
        <div style={{ position: 'absolute', bottom: 0, right: 0, left: 0, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>{name}</h1>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#1D9BF0"/>
              <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>{artist.categories.join(' · ')}</span>
            {artist.city && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'rgba(255,255,255,0.8)' }}>
                <MapPin size={12} />
                <span style={{ fontSize: 13 }}>{artist.city}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Stats ── */}
      <div style={{ background: 'var(--bg-surface)', display: 'flex', borderBottom: '1px solid var(--border)' }}>
        {[
          { icon: '⭐', value: artist.rating_avg.toFixed(1), label: t('artist.rating') },
          { icon: '📦', value: artist.orders_count.toString(), label: t('artist.completed') },
          { icon: '🗓', value: `${artist.years_experience} ${t('artist.years')}`, label: t('artist.experience') },
        ].map((stat, i) => (
          <div key={i} style={{ flex: 1, padding: '14px 8px', textAlign: 'center', borderLeft: i < 2 ? '1px solid var(--border)' : 'none' }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-primary)', margin: '0 0 2px' }}>
              {stat.icon} {stat.value}
            </p>
            <p style={{ fontSize: 11, color: 'var(--ink-muted)', margin: 0 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Response time ── */}
      {artist.response_time && (
        <div style={{ background: 'var(--bg-surface)', padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'var(--ink-secondary)' }}>{t('artist.response')} {artist.response_time}</span>
        </div>
      )}

      {/* ── Bio ── */}
      {artist.bio && (
        <div style={{ background: 'var(--bg-surface)', padding: '20px', margin: '8px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-primary)', margin: '0 0 10px' }}>{t('artist.about')}</h2>
          <p style={{ fontSize: 14, color: 'var(--ink-secondary)', lineHeight: 1.8, margin: 0 }}>{bioText}</p>
          {bioLong && (
            <button onClick={() => setBioExpanded(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 13, fontWeight: 600, marginTop: 8, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
              {bioExpanded
                ? <><ChevronUp size={14} /> {t('artist.showless')}</>
                : <><ChevronDown size={14} /> {t('artist.showmore')}</>
              }
            </button>
          )}
        </div>
      )}

      {/* ── Portfolio ── */}
      {portfolio.length > 0 && (
        <div style={{ background: 'var(--bg-surface)', margin: '8px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '20px 20px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-primary)', margin: 0 }}>{t('artist.works')}</h2>
            <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{portfolio.length} {t('artist.workscount')}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3 }}>
            {portfolio.map((item, i) => (
              <div
                key={item.id}
                onClick={() => setLightboxImg(item.image_url)}
                style={{ aspectRatio: '1 / 1', background: 'var(--img-placeholder)', overflow: 'hidden', borderRadius: i === 0 ? '8px 0 0 0' : i === 2 ? '0 8px 0 0' : i === portfolio.length - 1 || i === portfolio.length - 2 ? '0 0 8px 8px' : 4, cursor: 'pointer', position: 'relative' }}
              >
                <img src={item.image_url} alt={item.title ?? t('artist.works')} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.2s' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Services ── */}
      {services.length > 0 && (
        <div style={{ background: 'var(--bg-surface)', margin: '8px 0 0', borderTop: '1px solid var(--border)', padding: '20px 20px 0' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-primary)', margin: '0 0 12px' }}>{t('artist.services')}</h2>

          <div style={{ position: 'relative', marginBottom: 12 }}>
            <button
              onClick={() => setShowServicesDropdown(!showServicesDropdown)}
              style={{ width: '100%', background: 'var(--bg-page)', border: '1.5px solid ' + (activeService ? 'var(--accent)' : 'var(--border)'), borderRadius: 'var(--radius-md)', padding: '13px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', direction: 'rtl', transition: 'border-color 0.15s' }}
            >
              <span style={{ fontSize: 14, color: activeService ? 'var(--ink-primary)' : 'var(--ink-muted)', fontWeight: activeService ? 600 : 400 }}>
                {activeService ? activeService.name : t('artist.selectsvc')}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {activeService && <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{activeService.base_price.toLocaleString('en-US')} {activeService.currency}</span>}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-muted)" strokeWidth="2.5" strokeLinecap="round" style={{ transform: showServicesDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </button>

            {showServicesDropdown && (
              <>
                <div onClick={() => setShowServicesDropdown(false)} style={{ position: 'fixed', inset: 0, zIndex: 49 }} />
                <div style={{ position: 'absolute', top: '100%', marginTop: 4, right: 0, left: 0, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', zIndex: 50, maxHeight: 280, overflowY: 'auto', direction: 'rtl' }}>
                  {services.map((service, i) => (
                    <button key={service.id} onClick={() => { setActiveService(service); setShowServicesDropdown(false) }} style={{ width: '100%', padding: '12px 16px', background: activeService?.id === service.id ? 'var(--accent-light)' : 'none', border: 'none', borderBottom: i < services.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', direction: 'rtl', textAlign: 'right' }}>
                      <span style={{ fontSize: 14, color: activeService?.id === service.id ? 'var(--accent)' : 'var(--ink-primary)', fontWeight: activeService?.id === service.id ? 600 : 400 }}>{service.name}</span>
                      <span style={{ fontSize: 13, color: 'var(--ink-muted)', flexShrink: 0, marginRight: 12 }}>{service.base_price.toLocaleString('en-US')} {service.currency}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {activeService && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Clock size={13} color="var(--ink-muted)" />
              <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{t('artist.delivery')} {activeService.delivery_days} {t('artist.days')}</span>
            </div>
          )}

          <div style={{ marginBottom: 100 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)', marginBottom: 8 }}>
              {t('artist.notes')} <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 400 }}>{t('artist.optional')}</span>
            </label>
            <textarea value={serviceNote} onChange={(e) => setServiceNote(e.target.value)} placeholder={t('artist.notesph')} rows={3} style={{ width: '100%', background: 'var(--bg-page)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', fontSize: 14, color: 'var(--ink-primary)', resize: 'none', outline: 'none', direction: 'rtl', lineHeight: 1.6, boxSizing: 'border-box', fontFamily: 'Cairo, sans-serif', transition: 'border-color 0.15s' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
        </div>
      )}

      {/* ── Fixed CTA ── */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', padding: '12px 20px 28px', zIndex: 20 }}>
        <button
          onClick={() => { if (!activeService) return; router.push(`/client/order/new?artistId=${artist?.id}&serviceId=${activeService.id}&note=${encodeURIComponent(serviceNote)}`) }}
          disabled={!activeService}
          style={{ width: '100%', background: activeService ? 'var(--accent)' : 'var(--border)', color: activeService ? '#FFFFFF' : 'var(--ink-muted)', border: 'none', borderRadius: 'var(--radius-lg)', padding: '15px', fontSize: 15, fontWeight: 700, cursor: activeService ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.15s', boxShadow: activeService ? '0 4px 16px rgba(192,57,43,0.25)' : 'none' }}
          onMouseDown={(e) => { if (activeService) e.currentTarget.style.transform = 'scale(0.98)' }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          {activeService ? (
            <>
              <span>{t('artist.ordernow')}</span>
              <span style={{ opacity: 0.8, fontWeight: 400, fontSize: 14 }}>·</span>
              <span>{activeService.base_price.toLocaleString('en-US')} {activeService.currency}</span>
            </>
          ) : t('artist.selectfirst')}
        </button>
      </div>

      {/* ── Lightbox ── */}
      {lightboxImg && (
        <div onClick={() => setLightboxImg(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={() => setLightboxImg(null)} style={{ position: 'absolute', top: 48, left: 16, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
            <X size={20} />
          </button>
          <img src={lightboxImg} alt={t('artist.works')} style={{ maxWidth: '95vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 8 }} />
        </div>
      )}
    </div>
  )
}
