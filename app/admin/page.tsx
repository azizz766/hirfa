'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toast'
import { Check, X, AlertTriangle, Users, ShoppingBag, Clock, TrendingUp } from 'lucide-react'
import { useTranslation } from '@/lib/theme'

type Artist = {
  id: string
  bio: string | null
  city: string | null
  categories: string[]
  created_at: string
  user_id: string
  userName: string
  userEmail: string
}

type Order = {
  id: string
  status: string
  client_price: number | null
  currency: string
  created_at: string
  clientName: string
  artistName: string
}

type Stats = {
  pendingArtists: number
  totalArtists: number
  totalOrders: number
  activeOrders: number
}

export default function AdminPage() {
  const t = useTranslation()
  const supabase = useMemo(() => createClient(), [])
  const [tab, setTab] = useState<'approval' | 'orders' | 'disputes'>('approval')
  const [pendingArtists, setPendingArtists] = useState<Artist[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<Stats>({ pendingArtists: 0, totalArtists: 0, totalOrders: 0, activeOrders: 0 })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const STATUS_AR: Record<string, { label: string; color: string; bg: string }> = {
    pending:     { label: t('status.pending'),     color: 'var(--status-pending-text)',   bg: 'var(--status-pending-bg)' },
    accepted:    { label: t('status.accepted'),    color: 'var(--status-active-text)',    bg: 'var(--status-active-bg)' },
    in_progress: { label: t('status.in_progress'), color: 'var(--status-progress-text)',  bg: 'var(--status-progress-bg)' },
    completed:   { label: t('status.completed'),   color: 'var(--status-done-text)',      bg: 'var(--status-done-bg)' },
    cancelled:   { label: t('status.cancelled'),   color: 'var(--status-cancelled-text)', bg: 'var(--status-cancelled-bg)' },
    delivered:   { label: t('status.delivered'),   color: 'var(--status-done-text)',      bg: 'var(--status-done-bg)' },
    disputed:    { label: t('status.disputed'),    color: 'var(--status-disputed-text)',  bg: 'var(--status-disputed-bg)' },
  }

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [
        { data: pending },
        { data: allArtists },
        { data: allOrders },
      ] = await Promise.all([
        supabase
          .from('artist_profiles')
          .select('*, users!user_id(name, email)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
        supabase
          .from('artist_profiles')
          .select('id, status'),
        supabase
          .from('orders')
          .select('*, artist_profiles!artist_id(users!user_id(name)), client:users!client_id(name)')
          .order('created_at', { ascending: false })
          .limit(50),
      ])

      setPendingArtists(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (pending ?? []).map((a: any) => ({
          id: a.id,
          bio: a.bio,
          city: a.city,
          categories: a.categories ?? [],
          created_at: a.created_at,
          user_id: a.user_id,
          userName: a.users?.name ?? '—',
          userEmail: a.users?.email ?? '',
        }))
      )

      setOrders(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (allOrders ?? []).map((o: any) => ({
          id: o.id,
          status: o.status,
          client_price: o.client_price,
          currency: o.currency ?? 'SAR',
          created_at: o.created_at,
          clientName: o.client?.name ?? '—',
          artistName: o.artist_profiles?.users?.name ?? '—',
        }))
      )

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const approved = (allArtists ?? []).filter((a: any) => a.status === 'approved').length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const active = (allOrders ?? []).filter((o: any) => ['accepted', 'in_progress'].includes(o.status)).length

      setStats({
        pendingArtists: (pending ?? []).length,
        totalArtists: approved,
        totalOrders: (allOrders ?? []).length,
        activeOrders: active,
      })
    } catch {
      toast.error(t('admin.errload'))
    } finally {
      setLoading(false)
    }
  }

  async function approveArtist(id: string) {
    setActionLoading(id)
    try {
      const { error } = await supabase
        .from('artist_profiles')
        .update({ status: 'approved' })
        .eq('id', id)
      if (error) throw error
      toast.success(t('admin.approveddone'))
      setPendingArtists((prev) => prev.filter((a) => a.id !== id))
      setStats((s) => ({ ...s, pendingArtists: s.pendingArtists - 1, totalArtists: s.totalArtists + 1 }))
    } catch {
      toast.error(t('admin.errapprove'))
    } finally {
      setActionLoading(null)
    }
  }

  async function rejectArtist(id: string) {
    setActionLoading(id + '_reject')
    try {
      const { error } = await supabase
        .from('artist_profiles')
        .update({ status: 'rejected' })
        .eq('id', id)
      if (error) throw error
      toast.success(t('admin.rejectedok'))
      setPendingArtists((prev) => prev.filter((a) => a.id !== id))
      setStats((s) => ({ ...s, pendingArtists: s.pendingArtists - 1 }))
    } catch {
      toast.error(t('admin.errreject'))
    } finally {
      setActionLoading(null)
    }
  }

  const disputes = orders.filter((o) => o.status === 'disputed')

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-page)',
      direction: 'rtl',
      padding: '0 0 40px',
    }}>

      {/* Header */}
      <div style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36,
            background: 'var(--accent)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 18,
          }}>ح</div>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-primary)', margin: 0 }}>{t('admin.title')}</h1>
            <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: 0 }}>Hirfa Admin</p>
          </div>
        </div>
        <button
          onClick={loadAll}
          style={{
            background: 'none', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: '7px 16px',
            fontSize: 13, color: 'var(--ink-secondary)', cursor: 'pointer',
          }}
        >
          {t('admin.refresh')}
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 32px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { icon: Clock,       label: t('admin.pending'),      value: stats.pendingArtists, color: 'var(--warning)',  bg: 'var(--warning-bg)' },
            { icon: Users,       label: t('admin.approved'),     value: stats.totalArtists,   color: 'var(--success)',  bg: 'var(--success-bg)' },
            { icon: ShoppingBag, label: t('admin.totalorders'),  value: stats.totalOrders,    color: 'var(--info)',     bg: 'var(--info-bg)' },
            { icon: TrendingUp,  label: t('admin.activeorders'), value: stats.activeOrders,   color: '#C0392B',         bg: 'var(--danger-bg)' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={20} color={color} />
              </div>
              <div>
                <p style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink-primary)', margin: '0 0 2px' }}>
                  {loading ? '—' : value}
                </p>
                <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: 0 }}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 4, width: 'fit-content' }}>
          {([
            { key: 'approval', label: `${t('admin.tab.approval')} (${stats.pendingArtists})` },
            { key: 'orders',   label: `${t('admin.tab.orders')} (${stats.totalOrders})` },
            { key: 'disputes', label: `${t('admin.tab.disputes')} (${disputes.length})` },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                padding: '8px 18px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: tab === key ? 'var(--accent)' : 'none',
                color: tab === key ? '#fff' : 'var(--ink-secondary)',
                fontSize: 13, fontWeight: tab === key ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab: Approval ── */}
        {tab === 'approval' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loading ? (
              [0,1,2].map((i) => (
                <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, height: 100 }} />
              ))
            ) : pendingArtists.length === 0 ? (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '48px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: 32, margin: '0 0 8px' }}>✅</p>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-primary)', margin: '0 0 4px' }}>{t('admin.nopending')}</p>
                <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: 0 }}>{t('admin.allreviewed')}</p>
              </div>
            ) : (
              pendingArtists.map((artist) => (
                <div key={artist.id} style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: 'var(--avatar-bg)', border: '2px solid #F5C6BF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>
                      {artist.userName.charAt(0)}
                    </span>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-primary)', margin: 0 }}>
                        {artist.userName}
                      </h3>
                      <span style={{ fontSize: 12, color: 'var(--ink-muted)', direction: 'ltr' }}>
                        {artist.userEmail}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                      {artist.categories.map((cat) => (
                        <span key={cat} style={{ fontSize: 11, background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '2px 8px', color: 'var(--ink-secondary)' }}>
                          {cat}
                        </span>
                      ))}
                      {artist.city && (
                        <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>📍 {artist.city}</span>
                      )}
                    </div>
                    {artist.bio && (
                      <p style={{ fontSize: 13, color: 'var(--ink-secondary)', margin: '0 0 6px', lineHeight: 1.5 }}>
                        {artist.bio.length > 120 ? artist.bio.slice(0, 120) + '...' : artist.bio}
                      </p>
                    )}
                    <p style={{ fontSize: 11, color: 'var(--ink-muted)', margin: 0 }}>
                      {t('admin.appliedon')} {new Date(artist.created_at).toLocaleDateString('ar-SA')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => rejectArtist(artist.id)}
                      disabled={!!actionLoading}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '9px 16px', borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)', background: 'none',
                        color: 'var(--ink-secondary)', fontSize: 13, fontWeight: 600,
                        cursor: actionLoading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <X size={15} /> {t('admin.reject')}
                    </button>
                    <button
                      onClick={() => approveArtist(artist.id)}
                      disabled={!!actionLoading}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '9px 20px', borderRadius: 'var(--radius-md)',
                        border: 'none', background: actionLoading === artist.id ? 'var(--border)' : 'var(--accent)',
                        color: '#fff', fontSize: 13, fontWeight: 700,
                        cursor: actionLoading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <Check size={15} />
                      {actionLoading === artist.id ? t('admin.approving') : t('admin.approve')}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Tab: Orders ── */}
        {tab === 'orders' && (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-muted)' }}>{t('admin.loading')}</div>
            ) : orders.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: 15, color: 'var(--ink-muted)' }}>{t('admin.noorders')}</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-page)', borderBottom: '1px solid var(--border)' }}>
                    {[
                      t('admin.col.id'),
                      t('admin.col.client'),
                      t('admin.col.artist'),
                      t('admin.col.status'),
                      t('admin.col.amount'),
                      t('admin.col.date'),
                    ].map((h) => (
                      <th key={h} style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--ink-secondary)', textAlign: 'right' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, i) => {
                    const st = STATUS_AR[order.status] ?? STATUS_AR.pending
                    return (
                      <tr key={order.id} style={{ borderBottom: i < orders.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--ink-muted)', fontFamily: 'monospace' }}>
                          #{order.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--ink-primary)', fontWeight: 500 }}>{order.clientName}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--ink-primary)' }}>{order.artistName}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 'var(--radius-sm)', background: st.bg, color: st.color }}>
                            {st.label}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)' }}>
                          {order.client_price ? `${order.client_price.toLocaleString('en-US')} ${order.currency}` : '—'}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--ink-muted)' }}>
                          {new Date(order.created_at).toLocaleDateString('ar-SA')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Tab: Disputes ── */}
        {tab === 'disputes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {disputes.length === 0 ? (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '48px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: 32, margin: '0 0 8px' }}>🕊️</p>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-primary)', margin: '0 0 4px' }}>{t('admin.nodisputes')}</p>
                <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: 0 }}>{t('admin.allok')}</p>
              </div>
            ) : (
              disputes.map((order) => (
                <div key={order.id} style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid #FCA5A5',
                  borderRadius: 'var(--radius-lg)',
                  padding: '18px 20px',
                  display: 'flex', alignItems: 'center', gap: 16,
                }}>
                  <AlertTriangle size={24} color="#DC2626" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-primary)', margin: '0 0 4px' }}>
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--ink-secondary)', margin: '0 0 2px' }}>
                      {order.clientName} ← → {order.artistName}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: 0 }}>
                      {new Date(order.created_at).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a
                      href={`/client/order/${order.id}`}
                      target="_blank"
                      style={{
                        padding: '8px 16px', borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)', background: 'none',
                        color: 'var(--ink-secondary)', fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', textDecoration: 'none',
                      }}
                    >
                      {t('admin.viewchat')}
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
