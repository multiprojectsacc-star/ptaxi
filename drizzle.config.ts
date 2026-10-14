import { defineConfig } from "drizzle-kit";
import nextEnv from '@next/env';

nextEnv.loadEnvConfig(process.cwd());

export default defineConfig({
  out: "./drizzle/postgres",
  schema: "./db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {url: process.env.DATABASE_URL || ''},
});
