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

const isCorsOriginAllowed = (origin, environment) => {
  if (!origin || environment.corsOrigins.includes(origin)) {
    return true;
  }

  if (environment.nodeEnv === 'production') {
    return false;
  }

  try {
    const parsed = new URL(origin);
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      isDevelopmentHost(parsed.hostname)
    );
  } catch {
    return false;
  }
};

module.exports = { isCorsOriginAllowed };
