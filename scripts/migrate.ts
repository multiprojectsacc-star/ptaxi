import nextEnv from '@next/env';
import {migrateDatabase, closeDb} from '../db/client';

nextEnv.loadEnvConfig(process.cwd());
try {
 await migrateDatabase();
 console.log('PostgreSQL migrations applied.');
} catch (error) {
 // Database errors can include connection details. Keep terminal output safe.
 console.error('Database migration failed:', error instanceof Error ? error.name : 'UnknownError');
 process.exitCode = 1;
} finally {
 try {await closeDb();} catch {process.exitCode = 1;}
}
