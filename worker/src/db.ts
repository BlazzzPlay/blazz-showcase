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

export function insertFunnel(db: D1Database, input: FunnelInput): Promise<void> {
  return confirmed(db.prepare(
    'INSERT INTO contact_funnel_events (session_id,event,source) VALUES (?,?,?)',
  ).bind(input.sessionId, input.event, input.source));
}
