/**
 * authFetch — automatic JWT access-token injection + silent refresh on 401.
 *
 * Call `initAuthFetch()` ONCE in each app entry point (main.tsx, main-admin.tsx,
 * main-owner.tsx, main-referral.tsx). After that, all `fetch()` calls to /api/*
 * will automatically:
 *   1. Inject the correct Authorization header.
 *   2. On 401: transparently refresh the access token and retry the request.
 *   3. On refresh failure: clear all session tokens (the component's existing
 *      401-handling / logout logic then fires as a safe fallback).
 *
 * ── Token timing ──────────────────────────────────────────────────────────────
 *   Access token expiry  → ACCESS_TOKEN_EXPIRY  in backend/utils/jwt.js
 *   Refresh token expiry → REFRESH_TOKEN_EXPIRY_DAYS in backend/repositories/refreshTokenRepository.js
 *
 * ── localStorage keys ─────────────────────────────────────────────────────────
 *   Admin    : adminToken (access)       adminRefreshToken (refresh)
 *   Owner    : ownerToken (access)       ownerRefreshToken (refresh)
 *   Referral : referral_token (access)   referral_refresh_token (refresh)
 */

interface SessionConfig {
  accessKey: string;
  refreshKey: string;
  loginPath: string;
}

const SESSIONS: SessionConfig[] = [
  { accessKey: 'adminToken',      refreshKey: 'adminRefreshToken',       loginPath: '/admin/login' },
  { accessKey: 'ownerToken',      refreshKey: 'ownerRefreshToken',       loginPath: '/owner/login' },
  { accessKey: 'referral_token',  refreshKey: 'referral_refresh_token',  loginPath: '/login' },
];

/** Returns the first session that has an active access token. */
function getActiveSession(): SessionConfig | undefined {
  return SESSIONS.find((s) => localStorage.getItem(s.accessKey));
}

/** Returns the first session that has a refresh token stored. */
function getRefreshSession(): SessionConfig | undefined {
  return SESSIONS.find((s) => localStorage.getItem(s.refreshKey));
}

// In-flight refresh promise — shared across concurrent 401s to avoid race conditions.
let _refreshPromise: Promise<boolean> | null = null;

/** Attempt a token refresh. Returns true on success, false on failure. */
async function tryRefresh(nativeFetch: typeof fetch): Promise<boolean> {
  // Coalesce concurrent refresh attempts into a single request.
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async (): Promise<boolean> => {
    const session = getRefreshSession();
    if (!session) return false;

    const rawRefreshToken = localStorage.getItem(session.refreshKey);
    if (!rawRefreshToken) return false;

    try {
      const res = await nativeFetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rawRefreshToken }),
      });

      if (!res.ok) {
        // Refresh token is expired / revoked — clear all session data.
        SESSIONS.forEach((s) => {
          localStorage.removeItem(s.accessKey);
          localStorage.removeItem(s.refreshKey);
        });
        localStorage.removeItem('adminUser');
        localStorage.removeItem('ownerData');
        localStorage.removeItem('ownerLoggedIn');
        return false;
      }

      const data = await res.json();
      localStorage.setItem(session.accessKey, data.accessToken);
      localStorage.setItem(session.refreshKey, data.refreshToken);
      return true;
    } catch {
      return false;
    }
  })().finally(() => {
    _refreshPromise = null;
  });

  return _refreshPromise;
}

/** True once initAuthFetch has been called so we don't double-patch. */
let _initialised = false;

/**
 * Monkey-patches window.fetch to inject auth headers and handle 401s.
 * Call once at app startup — safe to call multiple times (no-ops after first).
 */
export function initAuthFetch(): void {
  if (_initialised || typeof window === 'undefined') return;
  _initialised = true;

  const nativeFetch = window.fetch.bind(window);

  window.fetch = async function patchedFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    // Resolve the URL string regardless of input type.
    const urlStr =
      input instanceof Request
        ? input.url
        : input instanceof URL
          ? input.toString()
          : String(input);

    // Only intercept calls to our own API.
    const isApiCall =
      urlStr.startsWith('/api/') ||
      urlStr.includes(window.location.origin + '/api/');

    // Never intercept the refresh endpoint itself (would cause infinite loop).
    const isRefreshEndpoint = urlStr.includes('/api/auth/refresh');

    if (!isApiCall || isRefreshEndpoint) {
      return nativeFetch(input, init);
    }

    // ── Inject Authorization header ────────────────────────────────────────
    const headers = new Headers(
      init?.headers instanceof Headers
        ? init.headers
        : (init?.headers as Record<string, string> | undefined) ?? {},
    );

    if (!headers.has('Authorization')) {
      const session = getActiveSession();
      const token = session ? localStorage.getItem(session.accessKey) : null;
      if (token) headers.set('Authorization', `Bearer ${token}`);
    }

    // ── First attempt ──────────────────────────────────────────────────────
    const response = await nativeFetch(input, { ...init, headers });

    // ── Handle 401 with token refresh ──────────────────────────────────────
    if (response.status === 401 && headers.has('Authorization')) {
      const refreshed = await tryRefresh(nativeFetch);
      if (refreshed) {
        // Retry the original request with the new access token.
        const retryHeaders = new Headers(
          init?.headers instanceof Headers
            ? init.headers
            : (init?.headers as Record<string, string> | undefined) ?? {},
        );
        const newSession = getActiveSession();
        const newToken = newSession
          ? localStorage.getItem(newSession.accessKey)
          : null;
        if (newToken) retryHeaders.set('Authorization', `Bearer ${newToken}`);
        return nativeFetch(input, { ...init, headers: retryHeaders });
      }
      // Refresh failed — return the 401 so component-level logout handlers fire.
    }

    return response;
  };
}

/**
 * Programmatic logout helper — invalidates the refresh token on the server
 * and clears all session data from localStorage.
 * Components can call this directly instead of (or in addition to) their own
 * logout logic.
 */
export async function serverLogout(): Promise<void> {
  const session = getRefreshSession();
  const rawRefreshToken = session ? localStorage.getItem(session.refreshKey) : null;

  // Best-effort server-side invalidation (fire and forget).
  if (rawRefreshToken) {
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rawRefreshToken }),
    }).catch(() => {/* ignore network errors on logout */});
  }

  // Clear all session data immediately.
  SESSIONS.forEach((s) => {
    localStorage.removeItem(s.accessKey);
    localStorage.removeItem(s.refreshKey);
  });
  localStorage.removeItem('adminUser');
  localStorage.removeItem('ownerData');
  localStorage.removeItem('ownerLoggedIn');
}
