export function Skel({ w, h, r = 8 }: { w?: number | string; h: number; r?: number }) {
  return (
    <div
      style={{
        width: w ?? '100%',
        height: h,
        borderRadius: r,
        background: '#E8E0D8',
        animation: 'hirfa-pulse 1.4s ease-in-out infinite',
        flexShrink: 0,
      }}
    />
  )
}