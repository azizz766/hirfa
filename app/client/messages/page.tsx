'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ClientNav } from '@/components/nav/ClientNav'
import { Skel } from '@/components/ui/Skel'
import { toast } from '@/components/ui/Toast'
import { useTranslation } from '@/lib/theme'

// ─── Types ────────────────────────────────────────────────────

type ConversationRow = {
  orderId: string
  artistName: string
  lastContent: string
  lastSentAt: string
  hasUnread: boolean
}

// ─── Page ─────────────────────────────────────────────────────

export default function MessagesPage() {
  const router = useRouter()
  const t = useTranslation()
  const supabase = useMemo(() => createClient(), [])

  const [conversations, setConversations] = useState<ConversationRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        const { data: orders, error } = await supabase
          .from('orders')
          .select('id, artist_id, artist_profiles!artist_id(users!user_id(name, avatar_url))')
          .eq('client_id', user.id)
        if (error) throw error
        if (!orders || orders.length === 0) { setLoading(false); return }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orderIds = orders.map((o: any) => o.id as string)
        const { data: msgs } = await supabase
          .from('messages')
          .select('order_id, content, sender_id, is_read, sent_at')
          .in('order_id', orderIds)
          .order('sent_at', { ascending: false })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const latestByOrder: Record<string, any> = {}
        for (const msg of msgs ?? []) {
          const oid = msg.order_id as string
          if (!latestByOrder[oid]) {
            latestByOrder[oid] = {
              lastContent: msg.content as string,
              lastSentAt: msg.sent_at as string,
              hasUnread: false,
            }
          }
          if (msg.sender_id !== user.id && !msg.is_read) {
            latestByOrder[oid].hasUnread = true
          }
        }

        const convs = orders
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((o: any) => latestByOrder[o.id])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((o: any) => ({
            orderId: o.id as string,
            artistName: (o.artist_profiles as any)?.users?.name ?? 'فنان',
            ...latestByOrder[o.id],
          }))
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .sort((a: any, b: any) => new Date(b.lastSentAt).getTime() - new Date(a.lastSentAt).getTime())

        setConversations(convs)
      } catch {
        toast.error('تعذّر تحميل الرسائل')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [supabase])

  function formatTime(iso: string) {
    const d = new Date(iso)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
    if (diffDays === 0) return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    if (diffDays === 1) return t('messages.yesterday')
    if (diffDays < 7) return d.toLocaleDateString('ar-SA', { weekday: 'short' })
    return d.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })
  }

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', background: 'var(--bg-page)', minHeight: '100dvh', direction: 'rtl', paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-primary)' }}>{t('messages.title')}</span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Skel w={48} h={48} r={24} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Skel w={100} h={14} />
                  <Skel w={40} h={11} />
                </div>
                <Skel w="75%" h={12} />
              </div>
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 32px', gap: 12 }}>
            <div style={{ fontSize: 48, marginBottom: 4 }}>💬</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-primary)', margin: 0 }}>{t('messages.empty')}</p>
            <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: 0, textAlign: 'center', lineHeight: 1.6 }}>{t('messages.emptyhint')}</p>
            <button
              onClick={() => router.push('/client/home')}
              style={{
                marginTop: 8, background: 'var(--accent)', color: '#fff',
                border: 'none', borderRadius: 'var(--radius-md)',
                padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {t('messages.firstorder')}
            </button>
          </div>
      ) : (
        <div style={{ background: 'var(--bg-surface)' }}>
          {conversations.map((conv) => {
            const initial = conv.artistName.charAt(0)
            const preview = conv.lastContent.length > 40
              ? conv.lastContent.slice(0, 40) + '...'
              : conv.lastContent
            return (
              <div
                key={conv.orderId}
                onClick={() => router.push(`/client/order/${conv.orderId}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: 'var(--bg-surface)' }}
              >
                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--avatar-bg)', border: '1.5px solid var(--avatar-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>{initial}</span>
                  </div>
                  {conv.hasUnread && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: 12, height: 12, borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--bg-surface)' }} />
                  )}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: conv.hasUnread ? 700 : 600, color: 'var(--ink-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                      {conv.artistName}
                    </span>
                    <span style={{ fontSize: 11, color: conv.hasUnread ? 'var(--accent)' : 'var(--ink-muted)', flexShrink: 0, fontWeight: conv.hasUnread ? 600 : 400 }}>
                      {formatTime(conv.lastSentAt)}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: conv.hasUnread ? 'var(--ink-primary)' : 'var(--ink-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: conv.hasUnread ? 500 : 400 }}>
                    {preview || '—'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ClientNav />
    </div>
  )
}
