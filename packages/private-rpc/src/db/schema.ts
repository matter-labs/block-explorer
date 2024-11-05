import { integer, pgTable, varchar } from 'drizzle-orm/pg-core';
import { hexRow } from './hex-row.js';

export const usersTable = pgTable('users', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  token: varchar('token', { length: 255 }),
  address: hexRow('address'),
});
