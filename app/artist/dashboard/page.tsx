'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, Package, Star, Clock, ChevronLeft, Bell, ArrowUpRight, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ArtistNav } from '@/components/nav/ArtistNav'
import { Skel } from '@/components/ui/Skel'
import { toast } from '@/components/ui/Toast'
import { useTranslation, useAppSettings } from '@/lib/theme'

type Order = {
  id: string
  status: string
  description: string
  client_price: number | null
  currency: string
  created_at: string
  clientName: string
}

type Stats = {
  totalEarnings: number
  activeOrders: number
  completedOrders: number
  rating: number
  pendingOrders: number
  currency: string
}

export default function ArtistDashboardPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const t = useTranslation()
  const { lang } = useAppSettings()

  const [stats, setStats] = useState<Stats>({ totalEarnings: 0, activeOrders: 0, completedOrders: 0, rating: 0, pendingOrders: 0, currency: 'SAR' })
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const [artistName, setArtistName] = useState('')
  const [loading, setLoading] = useState(true)
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
        setArtistName(userData?.name ?? '')

        const { data: profile } = await supabase.from('artist_profiles').select('id, rating_avg, orders_count').eq('user_id', user.id).single()
        if (!profile) { setLoading(false); return }

        const { data: orders } = await supabase
          .from('orders')
          .select('id, status, description, client_price, currency, created_at, client_id')
          .eq('artist_id', profile.id)
          .order('created_at', { ascending: false })

        const allOrders = orders ?? []
        const pending = allOrders.filter(o => o.status === 'pending')
        const active = allOrders.filter(o => ['accepted', 'in_progress'].includes(o.status as string))
        const completed = allOrders.filter(o => o.status === 'completed')

        const clientIds = [...new Set(pending.map(o => o.client_id as string))]
        const { data: clients } = clientIds.length
          ? await supabase.from('users').select('id, name').in('id', clientIds)
          : { data: [] }
        const clientMap = Object.fromEntries((clients ?? []).map(c => [c.id, c.name]))

        const completedOrderIds = completed.map(o => o.id as string)
        const { data: paymentsData } = completedOrderIds.length
          ? await supabase.from('payments').select('amount, currency').in('order_id', completedOrderIds).eq('status', 'released')
          : { data: [] }

        const totalEarnings = (paymentsData ?? []).reduce((s, p) => s + (p.amount as number), 0)

        setPendingOrders(pending.slice(0, 3).map(o => ({
          id: o.id as string,
          status: o.status as string,
          description: o.description as string,
          client_price: o.client_price as number | null,
          currency: o.currency as string,
          created_at: o.created_at as string,
          clientName: clientMap[o.client_id as string] ?? (lang === 'en' ? 'Client' : 'عميل'),
        })))

        setStats({
          totalEarnings,
          activeOrders: active.length,
          completedOrders: completed.length,
          pendingOrders: pending.length,
          rating: profile.rating_avg ?? 0,
          currency: (paymentsData ?? [])[0]?.currency ?? 'SAR',
        })
      } catch { toast.error(t('general.error')) }
      finally { setLoading(false) }
    }
    load()
  }, [supabase, router, t, lang])

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', background: 'var(--bg-page)', minHeight: '100dvh', direction: lang === 'ar' ? 'rtl' : 'ltr', paddingBottom: 80, fontFamily: 'Cairo, sans-serif' }}>

      {/* ── Hero Header ─────────────────────────── */}
      <div style={{ background: 'linear-gradient(160deg, #111010 0%, #1c1311 55%, #2a1510 100%)', padding: '52px 20px 32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(192,57,43,0.12)', pointerEvents: 'none' }} />

        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, position: 'relative' }}>
          <button onClick={() => router.push('/artist/profile')} style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 700 }}>
            {artistName.charAt(0) || 'ف'}
          </button>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0, letterSpacing: '0.02em' }}>{greeting}</p>
            {loading
              ? <div style={{ width: 120, height: 18, background: 'rgba(255,255,255,0.15)', borderRadius: 4, marginTop: 4 }} />
              : <p style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: '4px 0 0' }}>{artistName}</p>
            }
          </div>
          <button onClick={() => router.push('/artist/orders')} style={{ position: 'relative', width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.8)' }}>
            <Bell size={17} />
            {stats.pendingOrders > 0 && <span style={{ position: 'absolute', top: 7, right: 7, width: 7, height: 7, borderRadius: '50%', background: '#fcd34d', border: '1.5px solid #1c1311' }} />}
          </button>
        </div>

        {/* Earnings card */}
        <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 20, padding: '20px', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: '0 0 6px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {lang === 'en' ? 'Total Earnings' : 'إجمالي الأرباح'}
          </p>
          {loading ? (
            <div style={{ width: 160, height: 36, background: 'rgba(255,255,255,0.15)', borderRadius: 6, marginBottom: 12 }} />
          ) : (
            <p style={{ fontSize: 36, fontWeight: 800, color: '#fff', margin: '0 0 14px', letterSpacing: '-0.03em', lineHeight: 1 }}>
              {stats.totalEarnings.toLocaleString('en-US')}
              <span style={{ fontSize: 15, fontWeight: 500, marginRight: 6, opacity: 0.6 }}>{stats.currency}</span>
            </p>
          )}
          <div style={{ display: 'flex', gap: 20, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Star size={12} fill="#fcd34d" color="#fcd34d" />
              <span style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>{stats.rating.toFixed(1)}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{lang === 'en' ? 'rating' : 'تقييم'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Package size={12} color="rgba(255,255,255,0.5)" />
              <span style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>{stats.completedOrders}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{lang === 'en' ? 'completed' : 'مكتمل'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Row ───────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '14px 16px 0' }}>
        {[
          { icon: Zap,   label: lang === 'en' ? 'Active Orders'    : 'طلبات نشطة',      value: stats.activeOrders,  color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  path: '/artist/orders' },
          { icon: Clock, label: lang === 'en' ? 'Pending Pricing'  : 'تنتظر التسعير',   value: stats.pendingOrders, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  path: '/artist/orders' },
        ].map(({ icon: Icon, label, value, color, bg, path }) => (
          <button key={label} onClick={() => router.push(path)}
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px', cursor: 'pointer', textAlign: lang === 'ar' ? 'right' : 'left', display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            <div style={{ width: 34, height: 34, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={16} color={color} />
            </div>
            {loading
              ? <Skel w={40} h={22} />
              : <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink-primary)', margin: 0, letterSpacing: '-0.03em' }}>{value}</p>
            }
            <p style={{ fontSize: 11, color: 'var(--ink-muted)', margin: 0 }}>{label}</p>
          </button>
        ))}
      </div>

      {/* ── Pending Orders ──────────────────────── */}
      <div style={{ padding: '22px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <button onClick={() => router.push('/artist/orders')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--accent)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
            {lang === 'en' ? 'View all' : 'عرض الكل'} <ArrowUpRight size={13} />
          </button>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink-primary)', margin: 0, letterSpacing: '-0.01em' }}>
            {stats.pendingOrders > 0 && (
              <span style={{ marginRight: 8, background: 'var(--accent)', color: '#fff', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                {stats.pendingOrders}
              </span>
            )}
            {lang === 'en' ? 'New Orders' : 'طلبات جديدة'}
          </h2>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Skel w={80} h={14} />
                  <Skel w={60} h={20} r={20} />
                </div>
                <Skel w="70%" h={13} />
              </div>
            ))}
          </div>
        ) : pendingOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✨</div>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-primary)', margin: '0 0 4px' }}>
              {lang === 'en' ? 'All caught up!' : 'أنجزت كل شيء!'}
            </p>
            <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: 0 }}>
              {lang === 'en' ? 'No pending orders right now' : 'لا توجد طلبات معلقة الآن'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pendingOrders.map(order => (
              <div key={order.id} onClick={() => router.push('/artist/orders')}
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
              >
                <div style={{ position: 'absolute', top: 0, right: 0, width: 3, height: '100%', background: 'linear-gradient(to bottom, #c0392b, #e74c3c)', borderRadius: lang === 'ar' ? '0 16px 16px 0' : '16px 0 0 16px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'rgba(192,57,43,0.08)', borderRadius: 20, padding: '3px 10px' }}>
                    {lang === 'en' ? 'Price it →' : '← سعّر'}
                  </span>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-primary)', margin: 0 }}>{order.clientName}</p>
                </div>
                <p style={{ fontSize: 13, color: 'var(--ink-secondary)', margin: '0 0 8px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.55 }}>
                  {order.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--ink-muted)' }}>
                  <Clock size={11} />
                  <span style={{ fontSize: 11 }}>{new Date(order.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-SA')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick Actions ───────────────────────── */}
      <div style={{ padding: '22px 16px 0' }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink-primary)', margin: '0 0 12px', letterSpacing: '-0.01em' }}>
          {lang === 'en' ? 'Quick Actions' : 'إجراءات سريعة'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button onClick={() => router.push('/artist/orders')}
            style={{ background: 'linear-gradient(135deg, #c0392b 0%, #a93226 100%)', border: 'none', borderRadius: 16, padding: '18px 16px', cursor: 'pointer', textAlign: lang === 'ar' ? 'right' : 'left', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ position: 'absolute', top: -12, left: -12, width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
            <ArrowUpRight size={13} color="rgba(255,255,255,0.5)" style={{ position: 'absolute', top: 12, left: 12 }} />
            <Package size={20} color="rgba(255,255,255,0.9)" style={{ marginBottom: 10, display: 'block' }} />
            <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 2px' }}>{lang === 'en' ? 'Manage Orders' : 'إدارة الطلبات'}</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', margin: 0 }}>{lang === 'en' ? 'View & accept orders' : 'عرض وقبول الطلبات'}</p>
          </button>

          <button onClick={() => router.push('/artist/portfolio')}
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 16px', cursor: 'pointer', textAlign: lang === 'ar' ? 'right' : 'left', position: 'relative', overflow: 'hidden' }}
          >
            <ArrowUpRight size={13} color="var(--ink-muted)" style={{ position: 'absolute', top: 12, left: 12 }} />
            <TrendingUp size={20} color="var(--ink-secondary)" style={{ marginBottom: 10, display: 'block' }} />
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-primary)', margin: '0 0 2px' }}>{lang === 'en' ? 'My Works' : 'أعمالي'}</p>
            <p style={{ fontSize: 10, color: 'var(--ink-muted)', margin: 0 }}>{lang === 'en' ? 'Manage portfolio' : 'إدارة معرض الأعمال'}</p>
          </button>
        </div>
      </div>

      <ArtistNav />
    </div>
  )
}
