import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const roleHint = searchParams.get('role') ?? 'client'
  const errorBase = roleHint === 'artist' ? `${origin}/auth/artist` : `${origin}/auth/client`

  const cookieStore = await cookies()

  // Collect cookies set by Supabase so we can stamp them onto the redirect response.
  // cookieStore.set() only mutates the request-scoped store; NextResponse.redirect()
  // creates a fresh response that never receives those writes unless we do this.
  const pendingCookies: { name: string; value: string; options: Record<string, unknown> }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(c => pendingCookies.push(c))
        },
      },
    }
  )

  function redirect(url: string) {
    const res = NextResponse.redirect(url)
    pendingCookies.forEach(({ name, value, options }) =>
      res.cookies.set(name, value, options as any)
    )
    return res
  }

  if (!code) {
    if (token_hash && type) {
      const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
      if (error) return redirect(`${errorBase}?error=link_expired`)
    } else {
      return redirect(`${errorBase}?error=no_code`)
    }
  } else {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return redirect(`${errorBase}?error=invalid_link`)
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect(`${errorBase}?error=no_session`)

  const name = (user.user_metadata?.name as string | undefined)
    ?? user.email?.split('@')[0]
    ?? 'مستخدم'

  // Use role from magic-link metadata; ignoreDuplicates protects existing rows (e.g. admins).
  const metaRole = (user.user_metadata?.role as string | undefined) ?? roleHint
  const roleToInsert = metaRole === 'artist' ? 'artist' : metaRole === 'admin' ? 'admin' : 'client'

  await supabase.from('users').upsert(
    { id: user.id, name, phone: '', role: roleToInsert, language: 'ar', theme: 'light' },
    { onConflict: 'id', ignoreDuplicates: true }
  )

  // Read actual DB role for routing
  const { data: userData } = await supabase
    .from('users').select('role').eq('id', user.id).single()

  const role = userData?.role as string | undefined

  if (role === 'admin') return redirect(`${origin}/admin`)

  if (role === 'artist') {
    const { data: profile } = await supabase
      .from('artist_profiles').select('id').eq('user_id', user.id).maybeSingle()
    return redirect(profile ? `${origin}/artist/studio` : `${origin}/auth/artist/complete`)
  }

  return redirect(`${origin}/client/home`)
}
