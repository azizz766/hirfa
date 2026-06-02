'use client'

import { Suspense, useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowRight, Lock, Shield, CreditCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Skel } from '@/components/ui/Skel'
import { toast } from '@/components/ui/Toast'
import { useTranslation } from '@/lib/theme'

type Order = {
  id: string
  client_price: number
  currency: string
  description: string
  artistName: string
  serviceName: string | null
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div style={{ maxWidth: 430, margin: '0 auto', background: 'var(--bg-page)', minHeight: '100dvh' }} />}>
      <PaymentContent />
    </Suspense>
  )
}

function PaymentContent() {
  const router = useRouter()
  const { orderId } = useParams<{ orderId: string }>()
  const t = useTranslation()
  const supabase = useMemo(() => createClient(), [])

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const { data: o } = await supabase
          .from('orders')
          .select('id, client_price, currency, description, artist_id, service_id')
          .eq('id', orderId)
          .single()
        if (!o) { setLoading(false); return }
        const { data: profile } = await supabase.from('artist_profiles').select('user_id').eq('id', o.artist_id as string).single()
        const { data: user } = profile?.user_id
          ? await supabase.from('users').select('name').eq('id', profile.user_id as string).single()
          : { data: null }
        const { data: service } = o.service_id
          ? await supabase.from('services').select('name').eq('id', o.service_id as string).single()
          : { data: null }
        setOrder({
          id: o.id as string,
          client_price: o.client_price as number,
          currency: o.currency as string,
          description: o.description as string,
          artistName: user?.name ?? 'فنان',
          serviceName: service?.name ?? null,
        })
      } catch { toast.error(t('general.error')) }
      finally { setLoading(false) }
    }
    load()
  }, [supabase, orderId])

  function formatCardNumber(v: string) {
    return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
  }
  function formatExpiry(v: string) {
    const digits = v.replace(/\D/g, '').slice(0, 4)
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2)
    return digits
  }

  async function handlePay() {
    if (!cardName.trim()) { toast.error(t('payment.name')); return }
    if (cardNumber.replace(/\s/g, '').length < 16) { toast.error(t('payment.number')); return }
    if (expiry.length < 5) { toast.error(t('payment.expiry')); return }
    if (cvv.length < 3) { toast.error('CVV'); return }
    setPaying(true)
    try {
      await new Promise(r => setTimeout(r, 1500))
      await supabase.from('orders').update({ status: 'in_progress' }).eq('id', orderId)
      toast.success(t('ordernew.success'))
      router.replace(`/client/order/${orderId}`)
    } catch { toast.error(t('general.error')) }
    finally { setPaying(false) }
  }

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', background: 'var(--bg-page)', minHeight: '100dvh', direction: 'rtl', paddingBottom: 40 }}>

      {/* Top accent bar */}
      <div style={{ height: 4, background: 'var(--accent)' }} />

      {/* Header */}
      <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-primary)', display: 'flex', alignItems: 'center', padding: 4 }}>
          <ArrowRight size={22} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Lock size={14} color="var(--success)" />
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-primary)' }}>{t('payment.title')}</span>
        </div>
        <div style={{ width: 30 }} />
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Order summary */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{t('payment.summary')}</span>
            <span style={{ fontSize: 11, background: 'var(--status-progress-bg)', color: 'var(--status-progress-text)', borderRadius: 'var(--radius-pill)', padding: '2px 10px', fontWeight: 600 }}>{t('payment.waiting')}</span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Skel h={14} w="60%" />
              <Skel h={12} w="40%" />
              <Skel h={20} w="40%" />
            </div>
          ) : order ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)', margin: 0 }}>
                  {order.client_price.toLocaleString('en-US')}
                  <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--ink-muted)', marginRight: 4 }}>{order.currency}</span>
                </p>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)', margin: '0 0 2px' }}>{order.artistName}</p>
                  {order.serviceName && <p style={{ fontSize: 11, color: 'var(--ink-muted)', margin: 0 }}>{order.serviceName}</p>}
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--ink-secondary)', margin: 0, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {order.description}
              </p>
            </>
          ) : null}
        </div>

        {/* Trust badges */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { icon: Shield, text: t('payment.secure'), color: 'var(--success)', bg: 'var(--success-bg)' },
            { icon: Lock, text: t('payment.buyer'), color: 'var(--info)', bg: 'var(--info-bg)' },
          ].map(({ icon: Icon, text, color, bg }) => (
            <div key={text} style={{ flex: 1, background: bg, borderRadius: 'var(--radius-md)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon size={14} color={color} />
              <span style={{ fontSize: 11, color, fontWeight: 600 }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Card form */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <CreditCard size={18} color="var(--ink-secondary)" />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-primary)' }}>{t('payment.card')}</span>
          </div>

          {/* Card name */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: 6 }}>{t('payment.name')}</label>
            <input type="text" value={cardName} onChange={e => setCardName(e.target.value)} placeholder={t('payment.name')}
              style={{ width: '100%', background: 'var(--bg-page)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', fontSize: 14, color: 'var(--ink-primary)', outline: 'none', boxSizing: 'border-box', direction: 'rtl', fontFamily: 'Cairo, sans-serif', transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Card number */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: 6 }}>{t('payment.number')}</label>
            <input type="text" value={cardNumber} onChange={e => setCardNumber(formatCardNumber(e.target.value))} placeholder="0000 0000 0000 0000" inputMode="numeric"
              style={{ width: '100%', background: 'var(--bg-page)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', fontSize: 16, fontWeight: 600, color: 'var(--ink-primary)', outline: 'none', boxSizing: 'border-box', direction: 'ltr', letterSpacing: 2, transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Expiry + CVV */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: 6 }}>{t('payment.expiry')}</label>
              <input type="text" value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))} placeholder="MM/YY" inputMode="numeric"
                style={{ width: '100%', background: 'var(--bg-page)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', fontSize: 15, color: 'var(--ink-primary)', outline: 'none', boxSizing: 'border-box', direction: 'ltr', textAlign: 'center', transition: 'border-color 0.15s' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: 6 }}>CVV</label>
              <input type="password" value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="•••" inputMode="numeric"
                style={{ width: '100%', background: 'var(--bg-page)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', fontSize: 15, color: 'var(--ink-primary)', outline: 'none', boxSizing: 'border-box', direction: 'ltr', textAlign: 'center', transition: 'border-color 0.15s' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
          </div>
        </div>

        {/* Pay button */}
        <button onClick={handlePay} disabled={paying}
          style={{ width: '100%', background: paying ? 'var(--border)' : 'var(--accent)', color: paying ? 'var(--ink-muted)' : '#fff', border: 'none', borderRadius: 'var(--radius-lg)', padding: '16px', fontSize: 16, fontWeight: 700, cursor: paying ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.15s', boxShadow: paying ? 'none' : '0 4px 16px rgba(192,57,43,0.25)' }}
          onMouseDown={e => { if (!paying) e.currentTarget.style.transform = 'scale(0.98)' }}
          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          {paying ? (
            <><div className="hirfa-spin" style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%' }} /> {t('payment.paying')}</>
          ) : (
            <><Lock size={16} /> {t('payment.pay')} {order?.client_price?.toLocaleString('en-US')} {order?.currency}</>
          )}
        </button>

        {/* Security note */}
        <p style={{ fontSize: 11, color: 'var(--ink-muted)', textAlign: 'center', margin: 0 }}>
          🔒 {t('payment.secure')}
        </p>
      </div>
    </div>
  )
}
