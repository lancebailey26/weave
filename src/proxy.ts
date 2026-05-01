import { clerkMiddleware } from '@clerk/nextjs/server'

const clerkSecretKey = process.env.CLERK_SECRET_KEY

if (!clerkSecretKey) {
  throw new Error(
    'Missing CLERK_SECRET_KEY. Add it to your environment (for local dev, .env.local; for Vercel, project env vars) and restart the server.'
  )
}

export default clerkMiddleware()

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}