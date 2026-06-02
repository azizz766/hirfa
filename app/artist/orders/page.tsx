'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { X, Clock, CheckCircle, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Skel } from '@/components/ui/Skel'
import { ArtistNav } from '@/components/nav/ArtistNav'
import { toast } from '@/components/ui/Toast'
import { useTranslation, useAppSettings } from '@/lib/theme'

type OrderRow = {
  id: string
  status: string
  description: string
  artist_price: number | null
  client_price: number | null
  currency: string
  created_at: string
  client_id: string
  clientName: string
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

const TABS = ['all', 'waiting', 'active', 'completed'] as const
type Tab = typeof TABS[number]

export default function ArtistOrdersPage() {
  const t = useTranslation()
  const { lang } = useAppSettings()
  const supabase = useMemo(() => createClient(), [])
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [sheetOrder, setSheetOrder] = useState<OrderRow | null>(null)
  const [priceInput, setPriceInput] = useState('')
  const [saving, setSaving] = useState(false)

  const STATUS_LABEL: Record<string, string> = {
    pending:     t('status.pending'),
    accepted:    t('status.accepted'),
    in_progress: t('status.in_progress'),
    completed:   t('status.completed'),
    delivered:   t('status.delivered'),
    cancelled:   t('status.cancelled'),
    disputed:    t('status.disputed'),
  }

  const TAB_LABELS: Record<Tab, string> = {
    all:       t('aorders.tab.all'),
    waiting:   t('aorders.tab.waiting'),
    active:    t('aorders.tab.active'),
    completed: t('aorders.tab.completed'),
  }

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function setup() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }
        const { data: profile } = await supabase.from('artist_profiles').select('id').eq('user_id', user.id).single()
        if (!profile) { setLoading(false); return }

        const profileId = profile.id as string

        const { data: ordersData } = await supabase.from('orders')
          .select('id, status, description, artist_price, client_price, currency, created_at, client_id')
          .eq('artist_id', profileId)
          .order('created_at', { ascending: false })
        if (ordersData?.length) {
          const clientIds = [...new Set(ordersData.map(o => o.client_id as string))]
          const { data: clients } = await supabase.from('users').select('id, name').in('id', clientIds)
          const nameMap: Record<string, string> = {}
          ;(clients ?? []).forEach(c => { nameMap[c.id as string] = c.name as string })
          setOrders(ordersData.map(o => ({
            id: o.id as string, status: o.status as string, description: o.description as string,
            artist_price: o.artist_price as number | null, client_price: o.client_price as number | null,
            currency: o.currency as string, created_at: o.created_at as string,
            client_id: o.client_id as string, clientName: nameMap[o.client_id as string] ?? 'عميل',
          })))
        }

        // Subscribe to realtime order changes for this artist
        channel = supabase
          .channel('artist-orders-realtime')
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: `artist_id=eq.${profileId}`,
          }, async (payload) => {
            const newOrder = payload.new as Record<string, unknown>
            const { data: clientUser } = await supabase
              .from('users')
              .select('name')
              .eq('id', newOrder.client_id)
              .single()
            setOrders(prev => [{
              id: newOrder.id as string,
              status: newOrder.status as string,
              description: newOrder.description as string,
              artist_price: newOrder.artist_price as number | null,
              client_price: newOrder.client_price as number | null,
              currency: (newOrder.currency as string) ?? 'SAR',
              created_at: newOrder.created_at as string,
              client_id: newOrder.client_id as string,
              clientName: clientUser?.name ?? (lang === 'en' ? 'Client' : 'عميل'),
            }, ...prev])
            toast.success(lang === 'en' ? 'New order received! 🎉' : 'طلب جديد وصلك! 🎉')
          })
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `artist_id=eq.${profileId}`,
          }, (payload) => {
            const updated = payload.new as Record<string, unknown>
            setOrders(prev => prev.map(o =>
              o.id === updated.id
                ? { ...o, status: updated.status as string, client_price: updated.client_price as number | null, artist_price: updated.artist_price as number | null }
                : o
            ))
          })
          .subscribe()
      } catch { toast.error(t('aorders.errload')) }
      finally { setLoading(false) }
    }

    setup()

    return () => { if (channel) supabase.removeChannel(channel) }
  }, [supabase, t, lang])

  const filtered = orders.filter(o => {
    if (activeTab === 'all') return true
    if (activeTab === 'waiting') return o.status === 'pending'
    if (activeTab === 'active') return ['accepted', 'in_progress'].includes(o.status)
    if (activeTab === 'completed') return ['completed', 'delivered'].includes(o.status)
    return true
  })

  const counts: Record<Tab, number> = {
    all:       orders.length,
    waiting:   orders.filter(o => o.status === 'pending').length,
    active:    orders.filter(o => ['accepted', 'in_progress'].includes(o.status)).length,
    completed: orders.filter(o => ['completed', 'delivered'].includes(o.status)).length,
  }

  async function handleSavePrice() {
    if (!sheetOrder) return
    const price = parseFloat(priceInput)
    if (!priceInput || isNaN(price) || price <= 0) { toast.error(t('aorders.errprice')); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('orders').update({
        artist_price: price,
        client_price: parseFloat((price * 1.25).toFixed(2)),
        status: 'accepted',
      }).eq('id', sheetOrder.id)
      if (error) throw error
      setOrders(prev => prev.map(o => o.id === sheetOrder.id
        ? { ...o, artist_price: price, client_price: parseFloat((price * 1.25).toFixed(2)), status: 'accepted' }
        : o
      ))
      toast.success(t('aorders.accepted'))
      setSheetOrder(null); setPriceInput('')
    } catch { toast.error(t('aorders.errsubmit')) }
    finally { setSaving(false) }
  }

  const emptyIcon = activeTab === 'waiting' ? '⏳' : activeTab === 'active' ? '📦' : activeTab === 'completed' ? '🎉' : '📋'
  const emptyText = activeTab === 'all' ? t('aorders.empty') : t('aorders.notab')
  const emptyHint = activeTab === 'all' ? t('aorders.clientorders') : t('myorders.othertab')

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', background: 'var(--bg-page)', minHeight: '100dvh', direction: 'rtl', paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', padding: '0 16px' }}>
        <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{orders.length} {t('general.order')}</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-primary)' }}>{t('aorders.title')}</span>
          <div style={{ width: 40 }} />
        </div>
        {/* Tabs */}
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
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><Skel w={90} h={14} /><Skel w={64} h={22} r={6} /></div>
              <Skel w="70%" h={13} /><Skel w="50%" h={12} />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginTop: 8 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{emptyIcon}</div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-primary)', margin: '0 0 4px' }}>{emptyText}</p>
            <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: 0 }}>{emptyHint}</p>
          </div>
        ) : (
          filtered.map(order => {
            const badge = STATUS_STYLE[order.status] ?? STATUS_STYLE.pending
            return (
              <div key={order.id}
                style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 16, transition: 'box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 'var(--radius-pill)', background: badge.bg, color: badge.color, fontWeight: 600 }}>
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontFamily: 'monospace' }}>#{order.id.slice(0, 8).toUpperCase()}</span>
                </div>

                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-primary)', margin: '0 0 6px' }}>{order.clientName}</p>
                <p style={{ fontSize: 13, color: 'var(--ink-secondary)', margin: '0 0 12px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.55 }}>
                  {order.description}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--ink-muted)' }}>
                    <Clock size={12} />
                    <span style={{ fontSize: 11 }}>{new Date(order.created_at).toLocaleDateString('ar-SA')}</span>
                  </div>
                  {order.status === 'pending' ? (
                    <button onClick={() => { setSheetOrder(order); setPriceInput(order.artist_price ? String(order.artist_price) : '') }}
                      style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(192,57,43,0.2)' }}
                      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.96)' }}
                      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
                    >
                      <CheckCircle size={14} /> {t('aorders.setprice')}
                    </button>
                  ) : order.artist_price != null ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Package size={13} color="var(--ink-muted)" />
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-primary)' }}>
                        {order.artist_price.toLocaleString('en-US')} {order.currency}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Bottom Sheet */}
      {sheetOrder && (
        <>
          <div onClick={() => { setSheetOrder(null); setPriceInput('') }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 30 }} />
          <div className="hirfa-slideup" style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: 'var(--bg-surface)', borderRadius: '20px 20px 0 0', zIndex: 31, direction: 'rtl' }}>
            <div style={{ padding: '16px 20px 12px' }}>
              <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 auto 16px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={() => { setSheetOrder(null); setPriceInput('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', display: 'flex', padding: 4 }}>
                  <X size={20} />
                </button>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-primary)', margin: 0 }}>{t('aorders.pricetitle')}</h3>
                <div style={{ width: 28 }} />
              </div>
            </div>

            <div style={{ padding: '0 20px 32px' }}>
              <div style={{ background: 'var(--bg-page)', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)', margin: '0 0 4px' }}>{sheetOrder.clientName}</p>
                <p style={{ fontSize: 12, color: 'var(--ink-secondary)', margin: 0, lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                  {sheetOrder.description}
                </p>
              </div>

              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)', marginBottom: 8 }}>
                {t('aorders.yourprice')} <span style={{ color: 'var(--accent)' }}>*</span>
              </label>
              <input type="number" value={priceInput} onChange={e => setPriceInput(e.target.value)} placeholder={t('aorders.priceph')} min={1}
                style={{ width: '100%', background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '13px 14px', fontSize: 18, fontWeight: 700, color: 'var(--ink-primary)', outline: 'none', boxSizing: 'border-box', direction: 'ltr', textAlign: 'right', transition: 'border-color 0.15s', marginBottom: 8 }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />

              {priceInput && !isNaN(parseFloat(priceInput)) && parseFloat(priceInput) > 0 && (
                <div style={{ background: 'var(--info-bg)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--info)' }}>{t('aorders.clientpays')}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--info)' }}>
                    {(parseFloat(priceInput) * 1.25).toFixed(0)} {t('general.sar')}
                  </span>
                </div>
              )}

              <button onClick={handleSavePrice} disabled={saving}
                style={{ width: '100%', background: saving ? 'var(--border)' : 'var(--accent)', color: saving ? 'var(--ink-muted)' : '#fff', border: 'none', borderRadius: 'var(--radius-lg)', padding: '15px', fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.15s', boxShadow: saving ? 'none' : '0 4px 16px rgba(192,57,43,0.25)' }}
                onMouseDown={e => { if (!saving) e.currentTarget.style.transform = 'scale(0.98)' }}
                onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
              >
                {saving ? (
                  <><div className="hirfa-spin" style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%' }} /> {t('aorders.saving')}</>
                ) : (
                  <><CheckCircle size={16} /> {t('aorders.accept')}</>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      <ArtistNav />
    </div>
  )
}
