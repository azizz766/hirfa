'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { User, Settings, Edit2, Check, X, LogOut, ChevronLeft, Bell, BellOff, Palette, Search, Package, FileText, MessageCircle, ArrowUpRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ClientNav } from '@/components/nav/ClientNav'
import { Skel } from '@/components/ui/Skel'
import { toast } from '@/components/ui/Toast'
import { useAppSettings, useTranslation } from '@/lib/theme'
import { RoleSwitchSheet } from '@/components/ui/RoleSwitchSheet'

type Profile = {
  name: string
  email: string
}

// ─── Settings Sheet (unchanged) ───────────────────────────────

function SettingsSheet({
  onClose,
  onSignOut,
  onSwitchRole,
}: {
  onClose: () => void
  onSignOut: () => void
  onSwitchRole: () => void
}) {
  const { theme, lang, notifs, setTheme, setLang, setNotifs } = useAppSettings()
  const t = useTranslation()
  const touchStartY = useRef<number>(0)
  const sheetRef = useRef<HTMLDivElement>(null)

  function onTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY
  }
  function onTouchEnd(e: React.TouchEvent) {
    const delta = e.changedTouches[0].clientY - touchStartY.current
    if (delta > 80) onClose()
  }

  const pillBtn = (active: boolean): React.CSSProperties => ({
    padding: '7px 16px',
    borderRadius: 'var(--radius-xl)',
    border: active ? 'none' : '1px solid var(--border)',
    background: active ? 'var(--accent)' : 'var(--bg-surface)',
    color: active ? '#FFFFFF' : 'var(--ink-secondary)',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    fontFamily: 'Cairo, sans-serif',
  })

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 0',
    borderBottom: '1px solid var(--border)',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--ink-primary)',
  }

  const subStyle: React.CSSProperties = {
    fontSize: 11,
    color: 'var(--ink-muted)',
    marginTop: 2,
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 40 }} />
      <div
        ref={sheetRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 430, background: 'var(--bg-surface)',
          borderRadius: '20px 20px 0 0', zIndex: 41,
          fontFamily: 'Cairo, sans-serif', direction: 'rtl', paddingBottom: 40,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 16px' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', display: 'flex', padding: 4 }}>
            <X size={20} />
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-primary)' }}>{t('settings.title')}</span>
          <div style={{ width: 28 }} />
        </div>

        <div style={{ padding: '0 20px' }}>
          <div style={rowStyle}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={pillBtn(lang === 'ar')} onClick={() => setLang('ar')}>عربي</button>
              <button style={pillBtn(lang === 'en')} onClick={() => setLang('en')}>English</button>
            </div>
            <div>
              <p style={labelStyle}>{t('settings.lang')}</p>
              <p style={subStyle}>Language</p>
            </div>
          </div>

          <div style={rowStyle}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={pillBtn(theme === 'light')} onClick={() => setTheme('light')}>{t('settings.light')}</button>
              <button style={pillBtn(theme === 'dark')} onClick={() => setTheme('dark')}>{t('settings.dark')}</button>
              <button style={pillBtn(theme === 'auto')} onClick={() => setTheme('auto')}>{t('settings.auto')}</button>
            </div>
            <div>
              <p style={labelStyle}>{t('settings.theme')}</p>
              <p style={subStyle}>Theme</p>
            </div>
          </div>

          <div style={rowStyle}>
            <button
              onClick={() => setNotifs(!notifs)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', color: notifs ? 'var(--success)' : 'var(--ink-muted)' }}
            >
              {notifs ? <Bell size={18} /> : <BellOff size={18} />}
              <div style={{ width: 44, height: 26, borderRadius: 13, background: notifs ? 'var(--accent)' : 'var(--border)', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 3, left: notifs ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: 'var(--bg-surface)', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .2s' }} />
              </div>
            </button>
            <div>
              <p style={labelStyle}>{t('settings.notifs')}</p>
              <p style={subStyle}>Notifications</p>
            </div>
          </div>

          <div style={{ ...rowStyle, cursor: 'pointer' }} onClick={onSwitchRole}>
            <Palette size={18} color="var(--accent)" />
            <div>
              <p style={{ ...labelStyle, color: 'var(--accent)', margin: 0 }}>{lang === 'en' ? 'Switch to Artist mode' : 'التحويل لوضع الفنان'}</p>
              <p style={{ ...subStyle, margin: 0 }}>{lang === 'en' ? 'Start selling your art' : 'ابدأ بيع أعمالك'}</p>
            </div>
          </div>

          <div style={{ ...rowStyle, cursor: 'pointer' }} onClick={() => toast.info(t('settings.termswip'))}>
            <ChevronLeft size={16} color="var(--ink-muted)" />
            <div>
              <p style={labelStyle}>{t('settings.terms')}</p>
              <p style={subStyle}>Terms &amp; Conditions</p>
            </div>
          </div>

          <button
            onClick={onSignOut}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}
          >
            <LogOut size={18} color="var(--accent)" />
            <div style={{ textAlign: 'right' }}>
              <p style={{ ...labelStyle, color: 'var(--accent)', margin: 0 }}>{t('settings.signout')}</p>
              <p style={{ ...subStyle, margin: 0 }}>Sign out</p>
            </div>
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────

export default function ClientProfilePage() {
  const router = useRouter()
  const t = useTranslation()
  const { lang } = useAppSettings()
  const supabase = useMemo(() => createClient(), [])

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showRoleSwitch, setShowRoleSwitch] = useState(false)
  const [totalOrders, setTotalOrders] = useState(0)
  const [activeOrders, setActiveOrders] = useState(0)

  const [hour] = useState(new Date().getHours())
  const greeting = lang === 'en'
    ? hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
    : hour < 12 ? 'صباح الخير' : hour < 18 ? 'مساء الخير' : 'مساء النور'

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const [{ data: userData }, { data: orders }] = await Promise.all([
        supabase.from('users').select('name').eq('id', user.id).single(),
        supabase.from('orders').select('id, status').eq('client_id', user.id),
      ])

      setProfile({
        name: (userData?.name as string) ?? user.email?.split('@')[0] ?? 'مستخدم',
        email: user.email ?? '',
      })

      const allOrders = orders ?? []
      setTotalOrders(allOrders.length)
      setActiveOrders(allOrders.filter(o => ['pending', 'accepted', 'in_progress'].includes(o.status as string)).length)
      setLoading(false)
    }
    load()
  }, [supabase])

  function startEditName() {
    setNameInput(profile?.name ?? '')
    setEditingName(true)
  }

  async function saveName() {
    if (!nameInput.trim()) return
    setSavingName(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('users').update({ name: nameInput.trim() }).eq('id', user.id)
      setProfile(prev => prev ? { ...prev, name: nameInput.trim() } : prev)
    }
    setSavingName(false)
    setEditingName(false)
    toast.success(lang === 'en' ? 'Name updated ✓' : 'تم تحديث الاسم ✓')
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const firstLetter = profile?.name.charAt(0) ?? '؟'

  const QUICK_ACTIONS = [
    { icon: Search,      label: lang === 'en' ? 'Browse Artists' : 'تصفح الفنانين', path: '/client/discover',  color: 'var(--accent)',   bg: 'var(--accent-light)' },
    { icon: Package,     label: lang === 'en' ? 'My Orders'      : 'طلباتي',         path: '/client/my-orders', color: 'var(--info)',     bg: 'var(--info-bg)' },
    { icon: FileText,    label: lang === 'en' ? 'Post Brief'     : 'نشر بريف',       path: '/client/briefs/new', color: 'var(--success)', bg: 'var(--success-bg)' },
    { icon: MessageCircle, label: lang === 'en' ? 'Messages'     : 'الرسائل',        path: '/client/messages',  color: 'var(--warning)',  bg: 'var(--warning-bg)' },
  ]

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', background: 'var(--bg-page)', minHeight: '100dvh', direction: lang === 'ar' ? 'rtl' : 'ltr', fontFamily: 'Cairo, sans-serif', paddingBottom: 100 }}>

      {/* ── Hero Header ── */}
      <div style={{ background: 'var(--accent)', padding: '48px 20px 28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />

        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, position: 'relative' }}>
          <button
            onClick={() => setShowSettings(true)}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 'var(--radius-md)', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Settings size={18} color="#fff" />
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
            {lang === 'en' ? 'My Profile' : 'ملفي الشخصي'}
          </span>
          <div style={{ width: 36 }} />
        </div>

        {/* Avatar + name */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, position: 'relative' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {loading
              ? <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
              : <span style={{ fontSize: 32, fontWeight: 800, color: '#fff' }}>{firstLetter}</span>
            }
          </div>

          {editingName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => setEditingName(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#fff', display: 'flex', padding: 6 }}>
                <X size={16} />
              </button>
              <input
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveName()}
                autoFocus
                style={{ textAlign: 'center', border: 'none', borderBottom: '2px solid rgba(255,255,255,0.6)', outline: 'none', fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: 'Cairo, sans-serif', background: 'transparent', width: 160 }}
              />
              <button onClick={saveName} disabled={savingName} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#fff', display: 'flex', padding: 6 }}>
                <Check size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {loading
                ? <div style={{ width: 120, height: 22, background: 'rgba(255,255,255,0.2)', borderRadius: 4 }} />
                : <>
                    <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{profile?.name}</span>
                    <button onClick={startEditName} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#fff', display: 'flex', padding: 5 }}>
                      <Edit2 size={13} />
                    </button>
                  </>
              }
            </div>
          )}

          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: 0 }}>{greeting}</p>
          {profile && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: 0, direction: 'ltr' }}>{profile.email}</p>}
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '16px 16px 0' }}>
        {[
          { label: lang === 'en' ? 'Total Orders' : 'إجمالي الطلبات', value: totalOrders, color: 'var(--accent)' },
          { label: lang === 'en' ? 'Active Orders' : 'الطلبات النشطة', value: activeOrders, color: 'var(--info)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', textAlign: 'center' }}>
            {loading
              ? <div style={{ height: 28, background: 'var(--border)', borderRadius: 4, marginBottom: 6 }} />
              : <p style={{ fontSize: 28, fontWeight: 800, color, margin: '0 0 4px', letterSpacing: -1 }}>{value}</p>
            }
            <p style={{ fontSize: 11, color: 'var(--ink-muted)', margin: 0 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div style={{ padding: '16px 16px 0' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-secondary)', margin: '0 0 10px', textAlign: lang === 'ar' ? 'right' : 'left' }}>
          {lang === 'en' ? 'Quick Actions' : 'إجراءات سريعة'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {QUICK_ACTIONS.map(({ icon: Icon, label, path, color, bg }) => (
            <button
              key={path}
              onClick={() => router.push(path)}
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 14px', cursor: 'pointer', textAlign: lang === 'ar' ? 'right' : 'left', display: 'flex', flexDirection: 'column', gap: 10, transition: 'transform 0.1s' }}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
              onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
              onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={color} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)', margin: 0 }}>{label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Recent Activity Links ── */}
      <div style={{ padding: '16px 16px 0' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-secondary)', margin: '0 0 10px', textAlign: lang === 'ar' ? 'right' : 'left' }}>
          {lang === 'en' ? 'My Account' : 'حسابي'}
        </p>
        <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          {[
            { label: lang === 'en' ? 'My Orders' : 'طلباتي', sub: lang === 'en' ? `${totalOrders} orders` : `${totalOrders} طلب`, path: '/client/my-orders' },
            { label: lang === 'en' ? 'Messages' : 'الرسائل', sub: lang === 'en' ? 'Active chats' : 'المحادثات النشطة', path: '/client/messages' },
            { label: lang === 'en' ? 'Browse Artists' : 'تصفح الفنانين', sub: lang === 'en' ? 'Find your artist' : 'ابحث عن فنانك', path: '/client/discover' },
          ].map(({ label, sub, path }, i, arr) => (
            <div
              key={path}
              onClick={() => router.push(path)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}
            >
              <ChevronLeft size={16} color="var(--ink-muted)" style={{ transform: lang === 'en' ? 'rotate(180deg)' : 'none' }} />
              <div style={{ textAlign: lang === 'ar' ? 'right' : 'left', flex: 1, marginRight: lang === 'ar' ? 0 : 8, marginLeft: lang === 'ar' ? 8 : 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-primary)', margin: '0 0 2px' }}>{label}</p>
                <p style={{ fontSize: 11, color: 'var(--ink-muted)', margin: 0 }}>{loading ? '...' : sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Not logged in state ── */}
      {!loading && !profile && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 32px', gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--bg-page)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={32} color="var(--border)" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink-primary)', margin: '0 0 6px' }}>{t('profile.notloggedin')}</p>
            <p style={{ fontSize: 13, color: 'var(--ink-secondary)', margin: 0 }}>{t('profile.notloggedinhint')}</p>
          </div>
          <button
            onClick={() => router.push('/auth/client')}
            style={{ background: 'var(--accent)', color: '#FFFFFF', border: 'none', borderRadius: 12, padding: '14px 32px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}
          >
            {t('profile.signin')}
          </button>
        </div>
      )}

      {showSettings && (
        <SettingsSheet
          key={lang}
          onClose={() => setShowSettings(false)}
          onSignOut={handleSignOut}
          onSwitchRole={profile
            ? () => { setShowSettings(false); setShowRoleSwitch(true) }
            : () => { toast.error(lang === 'en' ? 'Please sign in first' : 'سجّل دخولك أولاً') }
          }
        />
      )}

      {showRoleSwitch && (
        <RoleSwitchSheet currentRole="client" onClose={() => setShowRoleSwitch(false)} />
      )}

      <ClientNav />
    </div>
  )
}
