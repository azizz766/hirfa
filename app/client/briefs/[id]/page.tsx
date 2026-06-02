'use client'

import { useState, useEffect, useMemo, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Calendar, Tag, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Skel } from '@/components/ui/Skel'
import { toast } from '@/components/ui/Toast'
import { useTranslation, useAppSettings } from '@/lib/theme'

type Brief = {
  id: string
  title: string
  description: string
  category: string | null
  budget_min: number | null
  budget_max: number | null
  currency: string
  deadline: string | null
  status: string
  offers_count: number
  created_at: string
}

function OfferSheet({
  brief,
  onClose,
  onSubmit,
}: {
  brief: Brief
  onClose: () => void
  onSubmit: (price: number, note: string) => Promise<void>
}) {
  const t = useTranslation()
  const [price, setPrice] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    const p = parseFloat(price)
    if (!p || p <= 0) { toast.error(t('briefs.errprice')); return }
    setSaving(true)
    await onSubmit(p, note)
    setSaving(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '11px 14px',
    fontSize: 14,
    color: 'var(--ink-primary)',
    outline: 'none',
    boxSizing: 'border-box',
    direction: 'rtl',
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 30 }} />
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: 'var(--bg-surface)', borderRadius: '20px 20px 0 0', padding: '20px 20px 36px', zIndex: 31, direction: 'rtl' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-primary)', margin: '0 0 6px', textAlign: 'center' }}>{t('briefs.offertitle')}</h3>
        <p style={{ fontSize: 13, color: 'var(--ink-secondary)', textAlign: 'center', margin: '0 0 20px' }}>{brief.title}</p>

        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)', marginBottom: 6 }}>
          {t('briefs.yourprice')} <span style={{ color: 'var(--accent)' }}>*</span>
          {brief.budget_min != null && (
            <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--ink-muted)', marginRight: 6 }}>
              ({t('briefs.budget')}: {brief.budget_min}–{brief.budget_max} {brief.currency})
            </span>
          )}
        </label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0"
          style={{ ...inputStyle, direction: 'ltr', textAlign: 'left', marginBottom: 14 }}
        />

        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)', marginBottom: 6 }}>{t('briefs.notelabel')}</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder={t('briefs.noteph')}
          style={{ ...inputStyle, resize: 'none', marginBottom: 20 }}
        />

        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{ width: '100%', background: saving ? 'var(--border)' : 'var(--accent)', color: saving ? 'var(--ink-muted)' : '#FFFFFF', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}
        >
          {saving ? t('briefs.sending') : t('briefs.send')}
        </button>
      </div>
    </>
  )
}

export default function BriefDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const t = useTranslation()
  const { lang } = useAppSettings()
  const isAr = lang !== 'en'

  const [brief, setBrief] = useState<Brief | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<string | null>(null)
  const [artistProfileId, setArtistProfileId] = useState<string | null>(null)
  const [alreadyOffered, setAlreadyOffered] = useState(false)
  const [showOfferSheet, setShowOfferSheet] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: briefData }, { data: { user } }] = await Promise.all([
        supabase.from('open_briefs').select('*').eq('id', id).single(),
        supabase.auth.getUser(),
      ])

      setBrief(briefData as Brief | null)

      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        setRole(userData?.role ?? null)

        if (userData?.role === 'artist') {
          const { data: profile } = await supabase
            .from('artist_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single()

          if (profile) {
            setArtistProfileId(profile.id as string)
            const { data: offer } = await supabase
              .from('brief_offers')
              .select('id')
              .eq('brief_id', id)
              .eq('artist_id', profile.id as string)
              .maybeSingle()
            setAlreadyOffered(!!offer)
          }
        }
      }

      setLoading(false)
    }

    load()
  }, [supabase, id])

  async function handleSubmitOffer(price: number, note: string) {
    if (!artistProfileId) { toast.error(t('briefs.errprofile')); return }

    const { error } = await supabase.from('brief_offers').insert({
      brief_id: id,
      artist_id: artistProfileId,
      offered_price: price,
      delivery_days: 7,
      message: note.trim() || null,
      status: 'pending',
    })

    if (error) { toast.error(error.message); return }

    setAlreadyOffered(true)
    setBrief(prev => prev ? { ...prev, offers_count: prev.offers_count + 1 } : prev)
    setShowOfferSheet(false)
  }

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', background: 'var(--bg-page)', minHeight: '100dvh', direction: isAr ? 'rtl' : 'ltr', paddingBottom: 48 }}>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-primary)', display: 'flex', alignItems: 'center', padding: 4 }}>
          <ArrowRight size={22} />
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-primary)' }}>
          {t('briefs.detailtitle')}
        </span>
        <div style={{ width: 30 }} />
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {loading ? (
          <>
            <Skel h={24} w="80%" />
            <Skel h={100} />
            <Skel h={16} w="50%" />
          </>
        ) : !brief ? (
          <div style={{ textAlign: 'center', padding: '64px 16px', color: 'var(--ink-muted)' }}>
            <p style={{ fontSize: 15 }}>{t('briefs.notfound')}</p>
          </div>
        ) : (
          <>
            {/* Title + Category */}
            <div>
              {brief.category && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Tag size={13} color="var(--ink-muted)" />
                  <span style={{ fontSize: 12, color: 'var(--ink-secondary)', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', padding: '2px 8px' }}>
                    {brief.category}
                  </span>
                </div>
              )}
              <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink-primary)', margin: 0 }}>{brief.title}</h1>
            </div>

            {/* Description */}
            {brief.description && (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
                <p style={{ fontSize: 14, color: 'var(--ink-secondary)', margin: 0, lineHeight: 1.75 }}>{brief.description}</p>
              </div>
            )}

            {/* Meta */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {brief.budget_min != null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>{brief.budget_min}–{brief.budget_max} {brief.currency}</span>
                  <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{t('briefs.budget')}</span>
                </div>
              )}

              {brief.deadline && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={14} color="var(--ink-muted)" />
                    <span style={{ fontSize: 14, color: 'var(--ink-primary)' }}>
                      {new Date(brief.deadline).toLocaleDateString(isAr ? 'ar-SA' : 'en-GB')}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{t('newbrief.deadline')}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={14} color="var(--ink-muted)" />
                  <span style={{ fontSize: 14, color: 'var(--ink-primary)' }}>{brief.offers_count}</span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{t('briefs.offerscount')}</span>
              </div>
            </div>

            {/* CTA — only for artists */}
            {role === 'artist' && (
              <div style={{ marginTop: 8 }}>
                {alreadyOffered ? (
                  <div style={{ textAlign: 'center', padding: '14px', background: 'var(--success-bg)', border: '1px solid var(--success)', borderRadius: 'var(--radius-lg)', fontSize: 14, fontWeight: 600, color: 'var(--success)' }}>
                    {t('briefs.applied')}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowOfferSheet(true)}
                    style={{ width: '100%', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-lg)', padding: '14px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
                  >
                    {t('briefs.apply')}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {showOfferSheet && brief && (
        <OfferSheet
          brief={brief}
          onClose={() => setShowOfferSheet(false)}
          onSubmit={handleSubmitOffer}
        />
      )}
    </div>
  )
}
