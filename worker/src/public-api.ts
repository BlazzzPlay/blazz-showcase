import type { Env } from './env.ts';
import { insertContact, insertFunnel, type ContactInput, type FunnelInput } from './db.ts';

export type ApiResponse = { success: true; message?: string } | {
  success: false; message: string; fieldErrors?: Record<string, string[]>;
};
const MAX_BODY = 16 * 1024;
const headers = { 'cache-control': 'no-store' };
function json(body: ApiResponse, status = 200): Response {
  return Response.json(body, { status, headers });
}
function failure(message: string, status: number): Response {
  return json({ success: false, message }, status);
}

// Count bytes while streaming: Content-Length alone is neither required nor trusted.
async function readBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('json');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY) { await reader.cancel(); throw new Error('size'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}

// Release an unread upload before rejecting so keep-alive bridges never reuse a half-read connection.
async function reject(request: Request, response: Response): Promise<Response> {
  if (request.body && !request.bodyUsed) await request.body.cancel().catch(() => undefined);
  return response;
}

export async function publicApi(request: Request, env: Env, contact: boolean): Promise<Response> {
  if (request.method !== 'POST') {
    const response = failure('Método no permitido.', 405);
    response.headers.set('allow', 'POST');
    return reject(request, response);
  }
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return reject(request, failure('Origen no permitido.', 403));
  }
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return reject(request, failure('Envía JSON con Content-Type application/json.', 415));
  }
  let body: unknown;
  try { body = await readBody(request); }
  catch (error) {
    return error instanceof Error && error.message === 'size'
      ? failure('Solicitud demasiado grande.', 413) : failure('JSON inválido.', 400);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return failure('Campos inválidos.', 400);
  const values = body as Record<string, unknown>;
  const allowed = contact ? ['name', 'email', 'subject', 'message'] : ['sessionId', 'event', 'source'];
  if (Object.keys(values).some(key => !allowed.includes(key))) return failure('Campos no permitidos.', 400);
  const fieldErrors: Record<string, string[]> = {};
  function text(field: string, min: number, max: number, message: string): string {
    const value = typeof values[field] === 'string' ? values[field].trim() : '';
    if (value.length < min || value.length > max) fieldErrors[field] = [message];
    return value;
  }
  let input: ContactInput | FunnelInput;
  if (contact) {
    const name = text('name', 2, 100, '😊 Cuéntame tu nombre, ¡me gusta saber con quién hablo! (2–100 caracteres)');
    const email = text('email', 3, 254, '📧 Hmm, ese email no parece válido. ¿Podrías revisarlo?');
    // Conservative ASCII email validation, matching the existing client validator.
    if (!/^[A-Za-z0-9_'+\-.]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/.test(email)
      || email.startsWith('.') || email.includes('..') || email.includes('.@')) {
      fieldErrors.email = ['📧 Hmm, ese email no parece válido. ¿Podrías revisarlo?'];
    }
    input = { name, email,
      subject: text('subject', 3, 200, '💡 Dame una pista de qué se trata tu proyecto (3–200 caracteres)'),
      message: text('message', 10, 4000, '🤝 Ten confianza, ¡explícame tu idea con más detalle! Así te puedo ayudar mejor. (10–4000 caracteres)'),
    };
  } else {
    const sessionId = text('sessionId', 8, 64, 'Sesión inválida (8–64 caracteres).');
    const event = values.event;
    const source = values.source === undefined ? 'contact_form' : values.source;
    if (!['cta_click', 'form_start', 'form_submit_success'].includes(event as string)) fieldErrors.event = ['Evento inválido.'];
    if (!['hero', 'nav', 'contact_form'].includes(source as string)) fieldErrors.source = ['Origen de evento inválido.'];
    input = { sessionId, event, source } as FunnelInput;
  }
  if (Object.keys(fieldErrors).length) return json({ success: false, message: 'Revisa los campos indicados.', fieldErrors }, 400);
  try {
    if (contact) await insertContact(env.DB, input as ContactInput);
    else await insertFunnel(env.DB, input as FunnelInput);
  } catch {
    // No submitted PII, SQL or underlying exception is logged or returned.
    return failure(contact ? 'Hubo un error al guardar tu solicitud. Inténtalo de nuevo.' : 'No se pudo registrar el evento.', 503);
  }
  return json(contact ? { success: true, message: 'Solicitud registrada con éxito. ¡Hablamos pronto!' } : { success: true });
}
