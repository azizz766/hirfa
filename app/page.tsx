'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  PenLine, Paintbrush, Package, Scissors, Box, Sparkles,
  MessageSquare, Users, CheckCircle2, ChevronLeft,
  Star, Link, AtSign,
} from 'lucide-react'
import { useTranslation } from '@/lib/theme'

const CRAFTS = ['خط عربي', 'رسم', 'فخار', 'كروشيه', 'نحت', 'نسيج']

const CATEGORIES = [
  { label: 'خط عربي',  Icon: PenLine,    accent: '#8B1A10', bg: '#FEF0EE', slug: 'calligraphy' },
  { label: 'رسم',      Icon: Paintbrush, accent: '#1A3A6B', bg: '#EEF3FF', slug: 'painting'    },
  { label: 'فخار',     Icon: Package,    accent: '#7C4A1A', bg: '#FFF3E6', slug: 'pottery'     },
  { label: 'كروشيه',  Icon: Scissors,   accent: '#1A6B3A', bg: '#EDFFF3', slug: 'crochet'     },
  { label: 'نحت',      Icon: Box,        accent: '#4A1A6B', bg: '#F5EEFF', slug: 'sculpture'   },
  { label: 'أخرى',     Icon: Sparkles,   accent: '#1A556B', bg: '#EEFAFF', slug: 'other'       },
]

const STEPS = [
  { num: '١', title: 'أرسل طلبك',           desc: 'اشرح ما تريده — النوع، المقاس، الاستخدام، الميزانية',    Icon: MessageSquare  },
  { num: '٢', title: 'استقبل عروض الفنانين', desc: 'يتواصل معك فنانون متخصصون ويرسلون أسعارهم مباشرةً',    Icon: Users          },
  { num: '٣', title: 'أكّد واستلم عملك',    desc: 'اختر الأنسب، ادفع بأمان — عملك مضمون أو استرداد كامل', Icon: CheckCircle2   },
]

const STATS = [
  { value: '٥٠+',  label: 'فنان ومبدع' },
  { value: '٢٠٠+', label: 'طلب أُنجز'   },
  { value: '٤.٩',  label: 'متوسط التقييم' },
]

