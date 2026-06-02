'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Clock, ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ClientNav } from '@/components/nav/ClientNav'
import { Skel } from '@/components/ui/Skel'
import { toast } from '@/components/ui/Toast'
import { useTranslation } from '@/lib/theme'

type Order = {
  id: string
  status: string
  description: string
  currency: string
  client_price: number | null
  created_at: string
  artistName: string
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:     { bg: 'var(--status-pending-bg)',   color: 'var(--status-pending-text)' },
  accepted:    { bg: 'var(--status-active-bg)',    color: 'var(--status-active-text)' },
  in_progress: { bg: 'var(--status-progress-bg)',  color: 'var(--status-progress-text)' },
  completed:   { bg: 'var(--status-done-bg)',      color: 'var(--status-done-text)' },
  delivered:   { bg: 'var(--status-done-bg)',      color: 'var(--status-done-text)' },
  cancelled:   { bg: 'var(--status-cancelled-bg)', color: 'var(--status-cancelled-text)' },
  disputed:    { bg: 'var(--status-disputed-bg)',  color: 'var(--status-disputed-text)' },
}

const TABS = ['الكل', 'نشط', 'مكتمل', 'ملغى']

export default function MyOrdersPage() {
  const router = useRouter()
  const t = useTranslation()
  const supabase = useMemo(() => createClient(), [])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('الكل')

  const STATUS_LABEL: Record<string, string> = {
    pending:     t('status.pending'),
    accepted:    t('status.accepted'),
    in_progress: t('status.in_progress'),
    completed:   t('status.completed'),
    delivered:   t('status.delivered'),
    cancelled:   t('status.cancelled'),
    disputed:    t('status.disputed'),
  }

  const TAB_LABELS: Record<string, string> = {
    'الكل':  t('myorders.all'),
    'نشط':   t('myorders.active'),
    'مكتمل': t('myorders.completed'),
    'ملغى':  t('myorders.cancelled'),
  }

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }
        const { data: ordersData } = await supabase
          .from('orders')
          .select('id, status, description, currency, client_price, created_at, artist_id')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false })
        if (!ordersData?.length) { setLoading(false); return }
        const artistIds = [...new Set(ordersData.map(o => o.artist_id as string))]
        const { data: profiles } = await supabase
          .from('artist_profiles')
          .select('id, user_id')
          .in('id', artistIds)
        const userIds = [...new Set((profiles ?? []).map(p => p.user_id as string))]
        const { data: users } = await supabase.from('users').select('id, name').in('id', userIds)
        const profileMap: Record<string, string> = {}
        ;(profiles ?? []).forEach(p => { profileMap[p.id as string] = p.user_id as string })
        const userMap: Record<string, string> = {}
        ;(users ?? []).forEach(u => { userMap[u.id as string] = u.name as string })
        setOrders(ordersData.map(o => ({
          id: o.id as string, status: o.status as string,
          description: o.description as string, currency: o.currency as string,
          client_price: o.client_price as number | null,
          created_at: o.created_at as string,
          artistName: userMap[profileMap[o.artist_id as string]] ?? 'فنان',
        })))
      } catch { toast.error('تعذّر تحميل الطلبات') }
      finally { setLoading(false) }
    }
    load()
  }, [supabase])

  const filtered = orders.filter(o => {
    if (activeTab === 'الكل') return true
    if (activeTab === 'نشط') return ['pending', 'accepted', 'in_progress'].includes(o.status)
    if (activeTab === 'مكتمل') return ['completed', 'delivered'].includes(o.status)
    if (activeTab === 'ملغى') return o.status === 'cancelled'
    return true
  })

  const counts: Record<string, number> = {
    'الكل': orders.length,
    'نشط': orders.filter(o => ['pending', 'accepted', 'in_progress'].includes(o.status)).length,
    'مكتمل': orders.filter(o => ['completed', 'delivered'].includes(o.status)).length,
    'ملغى': orders.filter(o => o.status === 'cancelled').length,
  }

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', background: 'var(--bg-page)', minHeight: '100dvh', direction: 'rtl', paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', padding: '0 16px' }}>
        <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{orders.length} طلب</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-primary)' }}>{t('myorders.title')}</span>
          <div style={{ width: 40 }} />
        </div>
        <div style={{ display: 'flex', gap: 4, paddingBottom: 12, direction: 'rtl' }}>
          {TABS.map(tab => {
            const active = activeTab === tab
            const count = counts[tab]
            return (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                flex: 1, padding: '7px 4px', borderRadius: 'var(--radius-md)',
                background: active ? 'var(--accent)' : 'var(--bg-page)',
                border: active ? 'none' : '1px solid var(--border)',
                color: active ? '#fff' : 'var(--ink-secondary)',
                fontSize: 12, fontWeight: active ? 600 : 400, cursor: 'pointer',
                transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}>
                {TAB_LABELS[tab]}
                {count > 0 && (
                  <span style={{
                    background: active ? 'rgba(255,255,255,0.25)' : 'var(--border)',
                    color: active ? '#fff' : 'var(--ink-muted)',
                    borderRadius: 'var(--radius-pill)', padding: '0 5px', fontSize: 10, fontWeight: 600,
                  }}>{count}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          [0,1,2].map(i => (
            <div key={i} style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Skel w={80} h={22} r={20} />
                <Skel w={60} h={14} />
              </div>
              <Skel w="70%" h={14} />
              <Skel w="50%" h={12} />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginTop: 8 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>
              {activeTab === 'نشط' ? '⏳' : activeTab === 'مكتمل' ? '🎉' : activeTab === 'ملغى' ? '❌' : '🛍️'}
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-primary)', margin: '0 0 6px' }}>
              {activeTab === 'الكل' ? t('myorders.empty') : `${t('myorders.empty')} ${TAB_LABELS[activeTab]}`}
            </p>
            <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: '0 0 16px' }}>
              {activeTab === 'الكل' ? t('myorders.emptyhint') : t('myorders.othertab')}
            </p>
            {activeTab === 'الكل' && (
              <button onClick={() => router.push('/client/home')} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {t('myorders.discover')}
              </button>
            )}
          </div>
        ) : (
          filtered.map(order => {
            const badge = STATUS_STYLE[order.status] ?? STATUS_STYLE.pending
            return (
              <div key={order.id}
                onClick={() => router.push(`/client/order/${order.id}`)}
                style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 16, cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
              >
                {/* Top */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 'var(--radius-pill)', background: badge.bg, color: badge.color, fontWeight: 600 }}>
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                  <ChevronLeft size={16} color="var(--ink-muted)" />
                </div>

                {/* Artist + description */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--avatar-bg)', border: '1px solid var(--avatar-border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>{order.artistName.charAt(0)}</span>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)', margin: 0 }}>{order.artistName}</p>
                </div>
                <p style={{ fontSize: 13, color: 'var(--ink-secondary)', margin: '0 0 12px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.55 }}>
                  {order.description}
                </p>

                {/* Bottom */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--ink-muted)' }}>
                    <Clock size={12} />
                    <span style={{ fontSize: 11 }}>{new Date(order.created_at).toLocaleDateString('ar-SA')}</span>
                  </div>
                  {order.client_price != null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Package size={13} color="var(--ink-muted)" />
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-primary)' }}>
                        {order.client_price.toLocaleString('en-US')} {order.currency}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      <ClientNav />
    </div>
  )
}
