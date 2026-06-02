'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Image as ImageIcon, X, Plus, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toast'
import { useTranslation, useAppSettings } from '@/lib/theme'
import { LocationPicker } from '@/components/ui/LocationPicker'

// ─── Constants ────────────────────────────────────────────────

const CRAFT_CATEGORIES = ['خط عربي', 'رسم', 'نحت', 'كروشيه', 'فخار', 'أخرى']

const CRAFT_CATEGORY_KEY: Record<string, string> = {
  'خط عربي': 'cat.calligraphy',
  'رسم':     'cat.painting',
  'نحت':     'cat.sculpture',
  'كروشيه':  'cat.crochet',
  'فخار':    'cat.pottery',
  'أخرى':    'cat.other',
}

// ─── Image compression ────────────────────────────────────────

async function compressImage(file: File, maxDim: number): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(maxDim / img.width, maxDim / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.src = e.target!.result as string
    }
    reader.readAsDataURL(file)
  })
}

// ─── Page ─────────────────────────────────────────────────────

export default function ArtistSignupPage() {
  const t = useTranslation()
  const { lang } = useAppSettings()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get('error')
    if (error === 'link_expired') toast.error(lang === 'en' ? 'Link expired, please try again' : 'انتهت صلاحية الرابط، حاول مرة أخرى')
    if (error === 'invalid_link') toast.error(lang === 'en' ? 'Invalid link, please try again' : 'رابط غير صالح، حاول مرة أخرى')
  }, [])

  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Step 1
  const [photo, setPhoto] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [locationValue, setLocationValue] = useState<any>({})
  const photoRef = useRef<HTMLInputElement>(null)

  // Step 2
  const [categories, setCategories] = useState<string[]>([])
  const [bio, setBio] = useState('')
  const [experience, setExperience] = useState('')

  // Step 3
  const [portfolio, setPortfolio] = useState<string[]>([])
  const portfolioRef = useRef<HTMLInputElement>(null)

  // Step 4
  const [agreed, setAgreed] = useState(false)

  // ── Inside-component computed arrays ──────────────────────────

  const EXP_OPTIONS = [
    { value: '1-2',  label: t('authartist.exp12') },
    { value: '3-5',  label: t('authartist.exp35') },
    { value: '6-10', label: t('authartist.exp610') },
    { value: '10+',  label: t('authartist.exp10plus') },
  ]

  const stepTitles = [
    t('authartist.step1'),
    t('authartist.step2'),
    t('authartist.step3'),
    t('authartist.step4'),
  ]

  // ── Handlers ──────────────────────────────────────────────────

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const compressed = await compressImage(file, 400)
    setPhoto(compressed)
  }

  async function handlePortfolioChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const slots = 12 - portfolio.length
    const batch = files.slice(0, slots)
    const compressed = await Promise.all(batch.map((f) => compressImage(f, 900)))
    setPortfolio((prev) => [...prev, ...compressed])
    e.target.value = ''
  }

  // ── Validation ────────────────────────────────────────────────

  function validate(s: number): boolean {
    const e: Record<string, string> = {}
    if (s === 1) {
      if (!name.trim()) e.name = t('authartist.errname')
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = t('authartist.erremail')
      if (!phone.trim()) e.phone = t('authartist.errphone')
      if (!city.trim()) e.city = t('authartist.errcity')
    }
    if (s === 2) {
      if (categories.length === 0) e.categories = t('authartist.errcat')
      if (!bio.trim()) e.bio = t('authartist.errbio')
      if (!experience) e.experience = t('authartist.errexp')
    }
    if (s === 3) {
      if (portfolio.length < 3) e.portfolio = `${t('authartist.errportfoliopre')} ${3 - portfolio.length} ${t('authartist.errportfoliosuf')}`
    }
    if (s === 4) {
      if (!agreed) e.agreed = t('authartist.errterms')
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function goNext() {
    if (validate(step)) setStep((s) => s + 1)
  }

  async function handleSubmit() {
    if (!validate(4)) return
    setSubmitting(true)

    try {
      // Filter out base64 blobs — only persist public URLs; base64 is local-only until storage upload is wired
      const portfolioUrls = portfolio.filter(url => !url.startsWith('data:'))

      const { error: draftError } = await supabase
        .from('artist_drafts')
        .upsert({
          email: email.trim().toLowerCase(),
          name: name.trim(),
          bio: bio.trim() || null,
          city: city.trim() || null,
          years_experience: parseInt(experience) || 0,
          categories,
          portfolio_urls: portfolioUrls,
        }, { onConflict: 'email' })

      if (draftError) {
        localStorage.setItem('hirfa_artist_pending', JSON.stringify({
          name: name.trim(),
          bio: bio.trim() || null,
          city: city.trim() || null,
          years_experience: parseInt(experience) || 0,
          categories,
          portfolio_urls: portfolioUrls,
        }))
      }

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?role=artist`,
          data: { role: 'artist' },
          shouldCreateUser: true,
        },
      })

      if (otpError) throw otpError
      setDone(true)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('authartist.errgeneral'))
    } finally {
      setSubmitting(false)
    }
  }

  // ── Shared styles ─────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--bg-surface)', border: '1px solid #E8E0D8', borderRadius: 10,
    padding: '12px 14px', fontSize: 14, color: 'var(--ink-primary)', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'Cairo, sans-serif', direction: 'rtl',
  }

  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)', marginBottom: 6 }
  const errStyle: React.CSSProperties = { fontSize: 12, color: '#C0392B', marginTop: 5 }

  const pill = (active: boolean): React.CSSProperties => ({
    padding: '8px 18px', borderRadius: 22,
    border: active ? 'none' : '1px solid #E8E0D8',
    background: active ? '#C0392B' : '#FFFFFF',
    color: active ? '#FFFFFF' : '#666666',
    fontSize: 13, fontWeight: active ? 600 : 400,
    cursor: 'pointer', fontFamily: 'Cairo, sans-serif', flexShrink: 0,
    transition: 'background 0.15s, color 0.15s',
  })

  // ── Success screen ────────────────────────────────────────────

  if (done) {
    return (
      <div style={{ maxWidth: 430, margin: '0 auto', background: 'var(--bg-page)', minHeight: '100dvh', direction: lang === 'ar' ? 'rtl' : 'ltr', fontFamily: 'Cairo, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 28px', textAlign: 'center', gap: 0 }}>
        <div style={{ width: 96, height: 96, borderRadius: '50%', background: '#F0FDF4', border: '2px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
          <Check size={48} color="#16A34A" strokeWidth={2.5} />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink-primary)', margin: '0 0 12px', letterSpacing: -0.5 }}>
          {lang === 'en' ? 'Check your email!' : 'تحقق من بريدك!'}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-secondary)', margin: '0 0 6px', lineHeight: 1.6 }}>
          {lang === 'en' ? 'We sent a magic link to' : 'أرسلنا رابط التفعيل إلى'}
        </p>
        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-primary)', margin: '0 0 20px', direction: 'ltr' }}>{email}</p>
        <p style={{ fontSize: 13, color: 'var(--ink-secondary)', lineHeight: 1.75, margin: '0 0 32px', maxWidth: 300 }}>
          {lang === 'en'
            ? 'Tap the link in your email to activate your account and start your journey'
            : 'اضغط على الرابط في بريدك لتفعيل حسابك والبدء'}
        </p>
        <button
          onClick={() => { setDone(false) }}
          style={{ background: 'none', border: '1.5px solid var(--border)', borderRadius: 12, padding: '11px 28px', fontSize: 14, fontWeight: 600, color: 'var(--ink-secondary)', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', marginBottom: 16 }}
        >
          {lang === 'en' ? 'Resend email' : 'إعادة إرسال الرابط'}
        </button>
        <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: 0 }}>
          {lang === 'en' ? 'Check spam folder if you don\'t see it' : 'تحقق من مجلد الرسائل غير المرغوب فيها إن لم تجده'}
        </p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', background: 'var(--bg-page)', minHeight: '100dvh', direction: 'rtl', fontFamily: 'Cairo, sans-serif', paddingBottom: 48 }}>
      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:translateX(0) } }
        * { box-sizing: border-box }
        select option { direction: rtl }
      `}</style>

      {/* ── Header ── */}
      <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid #E8E0D8', padding: '14px 20px 16px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <button
            onClick={() => step > 1 ? setStep((s) => s - 1) : router.push('/')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--ink-secondary)', fontFamily: 'Cairo, sans-serif', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            {step > 1 ? t('authartist.back') : t('authartist.exit')}
          </button>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-primary)' }}>{stepTitles[step - 1]}</span>
          <span style={{ fontSize: 12, color: 'var(--ink-placeholder)', fontWeight: 500 }}>{step} / 4</span>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              style={{
                height: 8, borderRadius: 4,
                width: s === step ? 32 : 8,
                background: s < step ? '#C0392B' : s === step ? '#C0392B' : '#E8E0D8',
                opacity: s < step ? 0.45 : 1,
                transition: 'width 0.3s ease, background 0.2s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Step content (keyed for slide animation) ── */}
      <div key={step} style={{ padding: '26px 20px', animation: 'slideIn 0.22s ease' }}>

        {/* ────────────── STEP 1 ────────────── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink-primary)', margin: '0 0 6px' }}>{t('authartist.welcome')}</h2>
              <p style={{ fontSize: 13, color: 'var(--ink-secondary)', margin: 0 }}>{t('authartist.subtitle1')}</p>
            </div>

            {/* Photo */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
              <div style={{ position: 'relative', width: 100, height: 100, cursor: 'pointer' }} onClick={() => photoRef.current?.click()}>
                {photo ? (
                  <img src={photo} alt={t('authartist.photo')} style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)' }} />
                ) : (
                  <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--avatar-bg)', border: '2px dashed var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4 }}>
                    <Camera size={28} color="var(--accent)" />
                    <span style={{ fontSize: 10, color: 'var(--ink-muted)', fontFamily: 'Cairo, sans-serif' }}>{t('authartist.photo')}</span>
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: 0, right: 0, left: 0, display: 'flex', justifyContent: 'center' }}>
                  <button type="button" onClick={e => { e.stopPropagation(); photoRef.current?.click() }} style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--ink-secondary)', border: '2px solid var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <ImageIcon size={13} color="#fff" />
                  </button>
                </div>
              </div>
              {photo && (
                <button onClick={() => setPhoto(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--ink-muted)' }}>
                  <X size={13} style={{ marginLeft: 3 }} />{t('authartist.removephoto')}
                </button>
              )}
              <span style={{ fontSize: 12, color: 'var(--ink-placeholder)' }}>{t('authartist.photoopt')}</span>
            </div>

            {/* Name */}
            <div>
              <label style={labelStyle}>{t('authartist.name')} <span style={{ color: '#C0392B' }}>*</span></label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('authartist.nameph')} style={{ ...inputStyle, borderColor: errors.name ? '#C0392B' : '#E8E0D8' }} />
              {errors.name && <p style={errStyle}>{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>{t('auth.email')} <span style={{ color: '#C0392B' }}>*</span></label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" style={{ ...inputStyle, direction: 'ltr', textAlign: 'right', borderColor: errors.email ? '#C0392B' : '#E8E0D8' }} />
              {errors.email && <p style={errStyle}>{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label style={labelStyle}>{t('authartist.phone')} <span style={{ color: '#C0392B' }}>*</span></label>
              <input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+966 5X XXX XXXX" style={{ ...inputStyle, direction: 'ltr', textAlign: 'right', borderColor: errors.phone ? '#C0392B' : '#E8E0D8' }} />
              {errors.phone && <p style={errStyle}>{errors.phone}</p>}
            </div>

            {/* Location */}
            <div>
              <LocationPicker
                value={locationValue}
                onChange={(loc) => {
                  setLocationValue(loc)
                  const parts = [loc.city, loc.countryName].filter(Boolean)
                  setCity(parts.join(', '))
                }}
              />
              {errors.city && <p style={errStyle}>{errors.city}</p>}
            </div>
          </div>
        )}

        {/* ────────────── STEP 2 ────────────── */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink-primary)', margin: '0 0 6px' }}>{t('authartist.craft')}</h2>
              <p style={{ fontSize: 13, color: 'var(--ink-secondary)', margin: 0 }}>{t('authartist.subtitle2')}</p>
            </div>

            {/* Categories */}
            <div>
              <label style={labelStyle}>{t('authartist.specialty')} <span style={{ color: '#C0392B' }}>*</span> <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--ink-muted)' }}>{t('authartist.multiselect')}</span></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {CRAFT_CATEGORIES.map((cat) => {
                  const active = categories.includes(cat)
                  return (
                    <button
                      key={cat}
                      style={pill(active)}
                      onClick={() => setCategories((prev) => active ? prev.filter((c) => c !== cat) : [...prev, cat])}
                    >
                      {active && <Check size={12} style={{ marginLeft: 4 }} />}
                      {t(CRAFT_CATEGORY_KEY[cat] ?? cat)}
                    </button>
                  )
                })}
              </div>
              {errors.categories && <p style={errStyle}>{errors.categories}</p>}
            </div>

            {/* Bio */}
            <div>
              <label style={labelStyle}>{t('authartist.bio')} <span style={{ color: '#C0392B' }}>*</span></label>
              <textarea
                value={bio}
                onChange={(e) => { if (e.target.value.length <= 300) setBio(e.target.value) }}
                rows={5}
                placeholder={t('authartist.bioph')}
                style={{ ...inputStyle, resize: 'none', borderColor: errors.bio ? '#C0392B' : '#E8E0D8' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                {errors.bio ? <p style={{ ...errStyle, margin: 0 }}>{errors.bio}</p> : <span />}
                <span style={{ fontSize: 11, color: bio.length > 250 ? '#C0392B' : '#BBBBBB' }}>{bio.length} / 300</span>
              </div>
            </div>

            {/* Experience */}
            <div>
              <label style={labelStyle}>{t('authartist.experience')} <span style={{ color: '#C0392B' }}>*</span></label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {EXP_OPTIONS.map((opt) => (
                  <button key={opt.value} style={pill(experience === opt.value)} onClick={() => setExperience(opt.value)}>
                    {opt.label}
                  </button>
                ))}
              </div>
              {errors.experience && <p style={errStyle}>{errors.experience}</p>}
            </div>
          </div>
        )}

        {/* ────────────── STEP 3 ────────────── */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink-primary)', margin: '0 0 6px' }}>{t('authartist.step3')}</h2>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#C0392B', margin: '0 0 4px' }}>{t('authartist.portfoliosubtitle')}</p>
              <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: 0 }}>{t('authartist.portfoliohint')}</p>
            </div>

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {portfolio.map((src, i) => (
                <div key={i} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: 10, overflow: 'hidden', background: '#F0E8E0' }}>
                  <img src={src} alt={`work-${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <button
                    onClick={() => setPortfolio((prev) => prev.filter((_, j) => j !== i))}
                    style={{ position: 'absolute', top: 5, left: 5, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                  >
                    <X size={13} color="#fff" />
                  </button>
                </div>
              ))}

              {portfolio.length < 12 && (
                <button
                  onClick={() => portfolioRef.current?.click()}
                  style={{ aspectRatio: '1/1', borderRadius: 10, border: '2px dashed #D0C8C0', background: 'var(--bg-surface)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                >
                  <Plus size={24} color="#C0392B" />
                  <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontFamily: 'Cairo, sans-serif' }}>{t('authartist.portfolioadd')}</span>
                </button>
              )}
            </div>

            <input ref={portfolioRef} type="file" accept="image/*" multiple onChange={handlePortfolioChange} style={{ display: 'none' }} />

            <p style={{ fontSize: 12, color: portfolio.length >= 3 ? '#16A34A' : '#BBBBBB', textAlign: 'center', margin: 0, fontWeight: portfolio.length >= 3 ? 600 : 400 }}>
              {portfolio.length} / 12 {t('authartist.photocount')} {portfolio.length >= 3 ? t('authartist.canproceed') : `${t('authartist.needmorepre')} ${3 - portfolio.length} ${t('authartist.needmoresuf')}`}
            </p>

            {errors.portfolio && <p style={{ ...errStyle, textAlign: 'center' }}>{errors.portfolio}</p>}
          </div>
        )}

        {/* ────────────── STEP 4 ────────────── */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink-primary)', margin: '0 0 6px' }}>{t('authartist.step4')}</h2>
              <p style={{ fontSize: 13, color: 'var(--ink-secondary)', margin: 0 }}>{t('authartist.reviewsubtitle')}</p>
            </div>

            {/* Summary card */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid #E8E0D8', borderRadius: 16, overflow: 'hidden' }}>
              {/* Header strip */}
              <div style={{ background: 'var(--accent)', padding: '18px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.35)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {photo
                    ? <img src={photo} alt={t('authartist.photo')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{name.charAt(0)}</span>
                  }
                </div>
                <div>
                  <p style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: '0 0 2px' }}>{name}</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', margin: 0 }}>{city}</p>
                </div>
              </div>

              {[
                { label: t('auth.email'),              value: email },
                { label: t('authartist.phonefield'),   value: phone },
                { label: t('authartist.specialties'),  value: categories.join(' · ') || '—' },
                { label: t('authartist.yearsfield'),   value: EXP_OPTIONS.find((o) => o.value === experience)?.label ?? '—' },
                { label: t('authartist.workscount'),   value: `${portfolio.length} ${t('authartist.photocount')}` },
              ].map(({ label: l, value: v }) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', borderBottom: '1px solid #F5F0EB' }}>
                  <span style={{ fontSize: 13, color: 'var(--ink-secondary)' }}>{l}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)', maxWidth: '60%', textAlign: 'left', wordBreak: 'break-all' }}>{v}</span>
                </div>
              ))}

              <div style={{ padding: '12px 16px' }}>
                <p style={{ fontSize: 11, color: 'var(--ink-muted)', margin: '0 0 5px' }}>{t('authartist.biofield')}</p>
                <p style={{ fontSize: 13, color: 'var(--ink-primary)', margin: 0, lineHeight: 1.65 }}>{bio}</p>
              </div>
            </div>

            {/* Portfolio strip */}
            <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
              {portfolio.slice(0, 7).map((src, i) => (
                <div key={i} style={{ width: 68, height: 68, flexShrink: 0, borderRadius: 10, overflow: 'hidden', background: '#F0E8E0' }}>
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              ))}
              {portfolio.length > 7 && (
                <div style={{ width: 68, height: 68, flexShrink: 0, borderRadius: 10, background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--ink-secondary)', fontWeight: 600 }}>+{portfolio.length - 7}</span>
                </div>
              )}
            </div>

            {/* Terms */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
              <div
                onClick={() => setAgreed((a) => !a)}
                style={{ width: 24, height: 24, borderRadius: 7, border: agreed ? 'none' : `2px solid ${errors.agreed ? '#C0392B' : 'var(--border)'}`, background: agreed ? '#C0392B' : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, cursor: 'pointer', transition: 'background 0.15s' }}
              >
                {agreed && <Check size={14} color="#fff" />}
              </div>
              <span style={{ fontSize: 13, color: 'var(--ink-secondary)', lineHeight: 1.65 }}>
                {t('authartist.termsagree')}{' '}
                <span style={{ color: '#C0392B', fontWeight: 600 }}>{t('authartist.termslink')}</span>
                {' '}{t('authartist.termssuffix')}
              </span>
            </label>
            {errors.agreed && <p style={errStyle}>{errors.agreed}</p>}
          </div>
        )}

        {/* ── CTA button ── */}
        <button
          onClick={step < 4 ? goNext : handleSubmit}
          disabled={submitting}
          style={{ width: '100%', marginTop: 32, background: submitting ? '#E8E0D8' : '#C0392B', color: submitting ? '#999' : '#FFFFFF', border: 'none', borderRadius: 14, padding: '15px 20px', fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'Cairo, sans-serif', transition: 'background 0.15s' }}
        >
          {step < 4
            ? t('authartist.next')
            : submitting
              ? t('authartist.submitting')
              : t('authartist.submit')}
        </button>
      </div>
    </div>
  )
}
