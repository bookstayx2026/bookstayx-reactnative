// Vercel Serverless Function entry point for BookStayX Express API
// Repository: bookstayx2026/bookstayx-reactnative

const app = require('../backend/app');

/**
 * Normalizes incoming request paths for Express routing.
 * When Vercel rewrites /api/(.*) or /webhook, it maps the request to this serverless function.
 * This helper ensures the path seen by Express always preserves expected mounts:
 * - Keeps /api/* intact
 * - Prepends /api if subpath-only was forwarded
 * - Preserves root-level /webhook and /health routes
 */
function resolveRequestUrl(req) {
  let targetUrl = req.url || '/';
  const matchedPath = req.headers['x-matched-path'];
  const forwardedUri = req.headers['x-forwarded-uri'];

  // Recover target URL if squashed to /api or / by a proxy
  if ((targetUrl === '/api' || targetUrl === '/' || targetUrl === '') && (matchedPath || forwardedUri)) {
    targetUrl = matchedPath || forwardedUri;
  }

  // Prepend /api if path is missing /api, /webhook, or /health
  if (
    !targetUrl.startsWith('/api') &&
    !targetUrl.startsWith('/webhook') &&
    !targetUrl.startsWith('/health')
  ) {
    targetUrl = `/api${targetUrl.startsWith('/') ? '' : '/'}${targetUrl}`;
  }

  return targetUrl;
}

// Export standard Node.js / Vercel Serverless Function handler
module.exports = (req, res) => {
  req.url = resolveRequestUrl(req);
  return app(req, res);
};
