import type { Ledger, LedgerSnapshot } from "@pade/registry";
import pg from "pg";

const KEY = "snapshot";

export async function openPostgres(url: string): Promise<Ledger> {
  const pool = new pg.Pool({ connectionString: url, max: 4 });
  await pool.query(`create table if not exists pade_document (
    key text primary key,
    body jsonb not null,
    updated_at timestamptz not null default now()
  )`);
  return {
    async load() {
      const result = await pool.query<{ body: LedgerSnapshot }>("select body from pade_document where key = $1", [KEY]);
      return result.rows[0]?.body ?? null;
    },
    async save(snapshot: LedgerSnapshot) {
      await pool.query(
        `insert into pade_document (key, body, updated_at) values ($1, $2::jsonb, now())
         on conflict (key) do update set body = excluded.body, updated_at = now()`,
        [KEY, JSON.stringify(snapshot)],
      );
    },
  };
}
