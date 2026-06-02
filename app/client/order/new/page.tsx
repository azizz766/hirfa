'use client'

import { Suspense, useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, Paperclip, X, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Skel } from '@/components/ui/Skel'
import { toast } from '@/components/ui/Toast'
import { useTranslation } from '@/lib/theme'

type Artist = {
  id: string
  categories: string[]
  rating_avg: number
  city: string | null
  userName: string
  userAvatar: string | null
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

export default function NewOrderPage() {
  return (
    <Suspense fallback={<div style={{ maxWidth: 430, margin: '0 auto', background: 'var(--bg-page)', minHeight: '100dvh' }} />}>
      <NewOrderContent />
    </Suspense>
  )
}

function NewOrderContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const artistId = searchParams.get('artistId') ?? ''
  const serviceId = searchParams.get('serviceId') ?? ''
  const noteParam = searchParams.get('note') ?? ''
  const t = useTranslation()
  const supabase = useMemo(() => createClient(), [])

  const [artist, setArtist] = useState<Artist | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [activeService, setActiveService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [description, setDescription] = useState(noteParam)
  const [deliveryDate, setDeliveryDate] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [showServiceSheet, setShowServiceSheet] = useState(false)

  useEffect(() => {
    async function load() {
      if (!artistId) { setLoading(false); return }
      try {
        const [{ data: profile }, { data: servicesData }] = await Promise.all([
          supabase.from('artist_profiles').select('id, categories, rating_avg, city, user_id').eq('id', artistId).single(),
          supabase.from('services').select('*').eq('artist_id', artistId).eq('is_active', true),
        ])
        const { data: user } = profile?.user_id
          ? await supabase.from('users').select('name, avatar_url').eq('id', profile.user_id).single()
          : { data: null }
        if (profile) {
          setArtist({ id: profile.id, categories: profile.categories ?? [], rating_avg: profile.rating_avg ?? 0, city: profile.city, userName: user?.name ?? 'فنان', userAvatar: user?.avatar_url ?? null })
        }
        const svcList = servicesData ?? []
        setServices(svcList)
        if (serviceId) {
          const match = svcList.find(s => s.id === serviceId)
          if (match) setActiveService(match)
        }
      } catch {
        toast.error(t('ordernew.errload'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [supabase, artistId, serviceId])

  async function handleSubmit() {
    if (!activeService) { toast.error(t('ordernew.errsvc')); return }
    if (!description.trim()) { toast.error(t('ordernew.errdesc')); return }
    if (!deliveryDate) { toast.error(t('ordernew.errdate')); return }
    setSubmitting(true)
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('Order submit — user:', user?.id, 'auth error:', authError)
      if (!user) { router.push('/auth/client'); return }

      await supabase.from('users').upsert({
        id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'عميل',
        role: 'client',
      }, { onConflict: 'id', ignoreDuplicates: true })

      const { data: order, error } = await supabase.from('orders').insert({
        client_id: user.id,
        artist_id: artistId,
        service_id: activeService.id,
        description: description.trim(),
        desired_delivery: deliveryDate,
        status: 'pending',
        currency: activeService.currency,
      }).select('id').single()
      if (error) throw error
      toast.success(t('ordernew.success'))
      router.replace(`/client/order/${order.id}`)
    } catch (err: unknown) {
      console.error('Order submit error:', err)
      const msg = err instanceof Error ? err.message : JSON.stringify(err)
      toast.error(msg || t('ordernew.errsubmit'))
    } finally {
      setSubmitting(false)
    }
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', background: 'var(--bg-page)', minHeight: '100dvh', direction: 'rtl', paddingBottom: 100 }}>

      {/* Top bar */}
      <div style={{ height: 4, background: 'var(--accent)' }} />

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-primary)', display: 'flex', alignItems: 'center', padding: 4 }}>
          <ArrowRight size={22} />
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-primary)' }}>{t('ordernew.title')}</span>
        <div style={{ width: 30 }} />
      </div>

      <div style={{ padding: '20px 16px' }}>

        {/* Artist card */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, boxShadow: 'var(--shadow-sm)' }}>
          {loading ? (
            <>
              <Skel w={52} h={52} r={26} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Skel h={15} w="60%" />
                <Skel h={12} w="40%" />
              </div>
            </>
          ) : artist ? (
            <>
              <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', background: 'var(--avatar-bg)', border: '2px solid var(--avatar-border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {artist.userAvatar ? (
                  <img src={artist.userAvatar} alt={artist.userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>{artist.userName.charAt(0)}</span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-primary)', margin: 0 }}>{artist.userName}</p>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#1D9BF0"/>
                    <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p style={{ fontSize: 12, color: 'var(--ink-secondary)', margin: '3px 0 0' }}>
                  {artist.categories[0]} {artist.city ? `· ${artist.city}` : ''} · ⭐ {artist.rating_avg.toFixed(1)}
                </p>
              </div>
            </>
          ) : (
            <p style={{ fontSize: 14, color: 'var(--ink-muted)', margin: 0 }}>{t('artist.notfound')}</p>
          )}
        </div>

        {/* Service selector */}
        {services.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)', marginBottom: 8, textAlign: 'right' }}>
              {t('ordernew.service')} <span style={{ color: 'var(--accent)' }}>*</span>
            </label>
            {!activeService ? (
              <button onClick={() => setShowServiceSheet(true)} style={{ width: '100%', background: 'var(--bg-surface)', border: '1.5px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', fontSize: 14, color: 'var(--ink-muted)', cursor: 'pointer', textAlign: 'center', fontFamily: 'Cairo, sans-serif' }}>
                {t('artist.selectsvc')}
              </button>
            ) : (
              <div style={{ background: 'var(--bg-surface)', border: '1.5px solid var(--accent)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <button onClick={() => setShowServiceSheet(true)} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
                    {t('general.edit')}
                  </button>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-primary)' }}>{activeService.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{activeService.delivery_days} {t('artist.days')}</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>{activeService.base_price} SAR</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: description.length > 450 ? 'var(--accent)' : 'var(--ink-muted)' }}>
              {description.length}/500
            </span>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)' }}>
              {t('ordernew.desc')} <span style={{ color: 'var(--accent)' }}>*</span>
            </label>
          </div>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value.slice(0, 500))}
            placeholder={t('ordernew.descph')}
            rows={5}
            style={{ width: '100%', background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '13px 14px', fontSize: 14, color: 'var(--ink-primary)', lineHeight: 1.7, resize: 'none', outline: 'none', boxSizing: 'border-box', direction: 'rtl', fontFamily: 'Cairo, sans-serif', transition: 'border-color 0.15s' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        {/* Attachments */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{t('ordernew.attachhint')}</span>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)' }}>{t('ordernew.attachlabel')}</label>
          </div>
          <input type="file" id="file-upload" accept="image/*" multiple style={{ display: 'none' }} onChange={e => {
            const files = Array.from(e.target.files ?? []).slice(0, 5 - attachments.length)
            setAttachments(prev => [...prev, ...files].slice(0, 5))
          }} />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {attachments.map((file, i) => (
              <div key={i} style={{ position: 'relative', width: 72, height: 72, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-page)', flexShrink: 0 }}>
                <img src={URL.createObjectURL(file)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))} style={{ position: 'absolute', top: 2, left: 2, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <X size={11} />
                </button>
              </div>
            ))}
            {attachments.length < 5 && (
              <label htmlFor="file-upload" style={{ width: 72, height: 72, borderRadius: 'var(--radius-md)', border: '1.5px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--bg-surface)', gap: 4, flexShrink: 0 }}>
                <Paperclip size={18} color="var(--ink-muted)" />
                <span style={{ fontSize: 9, color: 'var(--ink-muted)' }}>{t('ordernew.addfile')}</span>
              </label>
            )}
          </div>
        </div>

        {/* Delivery date */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)', marginBottom: 10 }}>
            {t('ordernew.datelabel')} <span style={{ color: 'var(--accent)' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input type="date" value={deliveryDate} min={minDate} onChange={e => setDeliveryDate(e.target.value)} style={{ width: '100%', background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '13px 14px', fontSize: 14, color: deliveryDate ? 'var(--ink-primary)' : 'var(--ink-muted)', outline: 'none', boxSizing: 'border-box', direction: 'ltr', textAlign: 'right', cursor: 'pointer', transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <Calendar size={16} color="var(--ink-muted)" style={{ position: 'absolute', top: '50%', right: 14, transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>
        </div>

        {/* Info note */}
        <div style={{ background: 'var(--info-bg)', border: '1px solid', borderColor: 'var(--info-bg)', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 4 }}>
          <p style={{ fontSize: 12, color: 'var(--info)', margin: 0, lineHeight: 1.6 }}>
            💡 {t('ordernew.info')}
          </p>
        </div>
      </div>

      {/* Service bottom sheet */}
      {showServiceSheet && (
        <>
          <div onClick={() => setShowServiceSheet(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 30 }} />
          <div className="hirfa-slideup" style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: 'var(--bg-surface)', borderRadius: '20px 20px 0 0', zIndex: 31, direction: 'rtl', maxHeight: '70vh', overflowY: 'auto', paddingBottom: 32 }}>
            <div style={{ padding: '16px 20px 12px', position: 'sticky', top: 0, background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 auto 12px' }} />
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-primary)', margin: 0, textAlign: 'right' }}>{t('artist.services')}</p>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {services.map(svc => (
                <button key={svc.id} onClick={() => { setActiveService(svc); setShowServiceSheet(false) }}
                  style={{ background: activeService?.id === svc.id ? 'var(--accent-light)' : 'var(--bg-page)', border: activeService?.id === svc.id ? '1.5px solid var(--accent)' : '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', cursor: 'pointer', textAlign: 'right', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Cairo, sans-serif' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>{svc.base_price} SAR</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-primary)' }}>{svc.name}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Fixed footer */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', padding: '12px 16px 28px', zIndex: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{t('ordernew.pricehint')}</span>
          {activeService && (
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>
              {t('ordernew.startingfrom')} {activeService.base_price.toLocaleString('en-US')} {activeService.currency}
            </span>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting || !activeService}
          style={{ width: '100%', background: submitting || !activeService ? 'var(--border)' : 'var(--accent)', color: submitting || !activeService ? 'var(--ink-muted)' : '#fff', border: 'none', borderRadius: 'var(--radius-lg)', padding: '15px', fontSize: 15, fontWeight: 700, cursor: submitting || !activeService ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.15s', boxShadow: !submitting && activeService ? '0 4px 16px rgba(192,57,43,0.25)' : 'none' }}
          onMouseDown={e => { if (!submitting && activeService) e.currentTarget.style.transform = 'scale(0.98)' }}
          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          {submitting ? (
            <>
              <div className="hirfa-spin" style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%' }} />
              {t('ordernew.submitting')}
            </>
          ) : (
            t('ordernew.submit')
          )}
        </button>
      </div>
    </div>
  )
}
