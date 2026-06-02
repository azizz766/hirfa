'use client'

import { use, useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Send, CheckCircle, XCircle, Clock, Package, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Skel } from '@/components/ui/Skel'
import { toast } from '@/components/ui/Toast'
import { useTranslation } from '@/lib/theme'

type Order = {
  id: string
  status: string
  description: string
  artist_price: number | null
  client_price: number | null
  currency: string
  created_at: string
  desired_delivery: string | null
  artistName: string
  serviceName: string | null
}

type Message = {
  id: string
  sender_id: string
  content: string
  sent_at: string
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

const STEP_KEYS = ['pending', 'accepted', 'in_progress', 'completed'] as const

function stepIndex(status: string) {
  const i = STEP_KEYS.indexOf(status as typeof STEP_KEYS[number])
  return i === -1 ? 0 : i
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const t = useTranslation()
  const supabase = useMemo(() => createClient(), [])
  const bottomRef = useRef<HTMLDivElement>(null)

  const STEPS = [
    { key: 'pending',     label: t('order.step.request') },
    { key: 'accepted',    label: t('order.step.accept') },
    { key: 'in_progress', label: t('order.step.progress') },
    { key: 'completed',   label: t('order.step.done') },
  ]

  const STATUS_LABEL: Record<string, string> = {
    pending:     t('status.pending'),
    accepted:    t('status.accepted'),
    in_progress: t('status.in_progress'),
    completed:   t('status.completed'),
    delivered:   t('status.delivered'),
    cancelled:   t('status.cancelled'),
    disputed:    t('status.disputed'),
  }

  const [order, setOrder] = useState<Order | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState('')
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [acting, setActing] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) setCurrentUserId(user.id)

        const { data: o } = await supabase
          .from('orders')
          .select('id, status, description, artist_price, client_price, currency, created_at, desired_delivery, artist_id, service_id')
          .eq('id', id)
          .single()

        if (!o) { setLoading(false); return }

        const { data: profile } = await supabase.from('artist_profiles').select('user_id').eq('id', o.artist_id as string).single()
        const { data: artistUser } = profile?.user_id
          ? await supabase.from('users').select('name').eq('id', profile.user_id as string).single()
          : { data: null }
        const { data: service } = o.service_id
          ? await supabase.from('services').select('name').eq('id', o.service_id as string).single()
          : { data: null }

        setOrder({
          id: o.id as string,
          status: o.status as string,
          description: o.description as string,
          artist_price: o.artist_price as number | null,
          client_price: o.client_price as number | null,
          currency: o.currency as string,
          created_at: o.created_at as string,
          desired_delivery: o.desired_delivery as string | null,
          artistName: artistUser?.name ?? 'فنان',
          serviceName: service?.name ?? null,
        })

        const { data: msgs } = await supabase
          .from('messages')
          .select('id, sender_id, content, sent_at')
          .eq('order_id', id)
          .order('sent_at', { ascending: true })

        setMessages((msgs ?? []) as Message[])
      } catch { toast.error(t('general.error')) }
      finally { setLoading(false) }
    }
    load()

    const channel = supabase
      .channel(`order-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `order_id=eq.${id}`,
      }, (payload) => {
        const newMsg = payload.new as Message
        setMessages(prev => prev.find(m => m.id === newMsg.id) ? prev : [...prev, newMsg])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, id, t])

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [messages])

  async function sendMessage() {
    if (!draft.trim() || !currentUserId) return
    setSending(true)
    const content = draft.trim()
    setDraft('')
    try {
      const { data: msg } = await supabase.from('messages').insert({
        order_id: id, sender_id: currentUserId, content, sent_at: new Date().toISOString(),
      }).select('id, sender_id, content, sent_at').single()
      if (msg) setMessages(prev => [...prev, msg as Message])
    } catch { toast.error(t('general.error')) }
    finally { setSending(false) }
  }

  async function handleAccept() {
    if (!order) return
    setActing(true)
    try {
      router.push(`/client/payment/${id}`)
    } catch { toast.error(t('general.error')) }
    finally { setActing(false) }
  }

  async function handleDecline() {
    if (!order) return
    setActing(true)
    try {
      await supabase.from('orders').update({ status: 'cancelled' }).eq('id', id)
      setOrder(prev => prev ? { ...prev, status: 'cancelled' } : prev)
      toast.success(t('order.cancelled'))
    } catch { toast.error(t('general.error')) }
    finally { setActing(false) }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 430, margin: '0 auto', background: 'var(--bg-page)', minHeight: '100dvh', direction: 'rtl' }}>
        <div style={{ height: 52, background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }} />
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Skel h={100} r={14} />
          <Skel h={60} r={14} />
          {[0,1,2].map(i => <Skel key={i} h={44} r={20} />)}
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100dvh', background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'rtl', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 40 }}>😕</p>
        <p style={{ fontSize: 15, color: 'var(--ink-secondary)', fontWeight: 600 }}>{t('order.notfound')}</p>
        <button onClick={() => router.back()} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{t('general.back')}</button>
      </div>
    )
  }

  const badge = STATUS_STYLE[order.status] ?? STATUS_STYLE.pending
  const currentStep = stepIndex(order.status)
  const showPriceActions = order.status === 'accepted' && order.client_price != null

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', background: 'var(--bg-page)', minHeight: '100dvh', direction: 'rtl', paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-primary)', display: 'flex', padding: 4 }}>
          <ArrowRight size={22} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 'var(--radius-pill)', background: badge.bg, color: badge.color, fontWeight: 600 }}>
            {STATUS_LABEL[order.status] ?? order.status}
          </span>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-primary)' }}>{t('order.title')}</span>
        </div>
        <div style={{ width: 30 }} />
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Progress timeline */}
        {!['cancelled', 'disputed'].includes(order.status) && (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
              {/* Line */}
              <div style={{ position: 'absolute', top: 14, right: 28, left: 28, height: 2, background: 'var(--border)', zIndex: 0 }} />
              <div style={{ position: 'absolute', top: 14, right: 28, height: 2, background: 'var(--accent)', zIndex: 0, width: `${(currentStep / (STEPS.length - 1)) * (100 - 14)}%`, transition: 'width 0.4s ease' }} />

              {STEPS.map((step, i) => {
                const done = i <= currentStep
                return (
                  <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, zIndex: 1 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: done ? 'var(--accent)' : 'var(--bg-surface)', border: `2px solid ${done ? 'var(--accent)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
                      {done ? (
                        <CheckCircle size={14} color="#fff" />
                      ) : (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border)' }} />
                      )}
                    </div>
                    <span style={{ fontSize: 10, color: done ? 'var(--accent)' : 'var(--ink-muted)', fontWeight: done ? 600 : 400 }}>{step.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Order info */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontFamily: 'monospace' }}>#{order.id.slice(0, 8).toUpperCase()}</span>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-primary)', margin: '0 0 2px' }}>{order.artistName}</p>
              {order.serviceName && <p style={{ fontSize: 11, color: 'var(--ink-muted)', margin: 0 }}>{order.serviceName}</p>}
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--ink-secondary)', margin: '0 0 12px', lineHeight: 1.6 }}>{order.description}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              {order.desired_delivery && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} color="var(--ink-muted)" />
                  <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{new Date(order.desired_delivery).toLocaleDateString('ar-SA')}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Package size={12} color="var(--ink-muted)" />
                <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{new Date(order.created_at).toLocaleDateString('ar-SA')}</span>
              </div>
            </div>
            {order.client_price != null && (
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>
                {order.client_price.toLocaleString('en-US')} {order.currency}
              </span>
            )}
          </div>
        </div>

        {/* Price action — accept/decline */}
        {showPriceActions && (
          <div style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-bg)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--warning)', fontWeight: 600, margin: '0 0 12px', textAlign: 'right' }}>
              💡 {t('order.priceq')}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleDecline} disabled={acting} style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <XCircle size={15} /> {t('order.decline')}
              </button>
              <button onClick={handleAccept} disabled={acting} style={{ flex: 2, background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-md)', padding: '11px', fontSize: 14, fontWeight: 700, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 2px 8px rgba(192,57,43,0.2)' }}>
                <CheckCircle size={15} /> {t('order.accept')} · {order.client_price?.toLocaleString('en-US')} {order.currency}
              </button>
            </div>
          </div>
        )}

        {/* Chat */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {/* Chat header */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageCircle size={16} color="var(--ink-secondary)" />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-primary)' }}>{t('order.chat')}</span>
            {messages.length > 0 && <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{messages.length} {t('order.messages')}</span>}
          </div>

          {/* Messages */}
          <div style={{ padding: '12px 16px', minHeight: 120, maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--ink-muted)' }}>
                <MessageCircle size={28} color="var(--border)" style={{ margin: '0 auto 8px', display: 'block' }} />
                <p style={{ fontSize: 13, margin: 0 }}>{t('order.nochat')}</p>
                <p style={{ fontSize: 11, margin: '4px 0 0', color: 'var(--ink-placeholder)' }}>{t('order.startchat')}</p>
              </div>
            ) : (
              messages.map(msg => {
                const mine = msg.sender_id === currentUserId
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '75%', background: mine ? 'var(--accent)' : 'var(--bg-page)', color: mine ? '#fff' : 'var(--ink-primary)', borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px', padding: '10px 14px' }}>
                      <p style={{ fontSize: 14, margin: 0, lineHeight: 1.5 }}>{msg.content}</p>
                      <p style={{ fontSize: 10, margin: '4px 0 0', opacity: 0.7, textAlign: mine ? 'left' : 'right' }}>
                        {new Date(msg.sent_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={sendMessage} disabled={!draft.trim() || sending}
              style={{ width: 40, height: 40, borderRadius: '50%', background: draft.trim() ? 'var(--accent)' : 'var(--border)', border: 'none', cursor: draft.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}
            >
              <Send size={16} color={draft.trim() ? '#fff' : 'var(--ink-muted)'} />
            </button>
            <input type="text" value={draft} onChange={e => setDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder={t('order.type')}
              style={{ flex: 1, background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: 22, padding: '11px 16px', fontSize: 14, color: 'var(--ink-primary)', outline: 'none', fontFamily: 'Cairo, sans-serif', direction: 'rtl', transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
