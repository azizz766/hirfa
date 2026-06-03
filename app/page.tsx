'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Star } from 'lucide-react'
import { useTranslation, useAppSettings } from '@/lib/theme'

const CRAFTS = ['خط عربي', 'رسم', 'فخار', 'كروشيه', 'نحت', 'نسيج']

const STATS = [
  { raw: 50,  suffix: '+', labelAr: 'فنان ومبدع',   labelEn: 'Artists'    },
  { raw: 200, suffix: '+', labelAr: 'طلب أُنجز',     labelEn: 'Orders'     },
  { raw: 4.9, suffix: '',  labelAr: 'متوسط التقييم', labelEn: 'Avg Rating' },
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
      }, 380)
    }, 2600)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      <style>{`
        @keyframes lp-blob {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(12px,-18px) scale(1.08); }
          66%      { transform: translate(-10px,12px) scale(0.94); }
        }
        @keyframes lp-float {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        @keyframes lp-fade-up {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes lp-fade-in {
          from { opacity:0; }
          to   { opacity:1; }
        }
        .lp-btn-primary {
          transition: transform 0.15s, opacity 0.15s;
        }
        .lp-btn-primary:active { transform: scale(0.97); opacity: 0.92; }
      `}</style>

      <div style={{
        height: '100dvh',
        maxWidth: 'var(--max-width)',
        margin: '0 auto',
        direction: 'rtl',
        background: '#0E0B09',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Decorative blobs */}
        <div style={{
          position: 'absolute', top: -100, right: -80,
          width: 340, height: 340, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(192,57,43,0.22) 0%, transparent 70%)',
          animation: 'lp-blob 9s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: 60, left: -100,
          width: 280, height: 280, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(192,57,43,0.12) 0%, transparent 70%)',
          animation: 'lp-blob 12s ease-in-out infinite reverse',
          pointerEvents: 'none',
        }} />

        {/* Grid texture */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          pointerEvents: 'none',
        }} />

        {/* Header */}
        <header style={{
          padding: '52px 28px 0',
          display: 'flex', alignItems: 'center', gap: 10,
          position: 'relative', zIndex: 1,
          animation: 'lp-fade-in 0.6s ease-out both',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 19, fontWeight: 800,
            boxShadow: '0 0 0 1px rgba(192,57,43,0.4), 0 4px 16px rgba(192,57,43,0.4)',
            animation: 'lp-float 3.5s ease-in-out infinite',
            flexShrink: 0,
          }}>ح</div>
          <span style={{ color: '#F5F0EB', fontSize: 18, fontWeight: 700, letterSpacing: -0.3 }}>
            حِرفة
          </span>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => router.push('/auth/client')}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 'var(--radius-pill)',
              color: 'rgba(255,255,255,0.7)',
              fontSize: 12, fontWeight: 600,
              padding: '7px 14px', cursor: 'pointer',
              backdropFilter: 'blur(8px)',
            }}
          >
            دخول
          </button>
        </header>

        {/* Hero content */}
        <div style={{
          flex: 1,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '0 28px',
          position: 'relative', zIndex: 1,
          gap: 0,
        }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(192,57,43,0.15)',
            border: '1px solid rgba(192,57,43,0.3)',
            borderRadius: 'var(--radius-pill)',
            padding: '5px 12px',
            width: 'fit-content',
            marginBottom: 20,
            animation: 'lp-fade-in 0.7s ease-out 0.1s both',
          }}>
            <Star size={11} color="#C0392B" fill="#C0392B" />
            <span style={{ fontSize: 11, color: '#E07060', fontWeight: 600, letterSpacing: 0.3 }}>
              {lang === 'en' ? 'Handcraft & Arts Marketplace' : 'سوق الحرف اليدوية والفنون'}
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 38, fontWeight: 800, color: '#F5F0EB',
            margin: '0 0 6px', lineHeight: 1.15, letterSpacing: -0.5,
            animation: 'lp-fade-up 0.7s cubic-bezier(.22,1,.36,1) 0.2s both',
          }}>
            {lang === 'en' ? 'Discover Artists' : 'اكتشف فنانين'}
          </h1>

          {/* Animated craft name */}
          <div style={{
            marginBottom: 20,
            animation: 'lp-fade-up 0.7s cubic-bezier(.22,1,.36,1) 0.3s both',
          }}>
            <h1 style={{
              fontSize: 38, fontWeight: 800, margin: 0, lineHeight: 1.15,
              letterSpacing: -0.5,
              color: 'var(--accent)',
              opacity: craftVisible ? 1 : 0,
              transform: craftVisible ? 'translateY(0)' : 'translateY(-10px)',
              transition: 'opacity 0.38s ease, transform 0.38s ease',
              display: 'inline-block',
            }}>
              {CRAFTS[craftIndex]}
            </h1>
          </div>

          {/* Description */}
          <p style={{
            fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75,
            margin: '0 0 32px', maxWidth: 300,
            direction: lang === 'ar' ? 'rtl' : 'ltr',
            textAlign: lang === 'ar' ? 'right' : 'left',
            animation: 'lp-fade-up 0.7s cubic-bezier(.22,1,.36,1) 0.4s both',
          }}>
            {lang === 'en'
              ? 'Connect with top craftspeople. Order unique handmade art with ease.'
              : 'تواصل مع أفضل الفنانين والحرفيين. اطلب أعمالاً يدوية فريدة بكل سهولة.'}
          </p>

          {/* Stats */}
          <div style={{
            display: 'flex', gap: 28,
            animation: 'lp-fade-up 0.7s cubic-bezier(.22,1,.36,1) 0.5s both',
          }}>
            {STATS.map(({ raw, suffix, labelAr, labelEn }) => (
              <div key={labelAr}>
                <p style={{
                  fontSize: 22, fontWeight: 800, color: '#F5F0EB',
                  margin: '0 0 2px',
                  direction: 'ltr', display: 'inline-block',
                }}>
                  {raw.toLocaleString('en-US')}{suffix}
                </p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: 0, letterSpacing: 0.3 }}>
                  {lang === 'en' ? labelEn : labelAr}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div style={{
          padding: '0 28px 52px',
          display: 'flex', flexDirection: 'column', gap: 10,
          position: 'relative', zIndex: 1,
          animation: 'lp-fade-up 0.7s cubic-bezier(.22,1,.36,1) 0.6s both',
        }}>
          <button
            className="lp-btn-primary"
            onClick={() => router.push('/auth/client')}
            style={{
              background: 'var(--accent)',
              color: '#fff', border: 'none',
              borderRadius: 'var(--radius-xl)',
              padding: '17px 20px',
              fontSize: 15, fontWeight: 700,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              boxShadow: '0 0 0 1px rgba(192,57,43,0.5), 0 8px 28px rgba(192,57,43,0.45)',
            }}
          >
            <span>{t('landing.client')}</span>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ChevronLeft size={16} />
            </div>
          </button>

          <button
            className="lp-btn-primary"
            onClick={() => router.push('/auth/artist')}
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.85)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 'var(--radius-xl)',
              padding: '16px 20px',
              fontSize: 15, fontWeight: 600,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <span>{t('landing.artist')}</span>
            <ChevronLeft size={16} strokeWidth={1.5} />
          </button>

          <button
            className="lp-btn-primary"
            onClick={() => router.push('/client/home')}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.28)',
              fontSize: 12, fontWeight: 500,
              cursor: 'pointer', padding: '8px',
              letterSpacing: 0.2,
            }}
          >
            {t('landing.guest')}
          </button>
        </div>
      </div>
    </>
  )
}
