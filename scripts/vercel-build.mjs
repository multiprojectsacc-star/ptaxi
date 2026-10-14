import nextEnv from '@next/env';
import {spawnSync} from 'node:child_process';

nextEnv.loadEnvConfig(process.cwd());

const localDatabase = !process.env.VERCEL && Boolean(process.env.PGLITE_DATA_DIR?.trim());
const missing = [];
if (!process.env.DATABASE_URL?.trim() && !localDatabase) missing.push('DATABASE_URL');
if (!process.env.TOMTOM_API_KEY?.trim()) missing.push('TOMTOM_API_KEY');
if (missing.length) {
 console.error(`Deployment configuration is incomplete: ${missing.join(', ')}.`);
 console.error('Connect a PostgreSQL database to this Vercel project and add the TomTom key in Environment Variables for this deployment environment. Then redeploy.');
 process.exit(1);
}
if (process.env.DATABASE_URL && !/^postgres(?:ql)?:\/\//.test(process.env.DATABASE_URL)) {
 console.error('DATABASE_URL must contain a PostgreSQL connection URL. Its value has not been logged.');
 process.exit(1);
}

// Apply tracked schema migrations before publishing code that uses the tables.
// Failed configuration, connection or migration leaves the previous deployment active.
for (const args of [
 ['--import', 'tsx', 'scripts/migrate.ts'],
 ['node_modules/next/dist/bin/next', 'build'],
]) {
 const result = spawnSync(process.execPath, args, {stdio: 'inherit', env: process.env});
 if (result.error || result.status !== 0) process.exit(result.status || 1);
}
