import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const contactRequests = sqliteTable('contact_requests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
