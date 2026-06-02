'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { tr, Lang } from './i18n'

type Theme = 'light' | 'dark' | 'auto'

interface AppSettings {
  theme: Theme
  lang: Lang
  notifs: boolean
  setTheme: (t: Theme) => void
  setLang: (l: Lang) => void
  setNotifs: (n: boolean) => void
}

const Ctx = createContext<AppSettings>({
  theme: 'light', lang: 'ar', notifs: true,
  setTheme: () => {}, setLang: () => {}, setNotifs: () => {},
})

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [lang, setLangState] = useState<Lang>('ar')
  const [notifs, setNotifsState] = useState(true)

  useEffect(() => {
    const t = (localStorage.getItem('hirfa_theme') as Theme) || 'light'
    const l = (localStorage.getItem('hirfa_lang') as Lang) || 'ar'
    const n = localStorage.getItem('hirfa_notifs') !== 'false'
    setThemeState(t)
    setLangState(l)
    setNotifsState(n)
    applyTheme(t)
    applyLang(l)
  }, [])

  function applyTheme(t: Theme) {
    const root = document.documentElement
    if (t === 'dark') {
      root.setAttribute('data-theme', 'dark')
    } else if (t === 'auto') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.setAttribute('data-theme', isDark ? 'dark' : 'light')
    } else {
      root.setAttribute('data-theme', 'light')
    }
  }

  function applyLang(l: Lang) {
    document.documentElement.setAttribute('lang', l)
    document.documentElement.setAttribute('dir', 'rtl')
  }

  function setTheme(t: Theme) {
    setThemeState(t)
    localStorage.setItem('hirfa_theme', t)
    applyTheme(t)
  }

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem('hirfa_lang', l)
    applyLang(l)
  }

  function setNotifs(n: boolean) {
    setNotifsState(n)
    localStorage.setItem('hirfa_notifs', String(n))
    if (n && 'Notification' in window) {
      Notification.requestPermission()
    }
  }

  return <Ctx.Provider value={{ theme, lang, notifs, setTheme, setLang, setNotifs }}>{children}</Ctx.Provider>
}

export const useAppSettings = () => useContext(Ctx)

export function useTranslation() {
  const { lang } = useAppSettings()
  return (key: string) => tr(key, lang as Lang)
}
