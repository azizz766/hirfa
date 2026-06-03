'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toast'
import { useTranslation } from '@/lib/theme'

export default function ClientAuthPage() {
  const supabase = useMemo(() => createClient(), [])
  const t = useTranslation()
  const [step, setStep] = useState<'form' | 'sent'>('form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSend() {
    if (!name.trim()) { toast.error(t('authartist.errname')); return }
    if (!email.trim() || !email.includes('@')) { toast.error(t('authartist.erremail')); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?role=client`,
          data: { name: name.trim(), role: 'client' },
          shouldCreateUser: true,
        },
      })
      if (error) throw error
      setStep('sent')
    } catch (err: any) {
      toast.error(err.message ?? t('general.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg-page)',
      maxWidth: 430,
      margin: '0 auto',
      direction: 'rtl',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* Top decoration */}
      <div style={{
        height: 6,
        background: 'var(--accent)',
        borderRadius: '0 0 4px 4px',
      }} />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '48px 32px 40px',
      }}>

        {step === 'form' ? (
          <>
            {/* Logo */}
            <div style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
                <div style={{ width: 40, height: 40, background: 'var(--accent)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 20, boxShadow: '0 4px 12px rgba(192,57,43,0.25)' }}>ح</div>
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-primary)' }}>حِرفة</span>
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink-primary)', margin: '0 0 8px', lineHeight: 1.3 }}>
                {t('auth.welcome')}
              </h1>
              <p style={{ fontSize: 15, color: 'var(--ink-secondary)', margin: 0, lineHeight: 1.6 }}>
                {t('auth.subtitle')}
              </p>
            </div>

            {/* Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>

              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)', marginBottom: 8 }}>
                  {t('auth.name')} <span style={{ color: 'var(--accent)' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder={t('auth.nameph')}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-surface)',
                    border: '1.5px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '13px 16px',
                    fontSize: 15,
                    color: 'var(--ink-primary)',
                    outline: 'none',
                    direction: 'rtl',
                    boxSizing: 'border-box',
                    fontFamily: 'Cairo, sans-serif',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)', marginBottom: 8 }}>
                  {t('auth.email')} <span style={{ color: 'var(--accent)' }}>*</span>
                </label>
                <input
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  style={{
                    width: '100%',
                    background: 'var(--bg-surface)',
                    border: '1.5px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '13px 16px',
                    fontSize: 15,
                    color: 'var(--ink-primary)',
                    outline: 'none',
                    direction: 'ltr',
                    textAlign: 'right',
                    boxSizing: 'border-box',
                    fontFamily: 'Cairo, sans-serif',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>

              <div style={{ flex: 1 }} />

              {/* CTA */}
              <button
                onClick={handleSend}
                disabled={loading}
                style={{
                  width: '100%',
                  background: loading ? 'var(--border)' : 'var(--accent)',
                  color: loading ? 'var(--ink-muted)' : '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  padding: '15px',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'background 0.15s',
                  boxShadow: loading ? 'none' : '0 4px 16px rgba(192,57,43,0.25)',
                }}
                onMouseDown={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.98)' }}
                onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
              >
                {loading ? (
                  <>
                    <div className="hirfa-spin" style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%' }} />
                    {t('auth.sending')}
                  </>
                ) : (
                  <>
                    {t('auth.send')}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 5 5 12 12 19"/>
                    </svg>
                  </>
                )}
              </button>

              {/* Footer */}
              <p style={{ fontSize: 12, color: 'var(--ink-muted)', textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
                {t('auth.terms')}{' '}
                <a href="/terms" style={{ color: 'var(--accent)', textDecoration: 'none' }}>{t('auth.termslink')}</a>
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{t('auth.or')}</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>

              <a href="/client/home" style={{ display: 'block', textAlign: 'center', fontSize: 14, color: 'var(--ink-secondary)', textDecoration: 'none', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontWeight: 500 }}>
                {t('auth.guest')}
              </a>
            </div>
          </>
        ) : (
          /* Success state */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--success-bg)', border: '2px solid var(--success-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
              📬
            </div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink-primary)', margin: '0 0 10px' }}>
                {t('auth.checkmail')}
              </h2>
              <p style={{ fontSize: 15, color: 'var(--ink-secondary)', margin: '0 0 6px', lineHeight: 1.6 }}>
                {t('auth.sentto')}
              </p>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)', margin: 0, direction: 'ltr' }}>
                {email}
              </p>
            </div>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', width: '100%' }}>
              <p style={{ fontSize: 13, color: 'var(--ink-secondary)', margin: 0, lineHeight: 1.7 }}>
                📱 {t('auth.checkinbox')}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 8 }}>
              <button
                onClick={() => { setStep('form'); setEmail(''); setName('') }}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px', fontSize: 14, color: 'var(--ink-secondary)', cursor: 'pointer', fontWeight: 500 }}
              >
                {t('auth.edit')}
              </button>
              <button
                onClick={handleSend}
                disabled={loading}
                style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--accent)', cursor: 'pointer', fontWeight: 600, padding: '8px' }}
              >
                {loading ? t('auth.sending') : t('auth.resend')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
