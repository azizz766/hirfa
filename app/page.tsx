'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation, useAppSettings } from '@/lib/theme'

const CRAFTS = ['خط عربي', 'رسم', 'فخار', 'كروشيه', 'نحت', 'نسيج']

const STATS = [
  { raw: 50,  suffix: '+', labelAr: 'فنان',         labelEn: 'Artists'  },
  { raw: 200, suffix: '+', labelAr: 'طلب مكتمل',    labelEn: 'Orders'   },
  { raw: 4.9, suffix: '',  labelAr: 'تقييم متوسط',  labelEn: 'Rating'   },
]

export default function LandingPage() {
  const router = useRouter()
  const t = useTranslation()
  const { lang } = useAppSettings()
  const [craftIndex, setCraftIndex] = useState(0)
  const [craftVisible, setCraftVisible] = useState(true)

  useEffect(() => {
    const id = setInterval(() => {
      setCraftVisible(false)
      setTimeout(() => {
        setCraftIndex((i) => (i + 1) % CRAFTS.length)
        setCraftVisible(true)
      }, 350)
    }, 2800)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      <style>{`
        @keyframes lp-craft-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lp-enter {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lp-glyph-drift {
          0%, 100% { transform: translate(0, 0) rotate(-4deg); }
          50%       { transform: translate(4px, -8px) rotate(-3deg); }
        }
        .lp-primary-btn {
          transition: transform 0.14s ease, box-shadow 0.14s ease;
        }
        .lp-primary-btn:active {
          transform: scale(0.975);
          box-shadow: 0 2px 8px rgba(192,57,43,0.2) !important;
        }
        .lp-secondary-btn {
          transition: background 0.15s, border-color 0.15s;
        }
        .lp-secondary-btn:active {
          background: var(--accent-light) !important;
        }
        .lp-ghost-btn {
          transition: color 0.15s;
        }
        .lp-ghost-btn:active {
          color: var(--ink-secondary) !important;
        }
      `}</style>

      <div style={{
        height: '100dvh',
        maxWidth: 'var(--max-width)',
        margin: '0 auto',
        direction: 'rtl',
        background: 'var(--bg-page)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* ── Oversized background glyph — the atelier watermark ── */}
        <div aria-hidden style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -54%) rotate(-4deg)',
          fontSize: 380,
          fontWeight: 900,
          lineHeight: 1,
          color: 'var(--accent)',
          opacity: 0.04,
          userSelect: 'none',
          pointerEvents: 'none',
          fontFamily: 'Cairo, sans-serif',
          animation: 'lp-glyph-drift 14s ease-in-out infinite',
          zIndex: 0,
        }}>ح</div>

        {/* ── Subtle radial glow centered ── */}
        <div aria-hidden style={{
          position: 'absolute',
          top: '38%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(192,57,43,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        {/* ── TOP NAV ── */}
        <nav style={{
          padding: '48px 24px 0',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          position: 'relative',
          zIndex: 1,
          animation: 'lp-enter 0.5s ease-out both',
        }}>
          {/* Logo badge */}
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 16,
            fontWeight: 800,
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(192,57,43,0.35)',
          }}>ح</div>

          <span style={{
            fontSize: 17,
            fontWeight: 800,
            color: 'var(--ink-primary)',
            letterSpacing: -0.3,
          }}>
            حِرفة
          </span>

          <div style={{ flex: 1 }} />

          <button
            onClick={() => router.push('/auth/client')}
            className="lp-ghost-btn"
            style={{
              background: 'transparent',
              border: '1.5px solid var(--border-strong)',
              borderRadius: 'var(--radius-pill)',
              color: 'var(--ink-secondary)',
              fontSize: 12,
              fontWeight: 600,
              padding: '6px 16px',
              cursor: 'pointer',
            }}
          >
            دخول
          </button>
        </nav>

        {/* ── HERO CONTENT ── */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 24px',
          position: 'relative',
          zIndex: 1,
          gap: 0,
        }}>

          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--accent-light)',
            border: '1px solid var(--accent-border)',
            borderRadius: 'var(--radius-pill)',
            padding: '5px 13px',
            width: 'fit-content',
            marginBottom: 22,
            animation: 'lp-enter 0.55s ease-out 0.05s both',
          }}>
            <div style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: 'var(--accent)',
              flexShrink: 0,
            }} />
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--accent)',
              letterSpacing: 0.4,
            }}>
              {lang === 'en' ? 'Handcraft Marketplace' : 'سوق الحرف اليدوية'}
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 32,
            fontWeight: 800,
            color: 'var(--ink-primary)',
            margin: '0 0 4px',
            lineHeight: 1.2,
            letterSpacing: -0.5,
            animation: 'lp-enter 0.55s ease-out 0.12s both',
          }}>
            {lang === 'en' ? 'Discover Artists' : 'اكتشف فنانين'}
          </h1>

          {/* Animated craft name */}
          <div style={{
            marginBottom: 18,
            animation: 'lp-enter 0.55s ease-out 0.18s both',
            minHeight: 42,
          }}>
            <h1 style={{
              fontSize: 32,
              fontWeight: 800,
              color: 'var(--accent)',
              margin: 0,
              lineHeight: 1.2,
              letterSpacing: -0.5,
              display: 'inline-block',
              opacity: craftVisible ? 1 : 0,
              transform: craftVisible ? 'translateY(0)' : 'translateY(-6px)',
              transition: 'opacity 0.35s ease, transform 0.35s ease',
            }}>
              {CRAFTS[craftIndex]}
            </h1>
          </div>

          {/* Description */}
          <p style={{
            fontSize: 14,
            fontWeight: 400,
            color: 'var(--ink-secondary)',
            lineHeight: 1.8,
            margin: '0 0 32px',
            maxWidth: 300,
            direction: lang === 'ar' ? 'rtl' : 'ltr',
            textAlign: lang === 'ar' ? 'right' : 'left',
            animation: 'lp-enter 0.55s ease-out 0.24s both',
          }}>
            {lang === 'en'
              ? 'Connect with top craftspeople. Order unique handmade art with ease.'
              : 'تواصل مع أفضل الفنانين والحرفيين. اطلب أعمالاً يدوية فريدة بكل سهولة.'}
          </p>

          {/* Stats */}
          <div style={{
            display: 'flex',
            alignItems: 'stretch',
            gap: 0,
            animation: 'lp-enter 0.55s ease-out 0.3s both',
          }}>
            {STATS.map(({ raw, suffix, labelAr, labelEn }, i) => (
              <>
                {i > 0 && (
                  <div key={`sep-${i}`} style={{
                    width: 1,
                    alignSelf: 'stretch',
                    background: 'var(--border)',
                    margin: '0 20px',
                    flexShrink: 0,
                  }} />
                )}
                <div key={labelAr} style={{ flexShrink: 0 }}>
                  <p style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: 'var(--accent)',
                    margin: '0 0 2px',
                    lineHeight: 1,
                    direction: 'ltr',
                    display: 'inline-block',
                  }}>
                    {raw.toLocaleString('en-US')}{suffix}
                  </p>
                  <p style={{
                    fontSize: 10,
                    fontWeight: 500,
                    color: 'var(--ink-muted)',
                    margin: 0,
                    letterSpacing: 0.2,
                    whiteSpace: 'nowrap',
                  }}>
                    {lang === 'en' ? labelEn : labelAr}
                  </p>
                </div>
              </>
            ))}
          </div>
        </div>

        {/* ── BOTTOM ACTIONS ── */}
        <div style={{
          padding: '0 24px 48px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          position: 'relative',
          zIndex: 1,
          animation: 'lp-enter 0.55s ease-out 0.36s both',
        }}>

          {/* Primary CTA */}
          <button
            className="lp-primary-btn"
            onClick={() => router.push('/auth/client')}
            style={{
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              height: 52,
              width: '100%',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: -0.1,
              boxShadow: '0 4px 20px rgba(192,57,43,0.3)',
            }}
          >
            {t('landing.client')}
          </button>

          {/* Secondary CTA */}
          <button
            className="lp-secondary-btn"
            onClick={() => router.push('/auth/artist')}
            style={{
              background: 'var(--bg-surface)',
              color: 'var(--accent)',
              border: '1.5px solid var(--accent)',
              borderRadius: 14,
              height: 52,
              width: '100%',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: -0.1,
            }}
          >
            {t('landing.artist')}
          </button>

          {/* Ghost CTA */}
          <button
            className="lp-ghost-btn"
            onClick={() => router.push('/client/home')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ink-muted)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              padding: '6px',
              width: '100%',
              textAlign: 'center',
            }}
          >
            {t('landing.guest')}
          </button>
        </div>
      </div>
    </>
  )
}
