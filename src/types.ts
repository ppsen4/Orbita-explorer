export type SolarBody = {
  id: string;
  name?: string;
  englishName?: string;
  isPlanet?: boolean;
  bodyType?: string;
  moons?: { moon: string; rel?: string }[] | null;
  aroundPlanet?: { planet?: string } | null;
  semimajorAxis?: number | null;
  meanRadius?: number | null;
  gravity?: number | null;
  avgTemp?: number | null;
  sideralOrbit?: number | null;
  discoveryDate?: string | null;
};

export type SolarBodiesResponse = {
  bodies: SolarBody[];
  total?: number;
  error?: string;
};
