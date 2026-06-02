'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, MapPin, Edit3, Check, X, LogOut, Star, Package, ShoppingBag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ArtistNav } from '@/components/nav/ArtistNav'
import { Skel } from '@/components/ui/Skel'
import { toast } from '@/components/ui/Toast'
import { useTranslation, useAppSettings } from '@/lib/theme'
import { LocationPicker } from '@/components/ui/LocationPicker'
import { RoleSwitchSheet } from '@/components/ui/RoleSwitchSheet'

const CATEGORIES = ['خط عربي', 'رسم', 'فخار', 'كروشيه', 'نحت']

const CATEGORY_IMAGES: Record<string, string> = {
  'خط عربي': 'https://images.unsplash.com/photo-1596548438137-d51ea5c83ca5?w=800&q=80',
  'رسم': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80',
  'فخار': 'https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=800&q=80',
  'كروشيه': 'https://images.unsplash.com/photo-1615486511484-92e172cc4b0f?w=800&q=80',
  'نحت': 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=800&q=80',
}

const CAT_KEY: Record<string, string> = {
  'خط عربي': 'cat.calligraphy',
  'رسم':     'cat.painting',
  'فخار':    'cat.pottery',
  'كروشيه':  'cat.crochet',
  'نحت':     'cat.sculpture',
}

