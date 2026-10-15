const isPrivateIpv4 = (hostname) => {
  const parts = hostname.split('.').map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  return (
    parts[0] === 10 ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  );
};

const isDevelopmentHost = (hostname) =>
  hostname === 'localhost' ||
  hostname === '127.0.0.1' ||
  hostname === '::1' ||
  isPrivateIpv4(hostname);

const normalizeOrigin = (origin) => {
  if (!origin || typeof origin !== 'string') return '';
  const trimmed = origin.trim();
  try {
    const parsed = new URL(trimmed);
    return parsed.origin.toLowerCase();
  } catch {
    return trimmed.toLowerCase().replace(/\/+$/, '');
  }
};

const isBookStayXDomain = (hostname) => {
  const lower = hostname.toLowerCase();
  return (
    lower === 'bookstayx.com' ||
    lower.endsWith('.bookstayx.com') ||
    lower.endsWith('.vercel.app')
  );
};

const isCorsOriginAllowed = (origin, environment) => {
  if (!origin) {
    return true;
  }

  const normalizedOrigin = normalizeOrigin(origin);
  const rawOrigins = environment?.corsOrigins || [];
  const normalizedConfigured = rawOrigins.map(normalizeOrigin);

  if (rawOrigins.includes(origin) || normalizedConfigured.includes(normalizedOrigin)) {
    return true;
  }

  try {
    const parsed = new URL(origin);
    const isHttps = parsed.protocol === 'https:';
    const isHttp = parsed.protocol === 'http:';

    // Allow official BookStayX domains and preview deployments over HTTPS
    if (isHttps && isBookStayXDomain(parsed.hostname)) {
      return true;
    }

    if (environment?.nodeEnv === 'production') {
      return false;
    }

    return (isHttp || isHttps) && isDevelopmentHost(parsed.hostname);
  } catch {
    return false;
  }
};

module.exports = { isCorsOriginAllowed, normalizeOrigin, isBookStayXDomain };