export default function LandingPage() {
  const router = useRouter()
  const t = useTranslation()
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

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('lp-in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12 },
    )
    document.querySelectorAll('.lp-watch').forEach((el) => io.observe(el))
    return () => io.disconnect()
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
          from { opacity:0; transform:translateY(24px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes lp-fade-in {
          from { opacity:0; }
          to   { opacity:1; }
        }
        .lp-watch {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.6s cubic-bezier(.22,1,.36,1), transform 0.6s cubic-bezier(.22,1,.36,1);
        }
        .lp-watch.lp-d1 { transition-delay: 0.08s; }
        .lp-watch.lp-d2 { transition-delay: 0.18s; }
        .lp-watch.lp-d3 { transition-delay: 0.28s; }
        .lp-watch.lp-d4 { transition-delay: 0.38s; }
        .lp-watch.lp-d5 { transition-delay: 0.48s; }
        .lp-watch.lp-d6 { transition-delay: 0.58s; }
        .lp-in {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        .lp-cat-card {
          transition: transform 0.2s cubic-bezier(.22,1,.36,1), box-shadow 0.2s;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .lp-cat-card:active { transform: scale(0.96) !important; }
        @media (hover:hover) {
          .lp-cat-card:hover {
            transform: translateY(-4px) scale(1.02) !important;
            box-shadow: 0 8px 28px rgba(0,0,0,0.12) !important;
          }
        }
        .lp-btn-primary {
          transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
        }
        .lp-btn-primary:active { transform: scale(0.97); opacity: 0.92; }
        .lp-btn-ghost {
          transition: color 0.15s;
        }
        .lp-step-line {
          position: absolute;
          top: 44px;
          bottom: -44px;
          right: 21px;
          width: 1px;
          background: linear-gradient(to bottom, rgba(192,57,43,0.3), transparent);
        }
      `}</style>

      <div style={{
        minHeight: '100dvh',
        maxWidth: 'var(--max-width)',
        margin: '0 auto',
        direction: 'rtl',
        background: 'var(--bg-page)',
        overflowX: 'hidden',
      }}>

        {/* ── HERO ──────────────────────────────────── */}
        <section style={{
          minHeight: '100dvh',
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

          {/* Grid texture overlay */}
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
            padding: '40px 28px 0',
            position: 'relative', zIndex: 1,
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(192,57,43,0.15)',
              border: '1px solid rgba(192,57,43,0.3)',
              borderRadius: 'var(--radius-pill)',
              padding: '5px 12px',
              width: 'fit-content',
              marginBottom: 20,
              animation: 'lp-fade-in 0.8s ease-out 0.1s both',
            }}>
              <Star size={11} color="#C0392B" fill="#C0392B" />
              <span style={{ fontSize: 11, color: '#E07060', fontWeight: 600, letterSpacing: 0.3 }}>
                سوق الحرف اليدوية والفنون
              </span>
            </div>

            <h1 style={{
              fontSize: 38, fontWeight: 800, color: '#F5F0EB',
              margin: '0 0 8px', lineHeight: 1.15, letterSpacing: -0.5,
              animation: 'lp-fade-up 0.7s cubic-bezier(.22,1,.36,1) 0.2s both',
            }}>
              اكتشف فنانين
            </h1>

            <div style={{
              margin: '0 0 20px',
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

            <p style={{
              fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75,
              margin: '0 0 36px', maxWidth: 300,
              animation: 'lp-fade-up 0.7s cubic-bezier(.22,1,.36,1) 0.4s both',
            }}>
              {t('landing.desc')}
            </p>

            {/* Stats row */}
            <div style={{
              display: 'flex', gap: 28, marginBottom: 44,
              animation: 'lp-fade-up 0.7s cubic-bezier(.22,1,.36,1) 0.5s both',
            }}>
              {STATS.map(({ value, label }) => (
                <div key={label}>
                  <p style={{ fontSize: 22, fontWeight: 800, color: '#F5F0EB', margin: '0 0 2px' }}>
                    {value}
                  </p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: 0, letterSpacing: 0.3 }}>
                    {label}
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
              className="lp-btn-ghost"
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
        </section>

        {/* ── HOW IT WORKS ──────────────────────────── */}
        <section style={{ background: 'var(--bg-page)', padding: '72px 28px 64px' }}>
          <div className="lp-watch">
            <p style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, letterSpacing: 1.2, margin: '0 0 8px', textTransform: 'uppercase' }}>
              كيف يعمل
            </p>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink-primary)', margin: '0 0 40px', letterSpacing: -0.3, lineHeight: 1.25 }}>
              ثلاث خطوات<br />
              <span style={{ color: 'var(--accent)' }}>وعملك في يديك</span>
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {STEPS.map(({ num, title, desc, Icon }, i) => (
              <div
                key={num}
                className={`lp-watch lp-d${i + 1}`}
                style={{ display: 'flex', gap: 18, position: 'relative' }}
              >
                {/* Connector line */}
                {i < STEPS.length - 1 && <div className="lp-step-line" />}

                {/* Step marker */}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: i === 0 ? 'var(--accent)' : 'var(--bg-surface)',
                  border: `2px solid ${i === 0 ? 'transparent' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: i === 0 ? '0 4px 16px rgba(192,57,43,0.3)' : 'var(--shadow-sm)',
                  position: 'relative', zIndex: 1,
                }}>
                  <span style={{
                    fontSize: 16, fontWeight: 800,
                    color: i === 0 ? '#fff' : 'var(--ink-secondary)',
                  }}>
                    {num}
                  </span>
                </div>

                {/* Content */}
                <div style={{ paddingBottom: 40, flex: 1 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 'var(--radius-md)',
                    background: 'var(--accent-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 10,
                  }}>
                    <Icon size={18} color="var(--accent)" strokeWidth={1.75} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-primary)', margin: '0 0 6px' }}>
                    {title}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--ink-secondary)', margin: 0, lineHeight: 1.7 }}>
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CATEGORIES ────────────────────────────── */}
        <section style={{ background: 'var(--bg-surface)', padding: '64px 28px' }}>
          <div className="lp-watch">
            <p style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, letterSpacing: 1.2, margin: '0 0 8px', textTransform: 'uppercase' }}>
              التخصصات
            </p>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink-primary)', margin: '0 0 32px', letterSpacing: -0.3, lineHeight: 1.25 }}>
              استكشف كل فروع
              <br /><span style={{ color: 'var(--accent)' }}>الفن اليدوي</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {CATEGORIES.map(({ label, Icon, accent, bg, slug }, i) => (
              <div
                key={slug}
                className={`lp-cat-card lp-watch lp-d${(i % 4) + 1}`}
                onClick={() => router.push('/client/home')}
                style={{
                  background: bg,
                  borderRadius: 'var(--radius-xl)',
                  padding: '20px 16px',
                  border: `1.5px solid ${accent}18`,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 'var(--radius-lg)',
                  background: `${accent}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 12,
                }}>
                  <Icon size={20} color={accent} strokeWidth={1.75} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: accent, margin: '0 0 3px' }}>
                  {label}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ fontSize: 10, color: `${accent}80`, fontWeight: 500 }}>تصفح الفنانين</span>
                  <ChevronLeft size={10} color={`${accent}60`} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── TRUST SIGNALS ─────────────────────────── */}
        <section style={{
          background: '#0E0B09',
          padding: '72px 28px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)',
            width: 400, height: 200,
            background: 'radial-gradient(ellipse, rgba(192,57,43,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div className="lp-watch" style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ fontSize: 11, color: 'rgba(192,57,43,0.7)', fontWeight: 700, letterSpacing: 1.2, margin: '0 0 8px', textTransform: 'uppercase' }}>
              بالأرقام
            </p>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#F5F0EB', margin: '0 0 48px', letterSpacing: -0.3, lineHeight: 1.25 }}>
              منصة يثق بها<br />
              <span style={{ color: 'var(--accent)' }}>الفنانون والعملاء</span>
            </h2>
          </div>

          <div style={{
            display: 'flex', flexDirection: 'column', gap: 0,
            position: 'relative', zIndex: 1,
          }}>
            {STATS.map(({ value, label }, i) => (
              <div
                key={label}
                className={`lp-watch lp-d${i + 1}`}
                style={{
                  padding: '24px 0',
                  borderBottom: i < STATS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <p style={{
                  fontSize: 52, fontWeight: 900, color: 'var(--accent)',
                  margin: 0, lineHeight: 1, letterSpacing: -1,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {value}
                </p>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', margin: 0, textAlign: 'left' }}>
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Social proof strip */}
          <div
            className="lp-watch lp-d4"
            style={{
              marginTop: 48,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 'var(--radius-xl)',
              padding: '16px 18px',
              display: 'flex', alignItems: 'center', gap: 12,
              position: 'relative', zIndex: 1,
            }}
          >
            <div style={{ display: 'flex' }}>
              {['#C0392B', '#2C3E50', '#8E44AD', '#27AE60'].map((c, i) => (
                <div key={i} style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: c,
                  border: '2px solid #0E0B09',
                  marginLeft: i === 0 ? 0 : -8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, color: '#fff', fontWeight: 800,
                }}>
                  {['ن', 'س', 'ر', 'م'][i]}
                </div>
              ))}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                {t('landing.join')}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Star size={11} color="#C0392B" fill="#C0392B" />
              <span style={{ fontSize: 12, color: '#E07060', fontWeight: 700 }}>٤.٩</span>
            </div>
          </div>
        </section>

        {/* ── FOR ARTISTS CTA ───────────────────────── */}
        <section style={{ background: 'var(--bg-page)', padding: '72px 28px' }}>
          <div
            className="lp-watch"
            style={{
              background: 'linear-gradient(135deg, #1A0F0D 0%, #2D1510 50%, #1A0F0D 100%)',
              borderRadius: 24,
              padding: '36px 28px',
              position: 'relative', overflow: 'hidden',
            }}
          >
            {/* Decorative element */}
            <div style={{
              position: 'absolute', top: -40, left: -40,
              width: 160, height: 160, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(192,57,43,0.2) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', bottom: -30, right: -30,
              width: 120, height: 120, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(192,57,43,0.15) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(192,57,43,0.2)',
              border: '1px solid rgba(192,57,43,0.35)',
              borderRadius: 'var(--radius-pill)',
              padding: '5px 12px',
              marginBottom: 18,
            }}>
              <Sparkles size={10} color="#E07060" />
              <span style={{ fontSize: 10, color: '#E07060', fontWeight: 700, letterSpacing: 0.5 }}>
                للفنانين والحرفيين
              </span>
            </div>

            <h2 style={{
              fontSize: 26, fontWeight: 800, color: '#F5F0EB',
              margin: '0 0 10px', lineHeight: 1.25, letterSpacing: -0.3,
              position: 'relative',
            }}>
              حوّل موهبتك
              <br />
              <span style={{ color: 'var(--accent)' }}>إلى مصدر دخل</span>
            </h2>

            <p style={{
              fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.75,
              margin: '0 0 28px', position: 'relative',
            }}>
              انضم لمنصة حِرفة وابدأ بتلقّي طلبات من عملاء يبحثون عن موهبتك تحديداً.
              <br />لا عمولة حتى تُنجز أول طلب.
            </p>

            <button
              className="lp-btn-primary"
              onClick={() => router.push('/auth/artist')}
              style={{
                background: 'var(--accent)',
                color: '#fff', border: 'none',
                borderRadius: 'var(--radius-xl)',
                padding: '16px 24px',
                fontSize: 15, fontWeight: 700,
                cursor: 'pointer', width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                boxShadow: '0 4px 20px rgba(192,57,43,0.5)',
                position: 'relative',
              }}
            >
              <span>سجّل كفنان الآن</span>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ChevronLeft size={15} />
              </div>
            </button>
          </div>
        </section>

        {/* ── FOOTER ────────────────────────────────── */}
        <footer style={{
          background: '#0E0B09',
          padding: '52px 28px 48px',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11,
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 17, fontWeight: 800,
              boxShadow: '0 4px 12px rgba(192,57,43,0.4)',
            }}>ح</div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#F5F0EB', margin: 0 }}>حِرفة</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: 0, letterSpacing: 0.3 }}>سوق الفن والحرف اليدوية</p>
            </div>
          </div>

          {/* Nav links */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px',
            marginBottom: 36,
          }}>
            {[
              { label: 'ابحث عن فنان', href: '/auth/client' },
              { label: 'سجّل كفنان',   href: '/auth/artist' },
              { label: 'تصفح الفنانين', href: '/client/home' },
              { label: 'الشروط والأحكام', href: '/terms' },
            ].map(({ label, href }) => (
              <button
                key={label}
                onClick={() => router.push(href)}
                style={{
                  background: 'none', border: 'none',
                  color: 'rgba(255,255,255,0.35)',
                  fontSize: 12, fontWeight: 500,
                  cursor: 'pointer', padding: 0,
                  textAlign: 'right',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Social + copyright */}
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: 0 }}>
              © ٢٠٢٦ حِرفة · جميع الحقوق محفوظة
            </p>
            <div style={{ display: 'flex', gap: 16 }}>
              {[
                { Icon: AtSign, label: 'Instagram' },
                { Icon: Link,   label: 'Twitter'   },
              ].map(({ Icon, label }) => (
                <button
                  key={label}
                  style={{
                    background: 'none', border: 'none',
                    color: 'rgba(255,255,255,0.25)',
                    cursor: 'pointer', padding: 0,
                    display: 'flex', alignItems: 'center',
                    transition: 'color 0.15s',
                  }}
                  aria-label={label}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)' }}
                >
                  <Icon size={17} strokeWidth={1.5} />
                </button>
              ))}
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}
