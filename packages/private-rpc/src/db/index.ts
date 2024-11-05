import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { env } from '../env.js';

const db = drizzle(env.DATABASE_URL);