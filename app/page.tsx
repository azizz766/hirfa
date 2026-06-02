'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/theme'

const CRAFTS = ['خط عربي', 'رسم', 'فخار', 'كروشيه', 'نحت']

export default function LandingPage() {
  const router = useRouter()
  const t = useTranslation()
  const [craftIndex, setCraftIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setCraftIndex((i) => (i + 1) % CRAFTS.length)
        setVisible(true)
      }, 300)
    }, 2200)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg-page)',
      maxWidth: 'var(--max-width)',
      margin: '0 auto',
      direction: 'rtl',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: -80,
        left: -80,
        width: 300,
        height: 300,
        borderRadius: '50%',
        background: 'var(--accent)',
        opacity: 0.04,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: 120,
        right: -60,
        width: 200,
        height: 200,
        borderRadius: '50%',
        background: 'var(--accent)',
        opacity: 0.06,
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ padding: '52px 32px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 44, height: 44,
          background: 'var(--accent)',
          borderRadius: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 22, fontWeight: 700,
          boxShadow: '0 4px 12px rgba(192,57,43,0.3)',
        }}>ح</div>
        <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink-primary)', letterSpacing: -0.5 }}>
          حِرفة
        </span>
      </div>

      {/* Hero */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 32px',
        gap: 16,
      }}>
        <div>
          <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: '0 0 12px', letterSpacing: 0.5 }}>
            {t('landing.market')}
          </p>
          <h1 style={{
            fontSize: 36,
            fontWeight: 700,
            color: 'var(--ink-primary)',
            margin: '0 0 4px',
            lineHeight: 1.2,
            letterSpacing: -0.5,
          }}>
            {t('landing.discover')}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{
              fontSize: 36,
              fontWeight: 700,
              color: 'var(--accent)',
              margin: 0,
              lineHeight: 1.2,
              letterSpacing: -0.5,
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(-8px)',
              transition: 'opacity 0.3s ease, transform 0.3s ease',
            }}>
              {CRAFTS[craftIndex]}
            </h1>
          </div>
        </div>

        <p style={{
          fontSize: 15,
          color: 'var(--ink-secondary)',
          margin: '8px 0 0',
          lineHeight: 1.7,
          maxWidth: 280,
        }}>
          {t('landing.desc')}
        </p>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 24, margin: '8px 0' }}>
          {[
            { value: '٤+', label: 'فنانون' },
            { value: '٥', label: 'تخصصات' },
            { value: '١٠٠%', label: 'يدوي' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink-primary)', margin: '0 0 2px' }}>
                {value}
              </p>
              <p style={{ fontSize: 11, color: 'var(--ink-muted)', margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div style={{ padding: '24px 32px 52px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Social proof */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '10px 14px',
          marginBottom: 4,
        }}>
          <div style={{ display: 'flex' }}>
            {['#C0392B', '#2C3E50', '#8E44AD'].map((color, i) => (
              <div key={i} style={{
                width: 28, height: 28,
                borderRadius: '50%',
                background: color,
                border: '2px solid var(--bg-surface)',
                marginRight: i === 0 ? 0 : -8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, color: '#fff', fontWeight: 700,
              }}>
                {['ن', 'س', 'ر'][i]}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--ink-secondary)', margin: 0, flex: 1 }}>
            {t('landing.join')}
          </p>
          <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>★ ٤.٨</span>
        </div>

        <button
          onClick={() => router.push('/auth/client')}
          style={{
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(192,57,43,0.25)',
            transition: 'transform 0.1s, box-shadow 0.1s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)' }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          <span>{t('landing.client')}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 5 5 12 12 19"/>
          </svg>
        </button>

        <button
          onClick={() => router.push('/auth/artist')}
          style={{
            background: 'var(--bg-surface)',
            color: 'var(--ink-primary)',
            border: '1.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '15px',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          {t('landing.artist')}
        </button>

        <button
          onClick={() => router.push('/client/home')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--ink-muted)',
            fontSize: 13,
            cursor: 'pointer',
            padding: '8px',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ink-secondary)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ink-muted)' }}
        >
          {t('landing.guest')}
        </button>
      </div>
    </div>
  )
}
