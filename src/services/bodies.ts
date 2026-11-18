import type { SolarBodiesResponse } from '../types';

export async function loadBodies(): Promise<SolarBodiesResponse> {
  const response = await fetch('/api/bodies', { headers: { Accept: 'application/json' } });
  const payload = await response.json().catch(() => ({})) as SolarBodiesResponse;
  if (!response.ok) {
    throw new Error(payload.error || `Falha ao consultar os corpos celestes (HTTP ${response.status}).`);
  }
  if (!Array.isArray(payload.bodies)) {
    throw new Error('A API respondeu em um formato inesperado.');
  }
  return payload;
}
