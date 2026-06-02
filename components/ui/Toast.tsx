'use client'

import { Toaster, toast as sonnerToast } from 'sonner'

export function HirfaToaster() {
  return (
    <Toaster
      position="top-center"
      dir="rtl"
      toastOptions={{
        style: {
          fontFamily: 'Cairo, sans-serif',
          fontSize: 14,
          borderRadius: 12,
          border: '1px solid #E8E0D8',
          background: 'var(--bg-surface)',
          color: '#111111',
          direction: 'rtl',
          textAlign: 'right',
        },
      }}
    />
  )
}

export const toast = {
  success: (msg: string) => sonnerToast.success(msg),
  error: (msg: string) => sonnerToast.error(msg),
  info: (msg: string) => sonnerToast(msg),
  loading: (msg: string) => sonnerToast.loading(msg),
}
