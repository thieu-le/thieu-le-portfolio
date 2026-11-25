// Tiny PostgREST client for Supabase, so the collector needs no dependencies.
// Uses the service_role key, which bypasses RLS. Never ship this key to a browser.

import { config } from './config.ts';

const base = `${config.supabaseUrl}/rest/v1`;
const headers = {
  apikey: config.supabaseServiceKey,
  Authorization: `Bearer ${config.supabaseServiceKey}`,
  'Content-Type': 'application/json',
};

async function check(res: Response, what: string): Promise<void> {
  if (!res.ok) throw new Error(`Supabase ${what} failed: ${res.status} ${await res.text()}`);
}

/** Insert or update rows, matching on the table's primary key (or `onConflict`). */
export async function upsert(table: string, rows: object[], onConflict?: string): Promise<void> {
  if (!rows.length) return;
  const url = new URL(`${base}/${table}`);
  if (onConflict) url.searchParams.set('on_conflict', onConflict);
  for (let i = 0; i < rows.length; i += 500) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(rows.slice(i, i + 500)),
    });
    await check(res, `upsert ${table}`);
  }
}

/** Update rows matching a PostgREST filter, e.g. { puuid: 'eq.abc' }. */
export async function update(table: string, filter: Record<string, string>, patch: object): Promise<void> {
  const url = new URL(`${base}/${table}`);
  for (const [k, v] of Object.entries(filter)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify(patch),
  });
  await check(res, `update ${table}`);
}

/** Select rows with a raw PostgREST query string, e.g. 'select=puuid&platform=eq.na1'. Pages through results. */
export async function select<T>(table: string, query: string): Promise<T[]> {
  const out: T[] = [];
  const page = 1000;
  for (let offset = 0; ; offset += page) {
    const res = await fetch(`${base}/${table}?${query}`, {
      headers: { ...headers, Range: `${offset}-${offset + page - 1}`, 'Range-Unit': 'items' },
    });
    await check(res, `select ${table}`);
    const rows = (await res.json()) as T[];
    out.push(...rows);
    if (rows.length < page) return out;
  }
}

/** Call a Postgres function exposed by PostgREST. */
export async function rpc<T>(fn: string, args: object): Promise<T> {
  const res = await fetch(`${base}/rpc/${fn}`, { method: 'POST', headers, body: JSON.stringify(args) });
  await check(res, `rpc ${fn}`);
  return (await res.json()) as T;
}

export async function remove(table: string, filter: Record<string, string>): Promise<void> {
  const url = new URL(`${base}/${table}`);
  for (const [k, v] of Object.entries(filter)) url.searchParams.set(k, v);
  const res = await fetch(url, { method: 'DELETE', headers: { ...headers, Prefer: 'return=minimal' } });
  await check(res, `delete ${table}`);
}
