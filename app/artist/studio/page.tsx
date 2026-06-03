'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Home, Package, Image, MessageCircle, TrendingUp, Settings,
  Plus, Edit3, Trash2, X, Clock, ChevronLeft, ArrowUpRight,
  LogOut, Check, Link as LinkIcon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Skel } from '@/components/ui/Skel'
import { toast } from '@/components/ui/Toast'
import { useTranslation, useAppSettings } from '@/lib/theme'
import { RoleSwitchSheet } from '@/components/ui/RoleSwitchSheet'
import { LocationPicker } from '@/components/ui/LocationPicker'

type Tab = 'home' | 'orders' | 'portfolio' | 'messages' | 'earnings' | 'settings'

type Order = {
  id: string
  status: string
  description: string
  client_price: number | null
  artist_price: number | null
  currency: string
  created_at: string
  clientName: string
}

type Service = {
  id: string
  name: string
  base_price: number
  currency: string
  delivery_days: number
  description: string | null
}

type PortfolioItem = {
  id: string
  image_url: string
  title: string | null
}

const STATUS_COLOR: Record<string, string> = {
  pending:     'var(--warning)',
  accepted:    'var(--info)',
  in_progress: 'var(--info)',
  completed:   'var(--success)',
  cancelled:   'var(--danger)',
}

const STATUS_BG: Record<string, string> = {
  pending:     'var(--warning-bg)',
  accepted:    'var(--info-bg)',
  in_progress: 'var(--info-bg)',
  completed:   'var(--success-bg)',
  cancelled:   'var(--danger-bg)',
}

const STATUS_LABEL: Record<string, Record<string, string>> = {
  pending:     { ar: 'قيد المراجعة', en: 'Pending' },
  accepted:    { ar: 'مقبول',         en: 'Accepted' },
  in_progress: { ar: 'جارٍ التنفيذ', en: 'In Progress' },
  completed:   { ar: 'مكتمل',         en: 'Completed' },
  cancelled:   { ar: 'ملغى',          en: 'Cancelled' },
}

