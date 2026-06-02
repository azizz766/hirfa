'use client'

import { useRouter, usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingBag, FileText, Image, LayoutGrid } from 'lucide-react'
import { useTranslation, useAppSettings } from '@/lib/theme'

export function ArtistNav() {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslation()
  const { lang } = useAppSettings()

  const NAV = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/artist/dashboard' },
    { icon: ShoppingBag,     label: t('nav.myorders'),  path: '/artist/orders' },
    { icon: FileText,        label: t('nav.briefs'),    path: '/artist/briefs' },
    { icon: Image,           label: t('nav.portfolio'), path: '/artist/portfolio' },
    { icon: LayoutGrid,      label: lang === 'en' ? 'Studio' : 'الاستوديو', path: '/artist/studio' },
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
