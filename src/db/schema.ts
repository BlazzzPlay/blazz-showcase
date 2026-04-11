import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const funnelEvents = ['cta_click', 'form_start', 'form_submit_success'] as const;
export const funnelSources = ['hero', 'nav', 'contact_form'] as const;

export const contactRequests = sqliteTable('contact_requests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const contactFunnelEvents = sqliteTable('contact_funnel_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: text('session_id').notNull(),
  event: text('event', { enum: funnelEvents }).$type<(typeof funnelEvents)[number]>().notNull(),
  source: text('source', { enum: funnelSources }).$type<(typeof funnelSources)[number]>().notNull().default('contact_form'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
