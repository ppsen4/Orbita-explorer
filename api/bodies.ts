const API_FIELDS = [
  'id', 'name', 'englishName', 'isPlanet', 'bodyType', 'moons', 'aroundPlanet',
  'semimajorAxis', 'meanRadius', 'gravity', 'avgTemp', 'sideralOrbit', 'discoveryDate',
].join(',');

const ALLOWED_ORIGINS = new Set([
  'https://ppsen4.github.io',
]);

export default async function handler(req: any, res: any) {
  const origin = req.headers?.origin;
  if (typeof origin === 'string' && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Accept, Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const token = process.env.SOLAR_API_TOKEN;
  if (!token) {
    return res.status(503).json({ error: 'A variável SOLAR_API_TOKEN ainda não foi configurada.' });
  }

  try {
    const base = (process.env.SOLAR_API_BASE || 'https://api.le-systeme-solaire.net/rest/').replace(/\/?$/, '/');
    const endpoint = new URL('bodies/', base);
    endpoint.searchParams.set('data', API_FIELDS);
    endpoint.searchParams.set('order', 'englishName,asc');
    endpoint.searchParams.set('page', '1,200');

    const response = await fetch(endpoint, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(12_000),
    });

    if (!response.ok) {
      const message = response.status === 401 || response.status === 403
        ? 'O token do Le Système Solaire está ausente ou é inválido. Confira SOLAR_API_TOKEN.'
        : response.status === 429
          ? 'A API do Sistema Solar está temporariamente limitando solicitações. Tente novamente em instantes.'
          : `A API do Sistema Solar respondeu com erro HTTP ${response.status}.`;
      return res.status(response.status).json({ error: message });
    }

    const result = await response.json() as { bodies?: unknown[]; total?: number };
    return res.status(200).json({
      bodies: Array.isArray(result.bodies) ? result.bodies : [],
      total: result.total,
    });
  } catch {
    return res.status(502).json({ error: 'Não foi possível alcançar a API do Sistema Solar. Tente novamente.' });
  }
}
