'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Plus, X, Check, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ArtistNav } from '@/components/nav/ArtistNav'
import { Skel } from '@/components/ui/Skel'
import { toast } from '@/components/ui/Toast'
import { useTranslation } from '@/lib/theme'

type PortfolioItem = {
  id: string
  image_url: string
  title: string | null
  category: string | null
}

export default function ArtistPortfolioPage() {
  const t = useTranslation()
  const supabase = useMemo(() => createClient(), [])
  const fileRef = useRef<HTMLInputElement>(null)

  const [items, setItems] = useState<PortfolioItem[]>([])
  const [artistId, setArtistId] = useState('')
  const [loading, setLoading] = useState(true)
  const [showSheet, setShowSheet] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }
        const { data: profile } = await supabase.from('artist_profiles').select('id').eq('user_id', user.id).single()
        if (!profile) { setLoading(false); return }
        setArtistId(profile.id as string)
        const { data } = await supabase.from('portfolio_items')
          .select('id, image_url, title, category')
          .eq('artist_id', profile.id as string)
          .order('sort_order', { ascending: true })
        setItems((data ?? []) as PortfolioItem[])
      } catch { toast.error(t('portfolio.errload')) }
      finally { setLoading(false) }
    }
    load()
  }, [supabase, t])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setShowSheet(true)
  }

  async function handleAdd() {
    if (!selectedFile || !artistId) return
    setSaving(true)
    try {
      const ext = selectedFile.name.split('.').pop()
      const path = `${artistId}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('portfolio').upload(path, selectedFile, { upsert: true })
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from('portfolio').getPublicUrl(path)
      const { data: item, error: dbErr } = await supabase.from('portfolio_items').insert({
        artist_id: artistId,
        image_url: urlData.publicUrl,
        title: title.trim() || null,
        sort_order: items.length,
      }).select('id, image_url, title, category').single()
      if (dbErr) throw dbErr
      setItems(prev => [...prev, item as PortfolioItem])
      toast.success(t('portfolio.added'))
      setShowSheet(false); setTitle(''); setPreviewUrl(null); setSelectedFile(null)
    } catch { toast.error(t('portfolio.errupload')) }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    try {
      await supabase.from('portfolio_items').delete().eq('id', id)
      setItems(prev => prev.filter(i => i.id !== id))
      toast.success(t('portfolio.deleted'))
    } catch { toast.error(t('portfolio.errdelete')) }
    finally { setDeleteId(null) }
  }

  function closeSheet() {
    setShowSheet(false); setPreviewUrl(null); setSelectedFile(null); setTitle('')
  }

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', background: 'var(--bg-page)', minHeight: '100dvh', direction: 'rtl', paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
        <button
          onClick={() => fileRef.current?.click()}
          style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(192,57,43,0.2)' }}
        >
          <Plus size={15} /> {t('portfolio.add')}
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-primary)' }}>{t('portfolio.title')}</span>
        <div style={{ width: 72 }} />
      </div>

      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelect} />

      {/* Count */}
      {!loading && (
        <div style={{ padding: '12px 16px 4px', display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{items.length} {t('portfolio.count')}</span>
        </div>
      )}

      {/* Grid */}
      <div style={{ padding: '8px 16px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3 }}>
            {[0,1,2,3,4,5].map(i => <Skel key={i} h={120} r={4} />)}
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginTop: 8 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--img-placeholder)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <ImageIcon size={28} color="var(--ink-muted)" />
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-primary)', margin: '0 0 6px' }}>{t('portfolio.empty')}</p>
            <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: '0 0 20px' }}>{t('portfolio.emptyhint')}</p>
            <button onClick={() => fileRef.current?.click()} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {t('portfolio.addfirst')}
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3 }}>
            {items.map((item, idx) => (
              <div key={item.id} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: idx === 0 ? '8px 0 0 0' : idx === 2 ? '0 8px 0 0' : 4, overflow: 'hidden', background: 'var(--img-placeholder)', cursor: 'pointer' }}
                onClick={() => setLightboxUrl(item.image_url)}
              >
                <img src={item.image_url} alt={item.title ?? t('portfolio.title')} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <button
                  onClick={e => { e.stopPropagation(); setDeleteId(item.id) }}
                  style={{ position: 'absolute', top: 4, left: 4, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Sheet */}
      {showSheet && (
        <>
          <div onClick={closeSheet} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 30 }} />
          <div className="hirfa-slideup" style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: 'var(--bg-surface)', borderRadius: '20px 20px 0 0', zIndex: 31, direction: 'rtl' }}>
            <div style={{ padding: '16px 20px 12px' }}>
              <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 auto 16px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={closeSheet} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', display: 'flex', padding: 4 }}>
                  <X size={20} />
                </button>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-primary)', margin: 0 }}>{t('portfolio.addtitle')}</h3>
                <div style={{ width: 28 }} />
              </div>
            </div>

            <div style={{ padding: '0 20px 32px' }}>
              {previewUrl && (
                <div style={{ width: '100%', height: 200, borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--img-placeholder)', marginBottom: 16 }}>
                  <img src={previewUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)', marginBottom: 8 }}>
                {t('portfolio.worktitle')} <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 400 }}>{t('artist.optional')}</span>
              </label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('portfolio.worktitleph')}
                style={{ width: '100%', background: 'var(--bg-page)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', fontSize: 14, color: 'var(--ink-primary)', outline: 'none', boxSizing: 'border-box', direction: 'rtl', fontFamily: 'Cairo, sans-serif', marginBottom: 16, transition: 'border-color 0.15s' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />

              <button onClick={handleAdd} disabled={saving || !selectedFile}
                style={{ width: '100%', background: saving || !selectedFile ? 'var(--border)' : 'var(--accent)', color: saving || !selectedFile ? 'var(--ink-muted)' : '#fff', border: 'none', borderRadius: 'var(--radius-lg)', padding: '15px', fontSize: 15, fontWeight: 700, cursor: saving || !selectedFile ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.15s', boxShadow: !saving && selectedFile ? '0 4px 16px rgba(192,57,43,0.25)' : 'none' }}
              >
                {saving ? (
                  <><div className="hirfa-spin" style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%' }} /> {t('portfolio.saving')}</>
                ) : (
                  <><Check size={16} /> {t('portfolio.savework')}</>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <>
          <div onClick={() => setDeleteId(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 30 }} />
          <div className="hirfa-slideup" style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: 'var(--bg-surface)', borderRadius: '20px 20px 0 0', padding: '20px 20px 32px', zIndex: 31, direction: 'rtl' }}>
            <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 auto 20px' }} />
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-primary)', margin: '0 0 6px' }}>{t('portfolio.deleteq')}</p>
              <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: 0 }}>{t('portfolio.deletewarn')}</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '13px', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: 'var(--ink-primary)' }}>
                {t('general.cancel')}
              </button>
              <button onClick={() => handleDelete(deleteId)} style={{ flex: 1, background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {t('general.delete')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div onClick={() => setLightboxUrl(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={() => setLightboxUrl(null)} style={{ position: 'absolute', top: 48, left: 16, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
            <X size={20} />
          </button>
          <img src={lightboxUrl} alt={t('portfolio.title')} style={{ maxWidth: '95vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 8 }} />
        </div>
      )}

      <ArtistNav />
    </div>
  )
}
