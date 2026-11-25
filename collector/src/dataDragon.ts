// Data Dragon (Riot's free static data CDN): used to tell completed items from
// components so "core build" means the first 3 finished items.

type DDItem = {
  name: string;
  into?: string[];
  from?: string[];
  tags?: string[];
  gold: { total: number; purchasable: boolean };
  maps?: Record<string, boolean>;
};

export type ItemCatalog = {
  version: string;
  /** Finished non-boots items worth counting toward a core build. */
  isCompleted: (id: number) => boolean;
  /** Upgraded (tier 2) boots. */
  isBoots: (id: number) => boolean;
};

export async function loadItemCatalog(): Promise<ItemCatalog> {
  const versions = (await (await fetch('https://ddragon.leagueoflegends.com/api/versions.json')).json()) as string[];
  const version = versions[0];
  const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/item.json`);
  if (!res.ok) throw new Error(`Data Dragon item.json ${res.status}`);
  const data = ((await res.json()) as { data: Record<string, DDItem> }).data;

  const completed = new Set<number>();
  const boots = new Set<number>();
  for (const [key, item] of Object.entries(data)) {
    const id = Number(key);
    const tags = item.tags ?? [];
    const onRift = item.maps?.['11'] !== false;
    if (!onRift || !item.gold.purchasable) continue;
    if (tags.includes('Boots')) {
      if (item.from?.length) boots.add(id);
      continue;
    }
    if (tags.includes('Trinket') || tags.includes('Consumable')) continue;
    const finished = !item.into || item.into.length === 0;
    if (finished && item.gold.total >= 1600) completed.add(id);
  }

  return {
    version,
    isCompleted: (id) => completed.has(id),
    isBoots: (id) => boots.has(id),
  };
}
