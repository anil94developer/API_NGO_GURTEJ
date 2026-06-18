const isProduction =
  process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

const sessionCookieOptions = {
  secure: isProduction,
  httpOnly: true,
  maxAge: 1000 * 60 * 60 * 24 * 7,
  sameSite: isProduction ? 'none' : 'lax',
};

const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://admin-gno-gurtej.onrender.com',
  'https://admin-ngo-gurtej.onrender.com',
  'https://frontend-ngo-gurtej.onrender.com',
  'https://ngo-gurtej.onrender.com',
  'https://www.onehopeconnections.site',
  'https://onehopeconnections.site',
];

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  const allowed = new Set([
    ...DEFAULT_ORIGINS,
    process.env.CLIENT_URL,
    process.env.ADMIN_URL,
  ].filter(Boolean));

  if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(',').forEach((o) => {
      const trimmed = o.trim();
      if (trimmed) allowed.add(trimmed);
    });
  }

  if (allowed.has(origin)) return true;
  if (isProduction && origin.endsWith('.onrender.com')) return true;

  // Allow www and non-www variants of CLIENT_URL
  if (process.env.CLIENT_URL) {
    try {
      const clientHost = new URL(process.env.CLIENT_URL).hostname;
      const originHost = new URL(origin).hostname;
      if (originHost === clientHost || originHost === `www.${clientHost}` || `www.${originHost}` === clientHost) {
        return true;
      }
    } catch {
      // ignore invalid URLs
    }
  }

  return false;
};

module.exports = { isProduction, sessionCookieOptions, isAllowedOrigin };
