'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Skel } from '@/components/ui/Skel'
import { ArtistNav } from '@/components/nav/ArtistNav'
import { toast } from '@/components/ui/Toast'
import { useTranslation } from '@/lib/theme'

// ─── Types ────────────────────────────────────────────────────

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

// ─── Offer Sheet ──────────────────────────────────────────────

function OfferSheet({
  brief,
  onClose,
  onSubmit,
}: {
  brief: Brief
  onClose: () => void
  onSubmit: (briefId: string, price: number, note: string) => Promise<void>
}) {
  const t = useTranslation()
  const [price, setPrice] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    const p = parseFloat(price)
    if (!p || p <= 0) { toast.error(t('briefs.errprice')); return }
    setSaving(true)
    await onSubmit(brief.id, p, note)
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

// ─── Page ─────────────────────────────────────────────────────

export default function ArtistBriefsPage() {
  const t = useTranslation()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [briefs, setBriefs] = useState<Brief[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null)
  const [myOffers, setMyOffers] = useState<Set<string>>(new Set())
  const [artistProfileId, setArtistProfileId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: profile } = await supabase
        .from('artist_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (profile) setArtistProfileId(profile.id as string)

      const [{ data: briefsData }, { data: offersData }] = await Promise.all([
        supabase
          .from('open_briefs')
          .select('id, title, description, category, budget_min, budget_max, currency, deadline, status, offers_count, created_at')
          .eq('status', 'open')
          .order('created_at', { ascending: false }),
        profile
          ? supabase.from('brief_offers').select('brief_id').eq('artist_id', profile.id as string)
          : Promise.resolve({ data: [] }),
      ])

      setBriefs((briefsData ?? []) as Brief[])
      setMyOffers(new Set((offersData ?? []).map((o) => o.brief_id as string)))
      setLoading(false)
    }
    load()
  }, [supabase])

  async function handleSubmitOffer(briefId: string, price: number, note: string) {
    if (!artistProfileId) { toast.error(t('briefs.errprofile')); return }

    const { error } = await supabase.from('brief_offers').insert({
      brief_id: briefId,
      artist_id: artistProfileId,
      offered_price: price,
      delivery_days: 7,
      message: note.trim() || null,
      status: 'pending',
    })

    if (error) { toast.error(error.message); return }

    setMyOffers((prev) => new Set([...prev, briefId]))
    setBriefs((prev) => prev.map((b) => b.id === briefId ? { ...b, offers_count: b.offers_count + 1 } : b))
    setSelectedBrief(null)
  }

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', background: 'var(--bg-page)', minHeight: '100dvh', direction: 'rtl', paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-primary)' }}>{t('briefs.title')}</span>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          [0,1,2,3].map((i) => (
            <div key={i} style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Skel w="70%" h={15} />
              <Skel w="90%" h={12} />
              <Skel w="50%" h={12} />
            </div>
          ))
        ) : briefs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '72px 0', color: 'var(--ink-muted)' }}>
            <FileText size={44} color="var(--border)" style={{ margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontSize: 14, margin: 0 }}>{t('briefs.empty')}</p>
          </div>
        ) : (
          briefs.map((brief) => {
            const offered = myOffers.has(brief.id)
            return (
              <div key={brief.id} onClick={() => router.push(`/client/briefs/${brief.id}`)} style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '14px 16px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, gap: 8 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                    {brief.category && (
                      <span style={{ fontSize: 11, background: 'var(--bg-page)', color: 'var(--ink-secondary)', borderRadius: 'var(--radius-sm)', padding: '2px 8px', border: '1px solid var(--border)', alignSelf: 'flex-end' }}>
                        {brief.category}
                      </span>
                    )}
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-primary)', margin: 0 }}>{brief.title}</p>
                  </div>
                </div>

                {brief.description && (
                  <p style={{ fontSize: 13, color: 'var(--ink-secondary)', margin: '0 0 10px', lineHeight: 1.55 }}>
                    {brief.description.length > 100 ? brief.description.slice(0, 100) + '...' : brief.description}
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {brief.budget_min != null && (
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)' }}>
                        {brief.budget_min}–{brief.budget_max} {brief.currency}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{brief.offers_count} {t('briefs.offercount')}</span>
                    {brief.deadline && (
                      <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
                        {t('briefs.until')} {new Date(brief.deadline).toLocaleDateString('ar-SA')}
                      </span>
                    )}
                  </div>

                  {offered ? (
                    <span style={{ fontSize: 12, color: 'var(--success)', background: 'var(--success-bg)', borderRadius: 8, padding: '5px 12px', fontWeight: 600 }}>
                      {t('briefs.applied')}
                    </span>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedBrief(brief) }}
                      style={{ fontSize: 12, color: '#FFFFFF', background: 'var(--accent)', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      {t('briefs.apply')} <ChevronLeft size={13} />
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {selectedBrief && (
        <OfferSheet
          brief={selectedBrief}
          onClose={() => setSelectedBrief(null)}
          onSubmit={handleSubmitOffer}
        />
      )}

      <ArtistNav />
    </div>
  )
}
