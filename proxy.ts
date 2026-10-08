import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Session refresh for Supabase SSR auth.
 *
 * NOTE (spec deviation): the spec asked for `middleware.ts`, but Next.js 16
 * deprecated the middleware file convention in favor of `proxy.ts`
 * (same behavior, new name). This file replaces middleware.ts.
 *
 * Runs before routes render; refreshes the auth session so Server
 * Components and Route Handlers see the current user. Skips the public
 * keyed API and the Stripe webhook (neither uses sessions).
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return supabaseResponse;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Refresh the session when expired; no redirect logic here (the
  // dashboard pages themselves handle unauthenticated users).
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all paths except: Next internals, static assets, the public
     * keyed metering API (Bearer auth, no session), and the Stripe webhook
     * (signature auth, no session).
     */
    '/((?!_next/static|_next/image|favicon.ico|api/v1|api/stripe/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
