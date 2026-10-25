export interface ContactInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}
export interface FunnelInput {
  sessionId: string;
  event: 'cta_click' | 'form_start' | 'form_submit_success';
  source: 'hero' | 'nav' | 'contact_form';
}

async function confirmed(statement: D1PreparedStatement): Promise<void> {
  const result = await statement.run();
  if (!result.success || result.meta.changes !== 1) throw new Error('Insert not confirmed');
}

export function insertContact(db: D1Database, input: ContactInput): Promise<void> {
  return confirmed(db.prepare(
    'INSERT INTO contact_requests (name,email,subject,message) VALUES (?,?,?,?)',
  ).bind(input.name, input.email, input.subject, input.message));
}

export interface ContactRow {
  id: number; name: string; email: string; subject: string; message: string; is_read: number; created_at: number;
}

export async function listContacts(db: D1Database): Promise<ContactRow[]> {
  const { results } = await db.prepare(
    'SELECT id,name,email,subject,message,is_read,created_at FROM contact_requests ORDER BY created_at DESC, id DESC',
  ).all<ContactRow>();
  return results;
}

// Returns whether exactly one existing row changed; ids are bound, never interpolated.
export async function markContactRead(db: D1Database, id: number): Promise<boolean> {
  const result = await db.prepare('UPDATE contact_requests SET is_read = 1 WHERE id = ?').bind(id).run();
  return result.success && result.meta.changes === 1;
}

export async function deleteContact(db: D1Database, id: number): Promise<boolean> {
  const result = await db.prepare('DELETE FROM contact_requests WHERE id = ?').bind(id).run();
  return result.success && result.meta.changes === 1;
}

export function insertFunnel(db: D1Database, input: FunnelInput): Promise<void> {
  return confirmed(db.prepare(
    'INSERT INTO contact_funnel_events (session_id,event,source) VALUES (?,?,?)',
  ).bind(input.sessionId, input.event, input.source));
}
