import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Next.js Middleware.
 * Updates the Supabase session for every request to ensure authentication persistence.
 *
 * @param request - The incoming NextRequest.
 * @returns The response with updated session cookies.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

/**
 * Configuration for the middleware matcher.
 * Excludes static files and images.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
