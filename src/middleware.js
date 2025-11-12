import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/feed',
  '/search',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/how-it-works',
  '/faq',
  '/docs(.*)',
  '/api/webhooks(.*)',
  '/api/apps(.*)',
]);

export default clerkMiddleware((auth, req) => {
  // Allow public routes without authentication
  if (isPublicRoute(req)) {
    return;
  }
  
  // For protected routes, require authentication
  // Note: We don't use auth().protect() because it redirects
  // Instead, API routes will check userId manually
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
