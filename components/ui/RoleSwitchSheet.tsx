'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Palette, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react'
import { switchRole } from '@/lib/role-switch'
import { useAppSettings } from '@/lib/theme'
import { toast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'

interface Props {
  currentRole: 'artist' | 'client'
  onClose: () => void
}

export function RoleSwitchSheet({ currentRole, onClose }: Props) {
  const router = useRouter()
  const { lang } = useAppSettings()
  const [loading, setLoading] = useState(false)

  const targetRole = currentRole === 'artist' ? 'client' : 'artist'

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        toast.error(lang === 'en' ? 'Please sign in first' : 'سجّل دخولك أولاً')
        onClose()
      }
    })
  }, [])

  async function handleSwitch() {
    setLoading(true)
    try {
      const result = await switchRole(targetRole)

      if (!result.success) {
        if (result.error === 'requires_artist_profile') {
          toast.error(lang === 'en' ? 'Complete artist registration first' : 'تحتاج إتمام تسجيل الفنان أولاً')
          onClose()
          router.push('/auth/artist')
          return
        }
        if (result.error === 'profile_pending_approval') {
          toast.error(lang === 'en' ? 'Your artist profile is pending approval' : 'ملفك الشخصي قيد المراجعة')
          onClose()
          return
        }
        toast.error(result.error ?? (lang === 'en' ? 'Failed to switch role' : 'فشل تغيير الدور'))
        return
      }

      toast.success(
        targetRole === 'artist'
          ? (lang === 'en' ? 'Switched to Artist mode' : 'تم التحويل لوضع الفنان')
          : (lang === 'en' ? 'Switched to Client mode' : 'تم التحويل لوضع العميل')
      )

      onClose()

      if (targetRole === 'artist') {
        router.replace('/artist/dashboard')
      } else {
        router.replace('/client/home')
      }

      setTimeout(() => window.location.reload(), 500)
    } catch {
      toast.error(lang === 'en' ? 'An error occurred' : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50 }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 430,
          background: 'var(--bg-surface)',
          borderRadius: '20px 20px 0 0',
          zIndex: 51,
          fontFamily: 'Cairo, sans-serif',
          direction: 'rtl',
          paddingBottom: 32,
        }}
      >
        {/* Drag handle + header */}
        <div style={{ padding: '12px 20px 12px' }}>
          <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 auto 16px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', display: 'flex', padding: 4 }}
            >
              <X size={20} />
            </button>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-primary)' }}>
              {lang === 'en' ? 'Switch Mode' : 'تغيير الوضع'}
            </span>
            <div style={{ width: 28 }} />
          </div>
        </div>

        <div style={{ padding: '0 20px 20px' }}>
          {/* Current role */}
          <div style={{ background: 'var(--bg-page)', borderRadius: 'var(--radius-lg)', padding: 16, marginBottom: 12, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {currentRole === 'artist'
                  ? <Palette size={20} color="var(--ink-muted)" />
                  : <ShoppingBag size={20} color="var(--ink-muted)" />}
              </div>
              <div>
                <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: '0 0 2px' }}>
                  {lang === 'en' ? 'Current mode' : 'الوضع الحالي'}
                </p>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-secondary)', margin: 0 }}>
                  {currentRole === 'artist'
                    ? (lang === 'en' ? 'Artist' : 'فنان')
                    : (lang === 'en' ? 'Client' : 'عميل')}
                </p>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
            <ArrowRight size={20} color="var(--ink-muted)" style={{ transform: 'rotate(90deg)' }} />
          </div>

          {/* Target role */}
          <div style={{ background: 'var(--accent-light, #fdf2f0)', borderRadius: 'var(--radius-lg)', padding: 16, marginBottom: 20, border: '1.5px solid var(--accent-border, #f5c6bf)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {targetRole === 'artist'
                  ? <Palette size={20} color="#fff" />
                  : <ShoppingBag size={20} color="#fff" />}
              </div>
              <div>
                <p style={{ fontSize: 12, color: 'var(--accent)', margin: '0 0 2px', fontWeight: 600 }}>
                  {lang === 'en' ? 'Switch to' : 'التحويل إلى'}
                </p>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)', margin: 0 }}>
                  {targetRole === 'artist'
                    ? (lang === 'en' ? 'Artist mode' : 'وضع الفنان')
                    : (lang === 'en' ? 'Client mode' : 'وضع العميل')}
                </p>
              </div>
            </div>
          </div>

          {/* Info note */}
          <div style={{ background: 'var(--bg-page)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 20, border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: 0, lineHeight: 1.6 }}>
              {targetRole === 'artist'
                ? (lang === 'en' ? '💡 You can switch back to client mode anytime from settings' : '💡 يمكنك العودة لوضع العميل في أي وقت من الإعدادات')
                : (lang === 'en' ? '💡 Your artist profile and portfolio remain saved' : '💡 ملفك الشخصي وأعمالك كفنان تبقى محفوظة')}
            </p>
          </div>

          {/* Switch button */}
          <button
            onClick={handleSwitch}
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? 'var(--border)' : 'var(--accent)',
              color: loading ? 'var(--ink-muted)' : '#fff',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              padding: '15px',
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.15s',
              fontFamily: 'Cairo, sans-serif',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(192,57,43,0.25)',
            }}
          >
            {loading ? (
              <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> {lang === 'en' ? 'Switching...' : 'جارٍ التحويل...'}</>
            ) : (
              <>
                {targetRole === 'artist' ? <Palette size={16} /> : <ShoppingBag size={16} />}
                {lang === 'en'
                  ? `Switch to ${targetRole === 'artist' ? 'Artist' : 'Client'} mode`
                  : `التحويل لوضع ${targetRole === 'artist' ? 'الفنان' : 'العميل'}`}
              </>
            )}
          </button>
        </div>
      </div>
    </>
  )
}
