'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Home, Compass, ShoppingBag, MessageSquare, User } from 'lucide-react'
import { useTranslation } from '@/lib/theme'

export function ClientNav() {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslation()

  const NAV = [
    { icon: Home,          label: t('nav.home'),     path: '/client/home' },
    { icon: Compass,       label: t('nav.discover'), path: '/client/discover' },
    { icon: ShoppingBag,   label: t('nav.orders'),   path: '/client/my-orders' },
    { icon: MessageSquare, label: t('nav.messages'), path: '/client/messages' },
    { icon: User,          label: t('nav.account'),  path: '/client/profile' },
  ]

  return (
    <nav
      aria-label="التنقل الرئيسي"
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 430,
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '10px 0 22px',
        zIndex: 20,
      }}
    >
      {NAV.map(({ icon: Icon, label, path }) => {
        const active = pathname === path
        return (
          <button
            key={path}
            onClick={() => router.push(path)}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: active ? 'var(--accent)' : 'var(--ink-muted)',
              fontSize: 10,
              fontWeight: active ? 600 : 400,
              padding: '0 8px',
              minWidth: 48,
              minHeight: 48,
              justifyContent: 'center',
              transition: 'transform 0.1s, color 0.15s',
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.92)' }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.92)' }}
            onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            <Icon size={21} />
            {label}
          </button>
        )
      })}
    </nav>
  )
}
