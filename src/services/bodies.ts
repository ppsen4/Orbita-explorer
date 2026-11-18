import type { SolarBodiesResponse } from '../types';

const apiBaseUrl = import.meta.env.VITE_SOLAR_API_BASE_URL;
const apiUrl = apiBaseUrl ? new URL('/api/bodies', apiBaseUrl).toString() : '/api/bodies';

export async function loadBodies(): Promise<SolarBodiesResponse> {
  const response = await fetch(apiUrl, { headers: { Accept: 'application/json' } });
  const payload = await response.json().catch(() => ({})) as SolarBodiesResponse;
  if (!response.ok) {
    throw new Error(payload.error || `Falha ao consultar os corpos celestes (HTTP ${response.status}).`);
  }
  if (!Array.isArray(payload.bodies)) {
    throw new Error('A API respondeu em um formato inesperado.');
  }
  return payload;
}
