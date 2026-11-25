// Region and lane filters, shared by server pages and client components.
// URLs use short names: ?region=na,euw&lane=top

export const REGIONS = [
  { platform: "na1", slug: "na", label: "NA" },
  { platform: "euw1", slug: "euw", label: "EUW" },
  { platform: "kr", slug: "kr", label: "KR" },
] as const;

export const LANES = [
  { position: "TOP", slug: "top", label: "Top" },
  { position: "JUNGLE", slug: "jungle", label: "Jungle" },
  { position: "MIDDLE", slug: "mid", label: "Mid" },
  { position: "BOTTOM", slug: "bot", label: "Bot" },
  { position: "UTILITY", slug: "support", label: "Support" },
] as const;

export const ALL_PLATFORMS: string[] = REGIONS.map((r) => r.platform);

/** "na,kr" -> ["na1", "kr"]. Missing, empty or unknown -> every region. */
export function parseRegions(raw: string | string[] | undefined | null): string[] {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const wanted = new Set((value ?? "").toLowerCase().split(",").map((s) => s.trim()));
  const picked = REGIONS.filter((r) => wanted.has(r.slug)).map((r) => r.platform);
  return picked.length ? picked : ALL_PLATFORMS;
}

/** "mid" -> "MIDDLE"; anything else -> undefined. */
export function parseLane(raw: string | string[] | undefined | null): string | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return LANES.find((l) => l.slug === value?.toLowerCase())?.position;
}

export const laneSlug = (position: string) => LANES.find((l) => l.position === position)?.slug;
export const laneLabel = (position: string) => LANES.find((l) => l.position === position)?.label ?? position;

/** Builds "?region=na,euw&lane=top", leaving out defaults. */
export function filterSearch(platforms: string[], position?: string, extra: Record<string, string> = {}): string {
  const params = new URLSearchParams();
  if (platforms.length && platforms.length < REGIONS.length) {
    params.set("region", REGIONS.filter((r) => platforms.includes(r.platform)).map((r) => r.slug).join(","));
  }
  const lane = position && laneSlug(position);
  if (lane) params.set("lane", lane);
  for (const [k, v] of Object.entries(extra)) params.set(k, v);
  const s = params.toString().replaceAll("%2C", ",");
  return s ? `?${s}` : "";
}

/** Toggles one region; never leaves the selection empty. */
export function toggleRegion(platforms: string[], platform: string): string[] {
  if (!platforms.includes(platform)) return ALL_PLATFORMS.filter((p) => p === platform || platforms.includes(p));
  const next = platforms.filter((p) => p !== platform);
  return next.length ? next : platforms;
}
