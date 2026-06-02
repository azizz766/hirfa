'use client'

import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, ArrowUpRight, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Skel } from '@/components/ui/Skel'
import { ArtistNav } from '@/components/nav/ArtistNav'
import { toast } from '@/components/ui/Toast'
import { useTranslation } from '@/lib/theme'

type Payment = {
  id: string
  amount: number
  currency: string
  status: string
  paid_at: string | null
  released_at: string | null
  created_at: string
}

export default function ArtistEarningsPage() {
  const t = useTranslation()
  const supabase = useMemo(() => createClient(), [])
  const [payments, setPayments] = useState<Payment[]>([])
  const [completedCount, setCompletedCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const PAYMENT_STATUS: Record<string, { label: string; bg: string; color: string }> = {
    pending:  { label: t('pstatus.pending'),  bg: 'var(--status-pending-bg)',  color: 'var(--status-pending-text)' },
    held:     { label: t('pstatus.held'),     bg: 'var(--warning-bg)',          color: 'var(--warning)' },
    released: { label: t('pstatus.released'), bg: 'var(--status-done-bg)',      color: 'var(--status-done-text)' },
    refunded: { label: t('pstatus.refunded'), bg: 'var(--status-cancelled-bg)', color: 'var(--status-cancelled-text)' },
  }

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }
        const { data: profile } = await supabase.from('artist_profiles').select('id').eq('user_id', user.id).single()
        if (!profile) { setLoading(false); return }
        const { data: orders } = await supabase.from('orders').select('id, status').eq('artist_id', profile.id as string)
        const orderIds = (orders ?? []).map(o => o.id as string)
        setCompletedCount((orders ?? []).filter(o => o.status === 'completed').length)
        if (!orderIds.length) { setLoading(false); return }
        const { data: paymentsData } = await supabase.from('payments')
          .select('id, amount, currency, status, paid_at, released_at, created_at')
          .in('order_id', orderIds)
          .order('created_at', { ascending: false })
        setPayments((paymentsData ?? []) as Payment[])
      } catch { toast.error(t('earnings.errload')) }
      finally { setLoading(false) }
    }
    load()
  }, [supabase, t])

  const available = payments.filter(p => p.status === 'released').reduce((s, p) => s + p.amount, 0)
  const total = payments.reduce((s, p) => s + p.amount, 0)
  const now = new Date()
  const thisMonth = payments.filter(p => {
    const d = new Date(p.created_at)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }).reduce((s, p) => s + p.amount, 0)
  const currency = payments[0]?.currency ?? 'SAR'

  const stats = [
    { icon: TrendingUp, label: t('earnings.thismonth'), value: thisMonth.toLocaleString('en-US'), color: 'var(--success)', bg: 'var(--success-bg)' },
    { icon: TrendingUp, label: t('earnings.total'),     value: total.toLocaleString('en-US'),     color: 'var(--info)',    bg: 'var(--info-bg)' },
    { icon: TrendingUp, label: t('earnings.completed'), value: String(completedCount),            color: 'var(--warning)', bg: 'var(--warning-bg)' },
  ]

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', background: 'var(--bg-page)', minHeight: '100dvh', direction: 'rtl', paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-primary)' }}>{t('earnings.title')}</span>
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Balance card */}
        <div style={{ background: 'var(--accent)', borderRadius: 20, padding: '28px 24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, left: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', margin: '0 0 8px' }}>{t('earnings.balance')}</p>
            {loading ? (
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 8, width: 160, height: 40, marginBottom: 16 }} />
            ) : (
              <p style={{ fontSize: 38, fontWeight: 700, color: '#fff', margin: '0 0 16px', letterSpacing: -1 }}>
                {available.toLocaleString('en-US')}
                <span style={{ fontSize: 16, fontWeight: 400, marginRight: 6 }}>{currency}</span>
              </p>
            )}
            <button style={{ background: 'var(--bg-surface)', color: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ArrowUpRight size={15} /> {t('earnings.withdraw')}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {loading ? (
            [0,1,2].map(i => (
              <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                <Skel w={50} h={18} />
                <Skel w={60} h={11} />
              </div>
            ))
          ) : stats.map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 10px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                <Icon size={13} color={color} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-primary)', margin: '0 0 2px', wordBreak: 'break-all' }}>{value}</p>
              <p style={{ fontSize: 9, color: 'var(--ink-muted)', margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Transactions */}
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-primary)', margin: '0 0 12px' }}>{t('earnings.transactions')}</h2>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Skel w={80} h={13} />
                    <Skel w={60} h={11} />
                  </div>
                  <Skel w={70} h={18} />
                </div>
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>💰</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-primary)', margin: '0 0 4px' }}>{t('earnings.empty')}</p>
              <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: 0 }}>{t('earnings.emptyhint')}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {payments.map(p => {
                const st = PAYMENT_STATUS[p.status] ?? PAYMENT_STATUS.pending
                const date = p.released_at ?? p.paid_at ?? p.created_at
                return (
                  <div key={p.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 'var(--radius-pill)', background: st.bg, color: st.color }}>{st.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, color: 'var(--ink-muted)' }}>
                        <Clock size={11} />
                        <p style={{ fontSize: 11, color: 'var(--ink-muted)', margin: 0 }}>{new Date(date).toLocaleDateString('ar-SA')}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink-primary)' }}>
                        {p.amount.toLocaleString('en-US')}
                      </span>
                      <p style={{ fontSize: 11, color: 'var(--ink-muted)', margin: '2px 0 0' }}>{p.currency}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <ArtistNav />
    </div>
  )
}
