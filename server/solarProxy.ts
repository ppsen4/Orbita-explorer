const API_FIELDS = [
  'id', 'name', 'englishName', 'isPlanet', 'bodyType', 'moons', 'aroundPlanet',
  'semimajorAxis', 'meanRadius', 'gravity', 'avgTemp', 'sideralOrbit', 'discoveryDate',
].join(',');

type ApiFailure = { error: string };
type ApiSuccess = { bodies: unknown[]; total?: number };

export async function fetchSolarBodies(token: string): Promise<{ status: number; payload: ApiSuccess | ApiFailure }> {
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
    return { status: response.status, payload: { error: message } };
  }

  const result = await response.json() as { bodies?: unknown[]; total?: number };
  return {
    status: 200,
    payload: { bodies: Array.isArray(result.bodies) ? result.bodies : [], total: result.total },
  };
}