export default function ArtistStudioPage() {
  const router = useRouter()
  const t = useTranslation()
  const { lang } = useAppSettings()
  const supabase = useMemo(() => createClient(), [])

  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [loading, setLoading] = useState(true)
  const [artistId, setArtistId] = useState('')

  // Profile
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [rating, setRating] = useState(0)
  const [locationValue, setLocationValue] = useState<any>({})

  // Data
  const [orders, setOrders] = useState<Order[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [earnings, setEarnings] = useState(0)
  const [currency, setCurrency] = useState('SAR')
  const [showRoleSwitch, setShowRoleSwitch] = useState(false)

  // Inline price sheet
  const [showPriceSheet, setShowPriceSheet] = useState(false)
  const [pricingOrderId, setPricingOrderId] = useState<string | null>(null)
  const [priceInput, setPriceInput] = useState('')
  const [submittingPrice, setSubmittingPrice] = useState(false)

  // Portfolio inline add
  const [newPortfolioUrl, setNewPortfolioUrl] = useState('')
  const [addingPortfolio, setAddingPortfolio] = useState(false)

  // Service form
  const [showServiceForm, setShowServiceForm] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [svcName, setSvcName] = useState('')
  const [svcPrice, setSvcPrice] = useState('')
  const [svcDays, setSvcDays] = useState('')
  const [svcDesc, setSvcDesc] = useState('')
  const [savingService, setSavingService] = useState(false)
  const [deletingServiceId, setDeletingServiceId] = useState('')
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'active' | 'completed'>('all')

  // Bio editing
  const [editingBio, setEditingBio] = useState(false)
  const [tempBio, setTempBio] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const [hour] = useState(new Date().getHours())
  const greeting = lang === 'en'
    ? hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
    : hour < 12 ? 'صباح الخير' : hour < 18 ? 'مساء الخير' : 'مساء النور'

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.replace('/auth/artist'); return }

        const { data: userData } = await supabase.from('users').select('name').eq('id', user.id).single()
        setName(userData?.name ?? '')

        const { data: profile } = await supabase.from('artist_profiles')
          .select('id, bio, city, categories, rating_avg, years_experience')
          .eq('user_id', user.id).single()

        if (!profile) { setLoading(false); return }
        setArtistId(profile.id as string)
        setBio(profile.bio ?? '')
        setCategories(profile.categories ?? [])
        setRating(profile.rating_avg ?? 0)
        setLocationValue({ city: profile.city ?? '', countryName: '' })

        const [{ data: ordersData }, { data: servicesData }, { data: portfolioData }] = await Promise.all([
          supabase.from('orders').select('id, status, description, client_price, artist_price, currency, created_at, client_id').eq('artist_id', profile.id).order('created_at', { ascending: false }),
          supabase.from('services').select('id, name, base_price, currency, delivery_days, description').eq('artist_id', profile.id).order('created_at', { ascending: true }),
          supabase.from('portfolio_items').select('id, image_url, title').eq('artist_id', profile.id).order('sort_order', { ascending: true }),
        ])

        const allOrders = ordersData ?? []
        const clientIds = [...new Set(allOrders.map(o => o.client_id as string))]
        const { data: clients } = clientIds.length
          ? await supabase.from('users').select('id, name').in('id', clientIds)
          : { data: [] }
        const clientMap = Object.fromEntries((clients ?? []).map(c => [c.id, c.name]))

        setOrders(allOrders.map(o => ({
          id: o.id as string,
          status: o.status as string,
          description: o.description as string,
          client_price: o.client_price as number | null,
          artist_price: o.artist_price as number | null,
          currency: o.currency as string,
          created_at: o.created_at as string,
          clientName: clientMap[o.client_id as string] ?? (lang === 'en' ? 'Client' : 'عميل'),
        })))

        setServices((servicesData ?? []) as Service[])
        setPortfolio((portfolioData ?? []) as PortfolioItem[])

        const completedIds = allOrders.filter(o => o.status === 'completed').map(o => o.id as string)
        if (completedIds.length) {
          const { data: payments } = await supabase.from('payments').select('amount, currency').in('order_id', completedIds).eq('status', 'released')
          setEarnings((payments ?? []).reduce((s, p) => s + (p.amount as number), 0))
          setCurrency((payments ?? [])[0]?.currency ?? 'SAR')
        }
      } catch { toast.error(t('general.error')) }
      finally { setLoading(false) }
    }
    load()
  }, [supabase, router, t, lang])

  // ── Inline price submission ────────────────────────────────────
  async function submitPrice() {
    if (!priceInput || !pricingOrderId) return
    const parsed = parseFloat(priceInput)
    if (isNaN(parsed) || parsed <= 0) {
      toast.error(lang === 'en' ? 'Enter a valid price' : 'أدخل سعراً صحيحاً')
      return
    }
    setSubmittingPrice(true)
    try {
      await supabase.from('orders')
        .update({ artist_price: parsed, status: 'accepted' })
        .eq('id', pricingOrderId)
      setOrders(prev => prev.map(o =>
        o.id === pricingOrderId ? { ...o, artist_price: parsed, status: 'accepted' } : o
      ))
      toast.success(lang === 'en' ? 'Price sent ✓' : 'تم إرسال السعر ✓')
      setShowPriceSheet(false)
      setPricingOrderId(null)
      setPriceInput('')
    } catch { toast.error(t('general.error')) }
    finally { setSubmittingPrice(false) }
  }

  // ── Portfolio ──────────────────────────────────────────────────
  async function addPortfolioItem() {
    const url = newPortfolioUrl.trim()
    if (!url) return
    setAddingPortfolio(true)
    try {
      const { data, error } = await supabase.from('portfolio_items')
        .insert({ artist_id: artistId, image_url: url })
        .select('id, image_url, title').single()
      if (error) throw error
      setPortfolio(prev => [...prev, data as PortfolioItem])
      setNewPortfolioUrl('')
      toast.success(lang === 'en' ? 'Added ✓' : 'تمت الإضافة ✓')
    } catch { toast.error(t('general.error')) }
    finally { setAddingPortfolio(false) }
  }

  async function removePortfolioItem(id: string) {
    if (!confirm(lang === 'en' ? 'Remove this image?' : 'حذف هذه الصورة؟')) return
    try {
      await supabase.from('portfolio_items').delete().eq('id', id)
      setPortfolio(prev => prev.filter(p => p.id !== id))
      toast.success(lang === 'en' ? 'Removed' : 'تم الحذف')
    } catch { toast.error(t('general.error')) }
  }

  // ── Service CRUD ───────────────────────────────────────────────
  async function saveService() {
    if (!svcName.trim() || !svcPrice) {
      toast.error(lang === 'en' ? 'Fill required fields' : 'أكمل الحقول المطلوبة')
      return
    }
    setSavingService(true)
    try {
      const data = {
        artist_id: artistId,
        name: svcName.trim(),
        base_price: parseFloat(svcPrice),
        currency: 'SAR',
        delivery_days: parseInt(svcDays) || 7,
        description: svcDesc.trim() || null,
      }
      if (editingService) {
        const { data: updated } = await supabase.from('services').update(data).eq('id', editingService.id).select().single()
        setServices(prev => prev.map(s => s.id === editingService.id ? updated as Service : s))
        toast.success(lang === 'en' ? 'Service updated ✓' : 'تم تحديث الخدمة ✓')
      } else {
        const { data: created } = await supabase.from('services').insert(data).select().single()
        setServices(prev => [...prev, created as Service])
        toast.success(lang === 'en' ? 'Service added ✓' : 'تمت إضافة الخدمة ✓')
      }
      setShowServiceForm(false)
      setEditingService(null)
      setSvcName(''); setSvcPrice(''); setSvcDays(''); setSvcDesc('')
    } catch { toast.error(t('general.error')) }
    finally { setSavingService(false) }
  }

  async function deleteService(id: string) {
    if (!confirm(lang === 'en' ? 'Delete this service?' : 'حذف هذه الخدمة؟')) return
    setDeletingServiceId(id)
    try {
      await supabase.from('services').delete().eq('id', id)
      setServices(prev => prev.filter(s => s.id !== id))
      toast.success(lang === 'en' ? 'Deleted' : 'تم الحذف')
    } catch { toast.error(t('general.error')) }
    finally { setDeletingServiceId('') }
  }

  async function saveBio() {
    setSavingProfile(true)
    try {
      await supabase.from('artist_profiles').update({ bio: tempBio.trim() || null }).eq('id', artistId)
      setBio(tempBio.trim())
      setEditingBio(false)
      toast.success(lang === 'en' ? 'Saved ✓' : 'تم الحفظ ✓')
    } catch { toast.error(t('general.error')) }
    finally { setSavingProfile(false) }
  }

  async function toggleCategory(cat: string) {
    const updated = categories.includes(cat)
      ? categories.filter(c => c !== cat)
      : [...categories, cat]
    try {
      await supabase.from('artist_profiles').update({ categories: updated }).eq('id', artistId)
      setCategories(updated)
    } catch { toast.error(t('general.error')) }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  const pendingOrders = orders.filter(o => o.status === 'pending')
  const activeOrders = orders.filter(o => ['accepted', 'in_progress'].includes(o.status))
  const conversationOrders = orders.filter(o => ['accepted', 'in_progress', 'completed'].includes(o.status))
  const filteredOrders = orderFilter === 'pending'   ? pendingOrders
                       : orderFilter === 'active'    ? activeOrders
                       : orderFilter === 'completed' ? orders.filter(o => o.status === 'completed')
                       : orders

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--bg-page)', border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-md)', padding: '11px 14px', fontSize: 14,
    color: 'var(--ink-primary)', outline: 'none', boxSizing: 'border-box',
    direction: lang === 'ar' ? 'rtl' : 'ltr', fontFamily: 'Cairo, sans-serif', transition: 'border-color 0.15s',
  }

  const TABS: { key: Tab; icon: typeof Home; label: string }[] = [
    { key: 'home',      icon: Home,           label: lang === 'en' ? 'Home'     : 'الرئيسية' },
    { key: 'orders',    icon: Package,         label: lang === 'en' ? 'Orders'   : 'الطلبات' },
    { key: 'portfolio', icon: Image,           label: lang === 'en' ? 'Works'    : 'الأعمال' },
    { key: 'messages',  icon: MessageCircle,   label: lang === 'en' ? 'Messages' : 'الرسائل' },
    { key: 'earnings',  icon: TrendingUp,      label: lang === 'en' ? 'Earnings' : 'الأرباح' },
    { key: 'settings',  icon: Settings,        label: lang === 'en' ? 'Settings' : 'الإعدادات' },
  ]

  const CATS = [
    { ar: 'خط عربي', en: 'Calligraphy' },
    { ar: 'رسم',     en: 'Painting'    },
    { ar: 'فخار',    en: 'Pottery'     },
    { ar: 'كروشيه',  en: 'Crochet'     },
    { ar: 'نحت',     en: 'Sculpture'   },
  ]

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', background: 'var(--bg-page)', minHeight: '100dvh', direction: lang === 'ar' ? 'rtl' : 'ltr', paddingBottom: 120 }}>

      {/* ── Studio Header ── */}
      <div style={{ background: 'var(--accent)', padding: '48px 20px 16px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
          <button onClick={handleSignOut} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 'var(--radius-md)', padding: '8px 12px', fontSize: 11, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600, minHeight: 36 }}>
            <LogOut size={13} /> {lang === 'en' ? 'Exit' : 'خروج'}
          </button>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: '0 0 2px' }}>{greeting}</p>
            {loading
              ? <div style={{ width: 100, height: 16, background: 'rgba(255,255,255,0.2)', borderRadius: 4 }} />
              : <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>{name}</p>}
          </div>
          <button onClick={() => setShowRoleSwitch(true)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 'var(--radius-md)', padding: '8px 12px', fontSize: 11, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600, minHeight: 36 }}>
            {lang === 'en' ? 'Client' : 'عميل'} →
          </button>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', display: 'flex', overflowX: 'auto', position: 'sticky', top: 0, zIndex: 10, scrollbarWidth: 'none' }}>
        {TABS.map(({ key, icon: Icon, label }) => {
          const active = activeTab === key
          return (
            <button key={key} onClick={() => setActiveTab(key)} style={{ flex: '0 0 auto', padding: '12px 16px', background: 'none', border: 'none', borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, transition: 'all 0.15s', minWidth: 70, minHeight: 56 }}>
              <Icon size={18} color={active ? 'var(--accent)' : 'var(--ink-muted)'} />
              <span style={{ fontSize: 10, color: active ? 'var(--accent)' : 'var(--ink-muted)', fontWeight: active ? 700 : 400, whiteSpace: 'nowrap' }}>{label}</span>
            </button>
          )
        })}
      </div>

      {/* ── Tab Content ── */}
      <div style={{ padding: 16 }}>

        {/* ───────── HOME TAB ───────── */}
        {activeTab === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                { label: lang === 'en' ? 'Earnings' : 'الأرباح',  value: earnings.toLocaleString('en-US'), color: 'var(--warning)' },
                { label: lang === 'en' ? 'Active'   : 'نشط',      value: activeOrders.length.toString(),   color: 'var(--info)' },
                { label: lang === 'en' ? 'Rating'   : 'التقييم',  value: rating > 0 ? rating.toFixed(1) : (lang === 'en' ? 'New' : 'جديد'), color: 'var(--success)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '12px 10px', textAlign: 'center' }}>
                  {loading
                    ? <div style={{ marginBottom: 4 }}><Skel h={22} r={4} /></div>
                    : <p style={{ fontSize: 18, fontWeight: 800, color, margin: '0 0 2px', letterSpacing: -0.5 }}>{value}</p>}
                  <p style={{ fontSize: 10, color: 'var(--ink-muted)', margin: 0 }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Pending orders needing price */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <button onClick={() => setActiveTab('orders')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, padding: 0, minHeight: 36 }}>
                  {lang === 'en' ? 'View all' : 'عرض الكل'} <ArrowUpRight size={13} />
                </button>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-primary)', margin: 0 }}>
                  {lang === 'en' ? 'Needs Pricing' : 'تنتظر التسعير'}
                  {!loading && pendingOrders.length > 0 && (
                    <span style={{ marginRight: 6, background: 'var(--accent)', color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>{pendingOrders.length}</span>
                  )}
                </h3>
              </div>

              {loading ? (
                [0, 1].map(i => <div key={i} style={{ marginBottom: 8 }}><Skel h={72} r={12} /></div>)
              ) : pendingOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: 0 }}>✨ {lang === 'en' ? 'All caught up!' : 'لا طلبات معلقة'}</p>
                </div>
              ) : pendingOrders.slice(0, 3).map(o => (
                <div
                  key={o.id}
                  onClick={() => { setPricingOrderId(o.id); setPriceInput(''); setShowPriceSheet(true) }}
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '12px 14px', marginBottom: 8, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                >
                  <div style={{ position: 'absolute', top: 0, [lang === 'ar' ? 'right' : 'left']: 0, width: 3, height: '100%', background: 'var(--accent)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, background: 'var(--accent-light)', borderRadius: 20, padding: '2px 8px' }}>{lang === 'en' ? 'Set Price' : 'سعّر'}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)' }}>{o.clientName}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--ink-secondary)', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>{o.description}</p>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={() => setActiveTab('portfolio')} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16, cursor: 'pointer', textAlign: lang === 'ar' ? 'right' : 'left', minHeight: 90 }}>
                <Image size={20} color="var(--ink-secondary)" style={{ marginBottom: 8, display: 'block' }} />
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-primary)', margin: '0 0 2px' }}>{lang === 'en' ? 'My Works' : 'أعمالي'}</p>
                <p style={{ fontSize: 10, color: 'var(--ink-muted)', margin: 0 }}>
                  {loading ? '—' : `${portfolio.length} ${lang === 'en' ? 'items' : 'عمل'}`}
                </p>
              </button>
              <button onClick={() => setActiveTab('settings')} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16, cursor: 'pointer', textAlign: lang === 'ar' ? 'right' : 'left', minHeight: 90 }}>
                <Settings size={20} color="var(--ink-secondary)" style={{ marginBottom: 8, display: 'block' }} />
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-primary)', margin: '0 0 2px' }}>{lang === 'en' ? 'Services' : 'خدماتي'}</p>
                <p style={{ fontSize: 10, color: 'var(--ink-muted)', margin: 0 }}>
                  {loading ? '—' : `${services.length} ${lang === 'en' ? 'services' : 'خدمة'}`}
                </p>
              </button>
            </div>
          </div>
        )}

        {/* ───────── ORDERS TAB ───────── */}
        {activeTab === 'orders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-primary)', margin: 0 }}>
                {lang === 'en' ? 'All Orders' : 'كل الطلبات'}
                {!loading && <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontWeight: 400 }}> ({filteredOrders.length})</span>}
              </h3>
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
              {([
                { key: 'all',       label: lang === 'en' ? 'All'       : 'الكل'     },
                { key: 'pending',   label: lang === 'en' ? 'Pending'   : 'معلقة'    },
                { key: 'active',    label: lang === 'en' ? 'Active'    : 'نشطة'     },
                { key: 'completed', label: lang === 'en' ? 'Completed' : 'مكتملة'   },
              ] as { key: typeof orderFilter; label: string }[]).map(f => (
                <button key={f.key} onClick={() => setOrderFilter(f.key)} style={{ padding: '6px 14px', borderRadius: 'var(--radius-pill)', border: orderFilter === f.key ? 'none' : '1px solid var(--border)', background: orderFilter === f.key ? 'var(--accent)' : 'var(--bg-surface)', color: orderFilter === f.key ? '#fff' : 'var(--ink-secondary)', fontSize: 12, fontWeight: orderFilter === f.key ? 600 : 400, cursor: 'pointer', minHeight: 34, transition: 'all 0.15s' }}>
                  {f.label}
                </button>
              ))}
            </div>

            {loading ? (
              [0, 1, 2].map(i => <Skel key={i} h={110} r={14} />)
            ) : filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <Package size={32} color="var(--border)" style={{ margin: '0 auto 12px', display: 'block' }} />
                <p style={{ fontSize: 14, color: 'var(--ink-muted)', margin: 0 }}>
                  {orderFilter === 'all'
                    ? (lang === 'en' ? 'No orders yet' : 'لا توجد طلبات بعد')
                    : (lang === 'en' ? 'No orders in this category' : 'لا توجد طلبات في هذه الفئة')}
                </p>
              </div>
            ) : filteredOrders.map(o => (
              <div key={o.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 'var(--radius-pill)', background: STATUS_BG[o.status] ?? 'var(--border)', color: STATUS_COLOR[o.status] ?? 'var(--ink-muted)' }}>
                    {STATUS_LABEL[o.status]?.[lang] ?? o.status}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-primary)' }}>{o.clientName}</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--ink-secondary)', margin: '0 0 8px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.5 }}>{o.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={11} /> {new Date(o.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                  </span>
                  {o.artist_price != null
                    ? <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>{o.artist_price.toLocaleString('en-US')} {o.currency}</span>
                    : o.client_price != null
                      ? <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{o.client_price.toLocaleString('en-US')} {o.currency}</span>
                      : null}
                </div>
                {o.status === 'pending' && (
                  <button
                    onClick={() => { setPricingOrderId(o.id); setPriceInput(''); setShowPriceSheet(true) }}
                    style={{ marginTop: 10, width: '100%', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: '11px', fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 44 }}
                  >
                    {lang === 'en' ? 'Set Price' : 'حدد السعر'}
                  </button>
                )}
                {['accepted', 'in_progress'].includes(o.status) && (
                  <button
                    onClick={() => router.push(`/client/order/${o.id}`)}
                    style={{ marginTop: 10, width: '100%', background: 'var(--info-bg)', color: 'var(--info)', border: '1px solid var(--info)', borderRadius: 'var(--radius-md)', padding: '11px', fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 44 }}
                  >
                    {lang === 'en' ? 'Open Chat' : 'فتح المحادثة'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ───────── PORTFOLIO TAB ───────── */}
        {activeTab === 'portfolio' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{loading ? '—' : `${portfolio.length} ${lang === 'en' ? 'works' : 'عمل'}`}</span>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-primary)', margin: 0 }}>{lang === 'en' ? 'My Works' : 'أعمالي'}</h3>
            </div>

            {/* Grid */}
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3, marginBottom: 16 }}>
                {[0, 1, 2, 3, 4, 5].map(i => <Skel key={i} h={110} r={4} />)}
              </div>
            ) : portfolio.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1.5px dashed var(--border)', marginBottom: 16 }}>
                <Image size={36} color="var(--border)" style={{ margin: '0 auto 10px', display: 'block' }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-secondary)', margin: '0 0 4px' }}>{lang === 'en' ? 'No works yet' : 'لا توجد أعمال بعد'}</p>
                <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: 0 }}>{lang === 'en' ? 'Add your first work below' : 'أضف عملك الأول أدناه'}</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3, marginBottom: 16 }}>
                {portfolio.map(item => (
                  <div key={item.id} style={{ aspectRatio: '1/1', borderRadius: 4, overflow: 'hidden', background: 'var(--img-placeholder)', position: 'relative' }}>
                    <img src={item.image_url} alt={item.title ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      onClick={() => removePortfolioItem(item.id)}
                      style={{ position: 'absolute', top: 4, ...(lang === 'ar' ? { right: 4 } : { left: 4 }), width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                    >
                      <X size={13} color="#fff" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add by URL */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 14, marginBottom: 10 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-secondary)', margin: '0 0 8px', textAlign: lang === 'ar' ? 'right' : 'left' }}>
                {lang === 'en' ? 'Add by image URL' : 'أضف برابط صورة'}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={addPortfolioItem}
                  disabled={addingPortfolio || !newPortfolioUrl.trim()}
                  style={{ background: addingPortfolio ? 'var(--border)' : 'var(--accent)', color: addingPortfolio ? 'var(--ink-muted)' : '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: '0 14px', fontSize: 13, fontWeight: 600, cursor: addingPortfolio ? 'not-allowed' : 'pointer', flexShrink: 0, minHeight: 44, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  {addingPortfolio ? '...' : <><Plus size={14} /> {lang === 'en' ? 'Add' : 'إضافة'}</>}
                </button>
                <div style={{ flex: 1, position: 'relative' }}>
                  <LinkIcon size={14} color="var(--ink-muted)" style={{ position: 'absolute', top: '50%', [lang === 'ar' ? 'right' : 'left']: 10, transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    type="url"
                    value={newPortfolioUrl}
                    onChange={e => setNewPortfolioUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addPortfolioItem()}
                    placeholder="https://..."
                    style={{ ...inputStyle, direction: 'ltr', paddingLeft: lang === 'ar' ? 14 : 32, paddingRight: lang === 'ar' ? 32 : 14 }}
                  />
                </div>
              </div>
            </div>

            <button onClick={() => router.push('/artist/portfolio')} style={{ width: '100%', background: 'transparent', border: '1.5px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: 14, fontSize: 13, color: 'var(--ink-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48 }}>
              <ArrowUpRight size={15} /> {lang === 'en' ? 'Full Portfolio Manager' : 'إدارة الأعمال الكاملة'}
            </button>
          </div>
        )}

        {/* ───────── MESSAGES TAB ───────── */}
        {activeTab === 'messages' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-primary)', margin: '0 0 4px' }}>{lang === 'en' ? 'Messages' : 'الرسائل'}</h3>

            {loading ? (
              [0, 1, 2].map(i => <Skel key={i} h={70} r={14} />)
            ) : conversationOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <MessageCircle size={32} color="var(--border)" style={{ margin: '0 auto 12px', display: 'block' }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-secondary)', margin: '0 0 4px' }}>{lang === 'en' ? 'No conversations yet' : 'لا توجد محادثات بعد'}</p>
                <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: 0 }}>{lang === 'en' ? 'Accepted orders appear here' : 'الطلبات المقبولة تظهر هنا'}</p>
              </div>
            ) : conversationOrders.map(o => (
              <div
                key={o.id}
                onClick={() => router.push(`/client/order/${o.id}`)}
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 64 }}
              >
                <ChevronLeft size={16} color="var(--ink-muted)" style={{ transform: lang === 'en' ? 'rotate(180deg)' : 'none', flexShrink: 0 }} />
                <div style={{ textAlign: lang === 'ar' ? 'right' : 'left', flex: 1, marginRight: lang === 'ar' ? 0 : 8, marginLeft: lang === 'ar' ? 8 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: STATUS_BG[o.status] ?? 'var(--border)', color: STATUS_COLOR[o.status] ?? 'var(--ink-muted)', fontWeight: 600 }}>
                      {STATUS_LABEL[o.status]?.[lang] ?? o.status}
                    </span>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-primary)', margin: 0 }}>{o.clientName}</p>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: '3px 0 0', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>{o.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ───────── EARNINGS TAB ───────── */}
        {activeTab === 'earnings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--accent)', borderRadius: 20, padding: 24, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -30, left: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', margin: '0 0 8px' }}>{lang === 'en' ? 'Total Earnings' : 'إجمالي الأرباح'}</p>
              {loading ? (
                <div style={{ height: 44, background: 'rgba(255,255,255,0.15)', borderRadius: 8, marginBottom: 8 }} />
              ) : (
                <p style={{ fontSize: 36, fontWeight: 800, color: '#fff', margin: '0 0 4px', letterSpacing: -1 }}>
                  {earnings.toLocaleString('en-US')} <span style={{ fontSize: 14, opacity: 0.7 }}>{currency}</span>
                </p>
              )}
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                {loading ? '...' : `${orders.filter(o => o.status === 'completed').length} ${lang === 'en' ? 'completed orders' : 'طلب مكتمل'}`}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: lang === 'en' ? 'Active' : 'نشطة',    value: activeOrders.length,                               color: 'var(--info)' },
                { label: lang === 'en' ? 'Completed' : 'مكتملة', value: orders.filter(o => o.status === 'completed').length, color: 'var(--success)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16, textAlign: 'center' }}>
                  {loading
                    ? <div style={{ marginBottom: 6 }}><Skel h={28} r={4} /></div>
                    : <p style={{ fontSize: 24, fontWeight: 800, color, margin: '0 0 4px' }}>{value}</p>}
                  <p style={{ fontSize: 11, color: 'var(--ink-muted)', margin: 0 }}>{label}</p>
                </div>
              ))}
            </div>

            {!loading && earnings === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <TrendingUp size={28} color="var(--border)" style={{ margin: '0 auto 10px', display: 'block' }} />
                <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: 0 }}>{lang === 'en' ? 'Complete orders to earn' : 'أكمل الطلبات لتبدأ بالأرباح'}</p>
              </div>
            )}
          </div>
        )}

        {/* ───────── SETTINGS TAB ───────── */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Profile */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-primary)', margin: '0 0 14px', textAlign: lang === 'ar' ? 'right' : 'left' }}>{lang === 'en' ? 'Profile' : 'الملف الشخصي'}</h3>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: 6, textAlign: lang === 'ar' ? 'right' : 'left' }}>{lang === 'en' ? 'Bio' : 'النبذة'}</label>
                {loading ? <Skel h={60} r={8} /> : editingBio ? (
                  <div>
                    <textarea value={tempBio} onChange={e => setTempBio(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button onClick={saveBio} disabled={savingProfile} style={{ flex: 1, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: '11px', fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 44 }}>{lang === 'en' ? 'Save' : 'حفظ'}</button>
                      <button onClick={() => setEditingBio(false)} style={{ flex: 1, background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px', fontSize: 13, cursor: 'pointer', color: 'var(--ink-secondary)', minHeight: 44 }}>{lang === 'en' ? 'Cancel' : 'إلغاء'}</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <button onClick={() => { setTempBio(bio); setEditingBio(true) }} style={{ background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', cursor: 'pointer', color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, flexShrink: 0, minHeight: 36 }}>
                      <Edit3 size={11} /> {lang === 'en' ? 'Edit' : 'تعديل'}
                    </button>
                    <p style={{ fontSize: 13, color: bio ? 'var(--ink-secondary)' : 'var(--ink-placeholder)', margin: 0, lineHeight: 1.6, textAlign: lang === 'ar' ? 'right' : 'left' }}>
                      {bio || (lang === 'en' ? 'Add a bio...' : 'أضف نبذة عنك...')}
                    </p>
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: 6, textAlign: lang === 'ar' ? 'right' : 'left' }}>{lang === 'en' ? 'Location' : 'الموقع'}</label>
                <LocationPicker value={locationValue} onChange={loc => {
                  setLocationValue(loc)
                  const display = [loc.city, loc.countryName].filter(Boolean).join(', ')
                  if (display && artistId) {
                    supabase.from('artist_profiles').update({ city: display }).eq('id', artistId)
                      .then(() => toast.success(lang === 'en' ? 'Saved ✓' : 'تم ✓'))
                  }
                }} />
              </div>
            </div>

            {/* Categories */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-primary)', margin: '0 0 12px', textAlign: lang === 'ar' ? 'right' : 'left' }}>{lang === 'en' ? 'Specializations' : 'التخصصات'}</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CATS.map(cat => {
                  const active = categories.includes(cat.ar)
                  return (
                    <button key={cat.ar} onClick={() => toggleCategory(cat.ar)} style={{ padding: '9px 16px', borderRadius: 'var(--radius-pill)', border: active ? 'none' : '1px solid var(--border)', background: active ? 'var(--accent)' : 'var(--bg-page)', color: active ? '#fff' : 'var(--ink-secondary)', fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s', minHeight: 40 }}>
                      {lang === 'ar' ? cat.ar : cat.en}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Services */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <button
                  onClick={() => { setEditingService(null); setSvcName(''); setSvcPrice(''); setSvcDays(''); setSvcDesc(''); setShowServiceForm(true) }}
                  style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, minHeight: 36 }}
                >
                  <Plus size={13} /> {lang === 'en' ? 'Add' : 'إضافة'}
                </button>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-primary)', margin: 0 }}>{lang === 'en' ? 'My Services' : 'خدماتي'}</h3>
              </div>
              {loading ? (
                [0, 1].map(i => <div key={i} style={{ marginBottom: 8 }}><Skel h={64} r={10} /></div>)
              ) : services.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--ink-muted)', textAlign: 'center', padding: '16px 0', margin: 0 }}>{lang === 'en' ? 'No services yet' : 'لا توجد خدمات بعد'}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {services.map(svc => (
                    <div key={svc.id} style={{ background: 'var(--bg-page)', borderRadius: 'var(--radius-md)', padding: '12px 14px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => deleteService(svc.id)}
                            disabled={deletingServiceId === svc.id}
                            style={{ background: 'var(--danger-bg)', border: 'none', borderRadius: 8, padding: '8px 10px', cursor: deletingServiceId === svc.id ? 'not-allowed' : 'pointer', color: 'var(--danger)', minHeight: 36, display: 'flex', alignItems: 'center', opacity: deletingServiceId === svc.id ? 0.4 : 1 }}
                          >
                            <Trash2 size={13} />
                          </button>
                          <button
                            onClick={() => { setEditingService(svc); setSvcName(svc.name); setSvcPrice(svc.base_price.toString()); setSvcDays(svc.delivery_days.toString()); setSvcDesc(svc.description ?? ''); setShowServiceForm(true) }}
                            style={{ background: 'var(--info-bg)', border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', color: 'var(--info)', minHeight: 36, display: 'flex', alignItems: 'center' }}
                          >
                            <Edit3 size={13} />
                          </button>
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-primary)', margin: 0 }}>{svc.name}</p>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{svc.delivery_days} {lang === 'en' ? 'days' : 'يوم'}</span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>{svc.base_price.toLocaleString('en-US')} {svc.currency}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Role switch + sign out */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => setShowRoleSwitch(true)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--accent)', minHeight: 52 }}>
                <ChevronLeft size={16} style={{ transform: lang === 'en' ? 'rotate(180deg)' : 'none' }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>{lang === 'en' ? 'Switch to Client mode' : 'التحويل لوضع العميل'}</span>
              </button>
              <button onClick={handleSignOut} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--danger)', minHeight: 52 }}>
                <LogOut size={16} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>{lang === 'en' ? 'Sign Out' : 'تسجيل الخروج'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Inline Price Sheet ── */}
      {showPriceSheet && (
        <>
          <div onClick={() => setShowPriceSheet(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} />
          <div className="hirfa-slideup" style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: 'var(--bg-surface)', borderRadius: '20px 20px 0 0', zIndex: 41, direction: lang === 'ar' ? 'rtl' : 'ltr', paddingBottom: 40 }}>
            <div style={{ padding: '16px 20px 12px' }}>
              <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 auto 16px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <button onClick={() => setShowPriceSheet(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', display: 'flex', padding: 8 }}><X size={20} /></button>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-primary)', margin: 0 }}>{lang === 'en' ? 'Set Your Price' : 'حدد سعرك'}</h3>
                <div style={{ width: 36 }} />
              </div>
            </div>
            <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {pricingOrderId && (() => {
                const o = orders.find(x => x.id === pricingOrderId)
                return o ? (
                  <div style={{ background: 'var(--bg-page)', borderRadius: 'var(--radius-md)', padding: 12, border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: '0 0 4px' }}>{o.clientName}</p>
                    <p style={{ fontSize: 13, color: 'var(--ink-secondary)', margin: 0, lineHeight: 1.5 }}>{o.description}</p>
                  </div>
                ) : null
              })()}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: 8 }}>
                  {lang === 'en' ? 'Your Price (SAR)' : 'سعرك (ر.س)'}
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={priceInput}
                  onChange={e => setPriceInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submitPrice()}
                  placeholder="0"
                  autoFocus
                  style={{ width: '100%', background: 'var(--bg-page)', border: '2px solid var(--accent)', borderRadius: 'var(--radius-md)', padding: '14px 16px', fontSize: 22, fontWeight: 700, color: 'var(--ink-primary)', outline: 'none', boxSizing: 'border-box', direction: 'ltr', textAlign: 'center', fontFamily: 'Cairo, sans-serif' }}
                />
              </div>
              <button
                onClick={submitPrice}
                disabled={submittingPrice || !priceInput}
                style={{ width: '100%', background: submittingPrice || !priceInput ? 'var(--border)' : 'var(--accent)', color: submittingPrice || !priceInput ? 'var(--ink-muted)' : '#fff', border: 'none', borderRadius: 'var(--radius-lg)', padding: 16, fontSize: 15, fontWeight: 700, cursor: submittingPrice || !priceInput ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 52 }}
              >
                {submittingPrice ? (lang === 'en' ? 'Sending...' : 'جارٍ الإرسال...') : <><Check size={16} /> {lang === 'en' ? 'Send Price to Client' : 'أرسل السعر للعميل'}</>}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Service Form Sheet ── */}
      {showServiceForm && (
        <>
          <div onClick={() => setShowServiceForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} />
          <div className="hirfa-slideup" style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: 'var(--bg-surface)', borderRadius: '20px 20px 0 0', zIndex: 41, direction: lang === 'ar' ? 'rtl' : 'ltr', paddingBottom: 36, overflowY: 'auto', maxHeight: '85vh' }}>
            <div style={{ padding: '16px 20px 12px' }}>
              <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 auto 16px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={() => setShowServiceForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', display: 'flex', padding: 8 }}><X size={20} /></button>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-primary)', margin: 0 }}>
                  {editingService ? (lang === 'en' ? 'Edit Service' : 'تعديل الخدمة') : (lang === 'en' ? 'Add Service' : 'إضافة خدمة')}
                </h3>
                <div style={{ width: 36 }} />
              </div>
            </div>
            <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: 6 }}>{lang === 'en' ? 'Service Name *' : 'اسم الخدمة *'}</label>
                <input type="text" value={svcName} onChange={e => setSvcName(e.target.value)} placeholder={lang === 'en' ? 'e.g. Wedding Invitation' : 'مثال: بطاقة زواج'} style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: 6 }}>{lang === 'en' ? 'Price (SAR) *' : 'السعر (ر.س) *'}</label>
                  <input type="number" inputMode="decimal" value={svcPrice} onChange={e => setSvcPrice(e.target.value)} placeholder="100" style={{ ...inputStyle, direction: 'ltr' }} onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: 6 }}>{lang === 'en' ? 'Delivery (days)' : 'التسليم (يوم)'}</label>
                  <input type="number" inputMode="numeric" value={svcDays} onChange={e => setSvcDays(e.target.value)} placeholder="7" style={{ ...inputStyle, direction: 'ltr' }} onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: 6 }}>
                  {lang === 'en' ? 'Description' : 'الوصف'} <span style={{ fontSize: 10, color: 'var(--ink-muted)', fontWeight: 400 }}>{lang === 'en' ? 'optional' : 'اختياري'}</span>
                </label>
                <textarea value={svcDesc} onChange={e => setSvcDesc(e.target.value)} rows={2} placeholder={lang === 'en' ? 'Brief description...' : 'وصف مختصر...'} style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }} onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>
              <button onClick={saveService} disabled={savingService} style={{ width: '100%', background: savingService ? 'var(--border)' : 'var(--accent)', color: savingService ? 'var(--ink-muted)' : '#fff', border: 'none', borderRadius: 'var(--radius-lg)', padding: 16, fontSize: 15, fontWeight: 700, cursor: savingService ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 52 }}>
                {savingService ? (lang === 'en' ? 'Saving...' : 'جارٍ الحفظ...') : editingService ? (lang === 'en' ? 'Update Service' : 'تحديث الخدمة') : (lang === 'en' ? 'Add Service' : 'إضافة الخدمة')}
              </button>
            </div>
          </div>
        </>
      )}

      {showRoleSwitch && <RoleSwitchSheet currentRole="artist" onClose={() => setShowRoleSwitch(false)} />}
    </div>
  )
}
