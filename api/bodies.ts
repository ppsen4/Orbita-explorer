import { fetchSolarBodies } from '../server/solarProxy';

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const token = process.env.SOLAR_API_TOKEN;
  if (!token) {
    return res.status(503).json({ error: 'A variável SOLAR_API_TOKEN ainda não foi configurada.' });
  }

  try {
    const result = await fetchSolarBodies(token);
    return res.status(result.status).json(result.payload);
  } catch {
    return res.status(502).json({ error: 'Não foi possível alcançar a API do Sistema Solar. Tente novamente.' });
  }
}
