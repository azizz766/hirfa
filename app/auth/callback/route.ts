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

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  if (!code) {
    if (token_hash && type) {
      const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
      if (error) {
        return NextResponse.redirect(`${errorBase}?error=link_expired`)
      }
    } else {
      return NextResponse.redirect(`${errorBase}?error=no_code`)
    }
  } else {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(`${errorBase}?error=invalid_link`)
    }
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const name = (user.user_metadata?.name as string | undefined)
      ?? user.email?.split('@')[0]
      ?? 'مستخدم'

    // Use the role from magic-link metadata so artists don't get inserted as 'client'.
    // ignoreDuplicates: true — never overwrites an existing row's role (protects admins).
    const metaRole = (user.user_metadata?.role as string | undefined) ?? roleHint
    const roleToInsert = metaRole === 'artist' ? 'artist' : metaRole === 'admin' ? 'admin' : 'client'

    await supabase.from('users').upsert(
      {
        id: user.id,
        name,
        phone: '',
        role: roleToInsert,
        language: 'ar',
        theme: 'light',
      },
      { onConflict: 'id', ignoreDuplicates: true }
    )
  }

  // Read actual DB role for routing
  const { data: userData } = user
    ? await supabase.from('users').select('role').eq('id', user.id).single()
    : { data: null }

  const role = userData?.role as string | undefined

  if (role === 'admin') {
    return NextResponse.redirect(`${origin}/admin`)
  }

  if (role === 'artist') {
    const { data: profile } = await supabase
      .from('artist_profiles')
      .select('id')
      .eq('user_id', user!.id)
      .maybeSingle()

    return NextResponse.redirect(
      profile ? `${origin}/artist/studio` : `${origin}/auth/artist/complete`
    )
  }

  return NextResponse.redirect(`${origin}/client/home`)
}
