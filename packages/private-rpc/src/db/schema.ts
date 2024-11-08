import { integer, pgTable, varchar } from 'drizzle-orm/pg-core';
import { hexRow } from '@/db/hex-row';

export const usersTable = pgTable('users', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  token: varchar('token', { length: 255 }).unique().notNull(),
  address: hexRow('address').notNull(),
});