export default function ArtistProfilePage() {
  const router = useRouter()
  const t = useTranslation()
  const { lang } = useAppSettings()
  const supabase = useMemo(() => createClient(), [])

  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [city, setCity] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [yearsExp, setYearsExp] = useState(0)
  const [rating, setRating] = useState(0)
  const [ordersCount, setOrdersCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [profileId, setProfileId] = useState('')

  const [editingBio, setEditingBio] = useState(false)
  const [editingCity, setEditingCity] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [tempBio, setTempBio] = useState('')
  const [tempCity, setTempCity] = useState('')
  const [tempName, setTempName] = useState('')
  const [saving, setSaving] = useState(false)
  const [showRoleSwitch, setShowRoleSwitch] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }
        setUserId(user.id)
        const [{ data: userData }, { data: profile }] = await Promise.all([
          supabase.from('users').select('name').eq('id', user.id).single(),
          supabase.from('artist_profiles').select('id, bio, city, categories, years_experience, rating_avg, orders_count').eq('user_id', user.id).single(),
        ])
        setName(userData?.name ?? '')
        if (profile) {
          setProfileId(profile.id as string)
          setBio(profile.bio ?? '')
          setCity(profile.city ?? '')
          setCategories(profile.categories ?? [])
          setYearsExp(profile.years_experience ?? 0)
          setRating(profile.rating_avg ?? 0)
          setOrdersCount(profile.orders_count ?? 0)
        }
      } catch { toast.error(t('aprofile.errload')) }
      finally { setLoading(false) }
    }
    load()
  }, [supabase, t])

  async function saveName() {
    if (!tempName.trim()) return
    setSaving(true)
    try {
      await supabase.from('users').update({ name: tempName.trim() }).eq('id', userId)
      setName(tempName.trim()); setEditingName(false)
      toast.success(t('aprofile.savename'))
    } catch { toast.error(t('aprofile.errsave')) }
    finally { setSaving(false) }
  }

  async function saveBio() {
    setSaving(true)
    try {
      await supabase.from('artist_profiles').update({ bio: tempBio.trim() || null }).eq('id', profileId)
      setBio(tempBio.trim()); setEditingBio(false)
      toast.success(t('aprofile.savebio'))
    } catch { toast.error(t('aprofile.errsave')) }
    finally { setSaving(false) }
  }

  async function saveCity(val?: string) {
    const cityVal = val ?? tempCity
    setSaving(true)
    try {
      await supabase.from('artist_profiles').update({ city: cityVal || null }).eq('id', profileId)
      setCity(cityVal); setEditingCity(false)
      toast.success(t('aprofile.savecity'))
    } catch { toast.error(t('general.error')) }
    finally { setSaving(false) }
  }

  async function toggleCategory(cat: string) {
    const updated = categories.includes(cat)
      ? categories.filter(c => c !== cat)
      : [...categories, cat]
    try {
      await supabase.from('artist_profiles').update({ categories: updated }).eq('id', profileId)
      setCategories(updated)
    } catch { toast.error(t('aprofile.errupdate')) }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  const heroImage = CATEGORY_IMAGES[categories[0]] ?? null

  if (loading) {
    return (
      <div style={{ maxWidth: 430, margin: '0 auto', background: 'var(--bg-page)', minHeight: '100dvh', direction: 'rtl', paddingBottom: 80 }}>
        <div style={{ height: 200, background: 'var(--skeleton)' }} />
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Skel w={120} h={20} />
          <Skel h={14} />
          <Skel w="80%" h={14} />
        </div>
      </div>
    )
  }

  if (!userId) {
    return (
      <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100dvh', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, direction: 'rtl' }}>
        <div style={{ fontSize: 48 }}>🎨</div>
        <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-primary)', margin: 0 }}>{t('profile.notloggedin')}</p>
        <button onClick={() => router.push('/auth/artist')} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-lg)', padding: '14px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
          {t('profile.signin')}
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', background: 'var(--bg-page)', minHeight: '100dvh', direction: 'rtl', paddingBottom: 80 }}>

      {/* Hero */}
      <div style={{ position: 'relative', height: 200, background: 'var(--img-placeholder)', overflow: 'hidden' }}>
        {heroImage && <img src={heroImage} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)' }} />
        <div style={{ position: 'absolute', top: 48, left: 16, display: 'flex', gap: 8 }}>
          <button onClick={handleSignOut} style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: 'none', borderRadius: 'var(--radius-md)', padding: '8px 14px', fontSize: 12, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <LogOut size={14} /> {t('aprofile.signout')}
          </button>
          <button onClick={() => setShowRoleSwitch(true)} style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: 'none', borderRadius: 'var(--radius-md)', padding: '8px 14px', fontSize: 12, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <ShoppingBag size={14} /> {lang === 'en' ? 'Client mode' : 'وضع العميل'}
          </button>
        </div>
      </div>

      {/* Avatar + name */}
      <div style={{ background: 'var(--bg-surface)', padding: '0 20px 20px', borderBottom: '1px solid var(--border)', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginTop: -32 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--avatar-bg)', border: '3px solid var(--bg-surface)', boxShadow: 'var(--shadow-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>{name.charAt(0)}</span>
            <button style={{ position: 'absolute', bottom: 0, left: 0, width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Camera size={10} color="#fff" />
            </button>
          </div>
          <div style={{ flex: 1, paddingBottom: 4 }}>
            {editingName ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input value={tempName} onChange={e => setTempName(e.target.value)} style={{ flex: 1, border: '1.5px solid var(--accent)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', fontSize: 15, fontWeight: 700, color: 'var(--ink-primary)', outline: 'none', background: 'var(--bg-page)', direction: 'rtl' }} onKeyDown={e => e.key === 'Enter' && saveName()} autoFocus />
                <button onClick={saveName} disabled={saving} style={{ background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', padding: 6, cursor: 'pointer', display: 'flex', color: '#fff' }}>
                  <Check size={14} />
                </button>
                <button onClick={() => setEditingName(false)} style={{ background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 6, cursor: 'pointer', display: 'flex', color: 'var(--ink-muted)' }}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => { setTempName(name); setEditingName(true) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', display: 'flex', padding: 2 }}>
                  <Edit3 size={14} />
                </button>
                <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-primary)', margin: 0 }}>{name}</p>
              </div>
            )}
            {city && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <MapPin size={12} color="var(--ink-muted)" />
                <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{city}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
        {[
          { icon: Star,    value: rating.toFixed(1),       label: t('artist.rating'),     color: 'var(--warning)' },
          { icon: Package, value: ordersCount.toString(),  label: t('aprofile.completed'), color: 'var(--success)' },
          { icon: Camera,  value: `${yearsExp} ${t('artist.years')}`, label: t('artist.experience'), color: 'var(--info)' },
        ].map(({ icon: Icon, value, label, color }, i) => (
          <div key={label} style={{ padding: '14px 8px', textAlign: 'center', borderLeft: i < 2 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 2 }}>
              <Icon size={13} color={color} />
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-primary)', margin: 0 }}>{value}</p>
            </div>
            <p style={{ fontSize: 10, color: 'var(--ink-muted)', margin: 0 }}>{label}</p>
          </div>
        ))}
      </div>

      <div style={{ padding: '16px' }}>

        {/* Bio */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <button onClick={() => { setTempBio(bio); setEditingBio(true) }} style={{ background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '4px 10px', fontSize: 12, color: 'var(--ink-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Edit3 size={12} /> {t('general.edit')}
            </button>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-primary)' }}>{t('artist.about')}</span>
          </div>
          {editingBio ? (
            <div>
              <textarea value={tempBio} onChange={e => setTempBio(e.target.value)} rows={4} style={{ width: '100%', border: '1.5px solid var(--accent)', borderRadius: 'var(--radius-md)', padding: '10px 12px', fontSize: 13, color: 'var(--ink-primary)', resize: 'none', outline: 'none', direction: 'rtl', lineHeight: 1.7, boxSizing: 'border-box', fontFamily: 'Cairo, sans-serif', background: 'var(--bg-page)' }} autoFocus />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={saveBio} disabled={saving} style={{ flex: 1, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Check size={14} /> {t('general.save')}
                </button>
                <button onClick={() => setEditingBio(false)} style={{ flex: 1, background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px', fontSize: 13, cursor: 'pointer', color: 'var(--ink-secondary)' }}>
                  {t('general.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: bio ? 'var(--ink-secondary)' : 'var(--ink-placeholder)', lineHeight: 1.7, margin: 0 }}>
              {bio || t('aprofile.addbioph')}
            </p>
          )}
        </div>

        {/* City */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              {editingCity ? (
                <div>
                  <LocationPicker
                    value={{}}
                    onChange={(loc) => {
                      const parts = [loc.city, loc.stateName, loc.countryName].filter(Boolean)
                      const display = parts.join(', ')
                      setTempCity(display)
                      if (display) saveCity(display)
                    }}
                    placeholder={tempCity || undefined}
                  />
                  <button onClick={() => setEditingCity(false)} style={{ marginTop: 8, background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px 12px', fontSize: 12, color: 'var(--ink-secondary)', cursor: 'pointer' }}>{t('general.cancel')}</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={16} color="var(--ink-muted)" />
                  <span style={{ fontSize: 14, color: city ? 'var(--ink-primary)' : 'var(--ink-placeholder)' }}>{city || t('aprofile.addcity')}</span>
                </div>
              )}
            </div>
            {!editingCity && (
              <button onClick={() => { setTempCity(city); setEditingCity(true) }} style={{ background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '4px 10px', fontSize: 12, color: 'var(--ink-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginRight: 8 }}>
                <Edit3 size={12} /> {t('general.edit')}
              </button>
            )}
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-primary)' }}>{t('aprofile.city')}</span>
          </div>
        </div>

        {/* Categories */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-primary)', margin: '0 0 12px', textAlign: 'right' }}>{t('aprofile.categories')}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, direction: 'rtl' }}>
            {CATEGORIES.map(cat => {
              const active = categories.includes(cat)
              return (
                <button key={cat} onClick={() => toggleCategory(cat)} style={{ padding: '8px 16px', borderRadius: 'var(--radius-pill)', border: active ? 'none' : '1px solid var(--border)', background: active ? 'var(--accent)' : 'var(--bg-page)', color: active ? '#fff' : 'var(--ink-secondary)', fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s', boxShadow: active ? '0 2px 8px rgba(192,57,43,0.2)' : 'none' }}>
                  {t(CAT_KEY[cat])}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {showRoleSwitch && (
        <RoleSwitchSheet currentRole="artist" onClose={() => setShowRoleSwitch(false)} />
      )}

      <ArtistNav />
    </div>
  )
}
