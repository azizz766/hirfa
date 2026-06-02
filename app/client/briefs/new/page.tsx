'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toast'
import { useTranslation } from '@/lib/theme'

const CATEGORIES = ['خط عربي', 'رسم', 'فخار', 'كروشيه', 'نحت']

const CAT_KEY: Record<string, string> = {
  'خط عربي': 'cat.calligraphy',
  'رسم':     'cat.painting',
  'فخار':    'cat.pottery',
  'كروشيه':  'cat.crochet',
  'نحت':     'cat.sculpture',
}

export default function NewBriefPage() {
  const t = useTranslation()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [category, setCategory] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [deadline, setDeadline] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!category) { toast.error(t('newbrief.errcat')); return }
    if (!title.trim()) { toast.error(t('newbrief.errtitle')); return }
    if (!description.trim()) { toast.error(t('newbrief.errdesc')); return }
    setSubmitting(true)
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('Brief submit — user:', user?.id, 'auth error:', authError)
      if (!user) { router.push('/auth/client'); return }

      await supabase.from('users').upsert({
        id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'عميل',
        role: 'client',
      }, { onConflict: 'id', ignoreDuplicates: true })

      const { error } = await supabase.from('open_briefs').insert({
        client_id: user.id,
        category,
        title: title.trim(),
        description: description.trim(),
        budget_min: budgetMin ? parseFloat(budgetMin) : null,
        budget_max: budgetMax ? parseFloat(budgetMax) : null,
        deadline: deadline || null,
        status: 'open',
      })
      if (error) throw error
      toast.success(t('newbrief.success'))
      router.replace('/client/home')
    } catch (err: unknown) {
      console.error('Brief submit error:', err)
      const msg = err instanceof Error ? err.message : JSON.stringify(err)
      toast.error(msg || t('newbrief.errsubmit'))
    }
    finally { setSubmitting(false) }
  }

  const inputStyle = {
    width: '100%',
    background: 'var(--bg-page)',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 14px',
    fontSize: 14,
    color: 'var(--ink-primary)',
    outline: 'none',
    direction: 'rtl' as const,
    boxSizing: 'border-box' as const,
    fontFamily: 'Cairo, sans-serif',
    transition: 'border-color 0.15s',
  }

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', background: 'var(--bg-page)', minHeight: '100dvh', direction: 'rtl', paddingBottom: 100 }}>

      {/* Top bar */}
      <div style={{ height: 4, background: 'var(--accent)' }} />

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-primary)', display: 'flex', padding: 4 }}>
          <ArrowRight size={22} />
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-primary)' }}>{t('newbrief.title')}</span>
        <div style={{ width: 30 }} />
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Category */}
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)', marginBottom: 10 }}>
            {t('newbrief.category')} <span style={{ color: 'var(--accent)' }}>*</span>
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORIES.map(cat => {
              const active = category === cat
              return (
                <button key={cat} onClick={() => setCategory(cat)} style={{ padding: '8px 16px', borderRadius: 'var(--radius-pill)', border: active ? 'none' : '1px solid var(--border)', background: active ? 'var(--accent)' : 'var(--bg-surface)', color: active ? '#fff' : 'var(--ink-secondary)', fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s', boxShadow: active ? '0 2px 8px rgba(192,57,43,0.2)' : 'none' }}>
                  {t(CAT_KEY[cat])}
                </button>
              )
            })}
          </div>
        </div>

        {/* Title */}
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)', marginBottom: 8 }}>
            {t('newbrief.titlefield')} <span style={{ color: 'var(--accent)' }}>*</span>
          </label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('newbrief.titleph')}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        {/* Description */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: description.length > 450 ? 'var(--accent)' : 'var(--ink-muted)' }}>{description.length}/500</span>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)' }}>
              {t('newbrief.descfield')} <span style={{ color: 'var(--accent)' }}>*</span>
            </label>
          </div>
          <textarea value={description} onChange={e => setDescription(e.target.value.slice(0, 500))} placeholder={t('newbrief.descph')} rows={4}
            style={{ ...inputStyle, resize: 'none', lineHeight: 1.7 }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        {/* Budget */}
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)', marginBottom: 8 }}>
            {t('newbrief.budget')} <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 400 }}>{t('artist.optional')}</span>
          </label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="number" value={budgetMax} onChange={e => setBudgetMax(e.target.value)} placeholder={t('newbrief.budgetmax')}
              style={{ ...inputStyle, direction: 'ltr' as const }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <span style={{ color: 'var(--ink-muted)', flexShrink: 0 }}>—</span>
            <input type="number" value={budgetMin} onChange={e => setBudgetMin(e.target.value)} placeholder={t('newbrief.budgetmin')}
              style={{ ...inputStyle, direction: 'ltr' as const }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
        </div>

        {/* Deadline */}
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)', marginBottom: 8 }}>
            {t('newbrief.deadline')} <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 400 }}>{t('artist.optional')}</span>
          </label>
          <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
            style={{ ...inputStyle, direction: 'ltr' as const, color: deadline ? 'var(--ink-primary)' : 'var(--ink-muted)' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        {/* Info */}
        <div style={{ background: 'var(--info-bg)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
          <p style={{ fontSize: 12, color: 'var(--info)', margin: 0, lineHeight: 1.6 }}>
            💡 {t('newbrief.info')}
          </p>
        </div>
      </div>

      {/* Fixed footer */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', padding: '12px 16px 28px', zIndex: 20 }}>
        <button onClick={handleSubmit} disabled={submitting}
          style={{ width: '100%', background: submitting ? 'var(--border)' : 'var(--accent)', color: submitting ? 'var(--ink-muted)' : '#fff', border: 'none', borderRadius: 'var(--radius-lg)', padding: '15px', fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.15s', boxShadow: submitting ? 'none' : '0 4px 16px rgba(192,57,43,0.25)' }}
          onMouseDown={e => { if (!submitting) e.currentTarget.style.transform = 'scale(0.98)' }}
          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          {submitting ? (
            <><div className="hirfa-spin" style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%' }} /> {t('newbrief.submitting')}</>
          ) : (
            t('newbrief.submit')
          )}
        </button>
      </div>
    </div>
  )
}
