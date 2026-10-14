import {resolve} from 'node:path';
import {mkdirSync} from 'node:fs';
import postgres from 'postgres';
import {PGlite} from '@electric-sql/pglite';
import {drizzle as postgresDb} from 'drizzle-orm/postgres-js';
import {drizzle as pgliteDb} from 'drizzle-orm/pglite';
import {migrate as migratePostgres} from 'drizzle-orm/postgres-js/migrator';
import {migrate as migratePglite} from 'drizzle-orm/pglite/migrator';
import type {PgDatabase, PgQueryResultHKT} from 'drizzle-orm/pg-core';
import * as schema from './schema';

type Database = PgDatabase<PgQueryResultHKT, typeof schema>;
type Connection = {db: Database; migrate: () => Promise<void>; close: () => Promise<void>};

const state = globalThis as typeof globalThis & {personalTaxiDatabase?: Connection};

function connection(): Connection {
 if (state.personalTaxiDatabase) return state.personalTaxiDatabase;
 const migrationsFolder = resolve(process.cwd(), 'drizzle/postgres');
 if (process.env.DATABASE_URL) {
  const client = postgres(process.env.DATABASE_URL, {prepare: false, max: 3, idle_timeout: 20, connect_timeout: 10});
  const db = postgresDb(client, {schema});
  state.personalTaxiDatabase = {db, migrate: () => migratePostgres(db, {migrationsFolder}), close: () => client.end()};
 } else if (process.env.PGLITE_DATA_DIR && !process.env.VERCEL) {
  // Explicit local PostgreSQL database. Vercel must always use its shared database.
  // Created at runtime for local use; its contents must never enter a deployment.
  const dataDir = resolve(/* turbopackIgnore: true */ process.env.PGLITE_DATA_DIR);
  mkdirSync(dataDir, {recursive: true, mode: 0o700});
  const client = new PGlite(dataDir);
  const db = pgliteDb(client, {schema});
  state.personalTaxiDatabase = {db, migrate: () => migratePglite(db, {migrationsFolder}), close: () => client.close()};
 } else {
  throw new Error('Configure DATABASE_URL for PostgreSQL. Local development can use PGLITE_DATA_DIR.');
 }
 return state.personalTaxiDatabase;
}

export function getDb(): Database {return connection().db;}
export async function migrateDatabase() {await connection().migrate();}
export async function closeDb() {
 const current = state.personalTaxiDatabase;
 state.personalTaxiDatabase = undefined;
 await current?.close();
}
