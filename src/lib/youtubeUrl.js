const ID_RE = /^[A-Za-z0-9_-]{11}$/;
const PATH_RE = /^\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{11})/;

export function parseYouTubeUrl(input) {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (ID_RE.test(trimmed)) return { id: trimmed, start: 0 };

  let url;
  try {
    url = new URL(/^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^(?:www\.|m\.)/, '');
  let id = null;

  if (host === 'youtu.be') {
    id = url.pathname.split('/').filter(Boolean)[0] ?? null;
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') {
      id = url.searchParams.get('v');
    } else {
      const m = url.pathname.match(PATH_RE);
      if (m) id = m[1];
    }
  }

  if (!id || !ID_RE.test(id)) return null;

  const start = parseTimeParam(url.searchParams.get('t') ?? url.searchParams.get('start'));
  return { id, start };
}

function parseTimeParam(t) {
  if (!t) return 0;
  if (/^\d+$/.test(t)) return parseInt(t, 10);
  const m = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
  if (!m) return 0;
  return (
    parseInt(m[1] ?? '0', 10) * 3600 +
    parseInt(m[2] ?? '0', 10) * 60 +
    parseInt(m[3] ?? '0', 10)
  );
}

export function isValidYouTubeUrl(input) {
  return parseYouTubeUrl(input) !== null;
}
