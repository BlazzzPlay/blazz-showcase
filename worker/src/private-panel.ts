import type { Env } from './env.ts';
import { deleteContact, listContacts, markContactRead, type ContactRow } from './db.ts';
import { readBody, reject } from './public-api.ts';

// Only reached after privateBoundary verified the Access JWT.
const baseHeaders = {
  'cache-control': 'no-store',
  'x-robots-tag': 'noindex',
  'x-frame-options': 'DENY',
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
};

type Result = { success: true } | { success: false; message: string };
function json(body: Result, status = 200, extra: Record<string, string> = {}): Response {
  return Response.json(body, { status, headers: { ...baseHeaders, ...extra } });
}
function notFound(): Response {
  return new Response('Not found', { status: 404, headers: baseHeaders });
}

const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export function escapeHtml(value: unknown): string {
  return String(value).replace(/[&<>"']/g, char => entities[char]);
}

const dateFormat = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Santiago',
});

function card(contact: ContactRow): string {
  const unread = contact.is_read === 0;
  const id = Number(contact.id);
  return `<article class="contact-card glass${unread ? ' unread' : ''}" data-id="${id}">
  <div class="card-header">
    <div class="card-meta">
      <span class="status-dot${unread ? ' dot-unread' : ''}" aria-hidden="true"></span>
      <strong class="card-name">${escapeHtml(contact.name)}</strong>
      <span class="card-date">${escapeHtml(dateFormat.format(new Date(Number(contact.created_at) * 1000)))}</span>
      ${unread ? '<span class="sr-only">Sin leer</span>' : ''}
    </div>
    <div class="card-actions">
      ${unread ? `<button type="button" class="btn-icon" data-action="mark-read" data-id="${id}" title="Marcar como leído" aria-label="Marcar como leído">✓</button>` : ''}
      <button type="button" class="btn-icon btn-danger" data-action="delete" data-id="${id}" title="Eliminar" aria-label="Eliminar">✕</button>
    </div>
  </div>
  <div class="card-body">
    <div class="card-field"><span class="field-label">Email:</span><a href="mailto:${escapeHtml(contact.email)}" class="field-value email-link">${escapeHtml(contact.email)}</a></div>
    <div class="card-field"><span class="field-label">Asunto:</span><span class="field-value">${escapeHtml(contact.subject)}</span></div>
    <div class="card-field message-field"><span class="field-label">Mensaje:</span><p class="field-value message-text">${escapeHtml(contact.message)}</p></div>
  </div>
</article>`;
}

const styles = `
:root{--bg:224 71% 4%;--text:213 31% 91%;--text-muted:215 20% 65%;--accent:189 74% 43%;--accent-light:189 80% 60%;--primary-light:217 91% 70%;--glass-border:hsla(0,0%,100%,.1);--font-display:system-ui,sans-serif}
*{box-sizing:border-box}body{margin:0;background:hsl(var(--bg));color:hsl(var(--text));font:16px/1.5 system-ui,sans-serif}
.container{max-width:960px;margin:0 auto;padding:3rem 1.25rem}.gradient-text{background:linear-gradient(90deg,hsl(var(--primary-light)),hsl(var(--accent)));-webkit-background-clip:text;background-clip:text;color:transparent}
.admin-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:3rem;flex-wrap:wrap;gap:1rem}h1{margin:0;font-size:clamp(1.75rem,4vw,2.5rem)}
.admin-subtitle{color:hsl(var(--text-muted));font-size:1.1rem;margin-top:.5rem}.unread-badge{color:hsl(var(--accent));font-weight:600}
.btn{display:inline-block;padding:.6rem 1.2rem;border:1px solid var(--glass-border);border-radius:.6rem;color:hsl(var(--text));text-decoration:none}
.glass{background:hsla(224,71%,10%,.5);border:1px solid var(--glass-border);border-radius:1rem}.empty-state{text-align:center;padding:4rem 2rem;font-size:1.2rem;color:hsl(var(--text-muted))}
.contacts-grid{display:flex;flex-direction:column;gap:1.5rem}.contact-card{padding:1.5rem 2rem;border-left:3px solid transparent}.contact-card.unread{border-left-color:hsl(var(--accent));background:hsla(224,71%,15%,.5)}
.card-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;gap:1rem}.card-meta{display:flex;align-items:center;gap:.75rem;flex-wrap:wrap}
.status-dot{width:8px;height:8px;border-radius:50%;background:hsl(var(--text-muted))}.dot-unread{background:hsl(var(--accent));box-shadow:0 0 8px hsl(var(--accent))}
.card-name{font-size:1.1rem;font-family:var(--font-display);overflow-wrap:anywhere}.card-date{font-size:.8rem;color:hsl(var(--text-muted))}.card-actions{display:flex;gap:.5rem}
.btn-icon{width:2.25rem;height:2.25rem;border-radius:.5rem;border:1px solid var(--glass-border);background:transparent;color:hsl(var(--text-muted));cursor:pointer;font-size:.9rem}
.btn-icon:hover,.btn-icon:focus-visible{border-color:hsl(var(--accent-light));color:hsl(var(--accent-light))}.btn-danger:hover,.btn-danger:focus-visible{border-color:hsl(0,84%,60%);color:hsl(0,84%,60%)}.btn-icon:disabled{opacity:.5;cursor:wait}
.card-body{display:flex;flex-direction:column;gap:.75rem}.card-field{display:flex;gap:.5rem;align-items:baseline}
.field-label{font-size:.8rem;color:hsl(var(--text-muted));text-transform:uppercase;letter-spacing:.05em;font-weight:600;min-width:70px;flex-shrink:0}
.field-value{font-size:.95rem;overflow-wrap:anywhere}.email-link{color:hsl(var(--primary-light))}.message-field{flex-direction:column;gap:.3rem}.message-text{margin:0;line-height:1.6;color:hsl(var(--text-muted));white-space:pre-wrap}
.status-message{min-height:1.5rem;color:hsl(0,84%,70%)}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
@media (max-width:768px){.admin-header{flex-direction:column}.contact-card{padding:1rem 1.25rem}.card-field{flex-direction:column;gap:.2rem}.field-label{min-width:auto}}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}`;

// Same-origin JSON mutations only; reload on success keeps the server render authoritative.
const script = `
const status = document.getElementById('status');
document.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'delete' && !confirm('¿Eliminar esta solicitud?')) return;
  button.disabled = true;
  status.textContent = '';
  try {
    const response = await fetch('/private/api/' + action, {
      method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: Number(button.dataset.id) }),
    });
    const body = await response.json().catch(() => null);
    if (response.ok && body && body.success) { location.reload(); return; }
    status.textContent = (body && body.message) || 'No se pudo completar la acción.';
  } catch {
    status.textContent = 'No se pudo completar la acción. Revisa tu conexión.';
  }
  button.disabled = false;
});`;

async function panel(env: Env): Promise<Response> {
  const contacts = await listContacts(env.DB);
  const unread = contacts.filter(contact => contact.is_read === 0).length;
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
  const body = contacts.length === 0
    ? '<div class="empty-state glass"><p>📭 No hay solicitudes de contacto todavía.</p></div>'
    : `<div class="contacts-grid">${contacts.map(card).join('\n')}</div>`;
  const html = `<!doctype html>
<html lang="es-CL">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Panel de Contactos | Blazz</title>
<style nonce="${nonce}">${styles}</style>
</head>
<body>
<main class="admin container">
  <div class="admin-header">
    <div>
      <h1 class="section-title">Panel de <span class="gradient-text">Contactos</span></h1>
      <p class="admin-subtitle">${contacts.length} solicitudes totales · <span class="unread-badge">${unread} sin leer</span></p>
    </div>
    <a href="/" class="btn btn-outline">← Volver al sitio</a>
  </div>
  <p id="status" class="status-message" role="status" aria-live="polite"></p>
  ${body}
</main>
<script nonce="${nonce}">${script}</script>
</body>
</html>`;
  return new Response(html, { headers: {
    ...baseHeaders,
    'content-type': 'text/html; charset=utf-8',
    'content-security-policy': `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; connect-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`,
  } });
}

const actions = { 'mark-read': markContactRead, delete: deleteContact } as const;

async function mutation(request: Request, env: Env, action: keyof typeof actions): Promise<Response> {
  if (request.method !== 'POST') return reject(request, json({ success: false, message: 'Método no permitido.' }, 405, { allow: 'POST' }));
  // Access authenticates with a cookie, so cross-site requests must be refused (CSRF).
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return reject(request, json({ success: false, message: 'Origen no permitido.' }, 403));
  }
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return reject(request, json({ success: false, message: 'Envía JSON con Content-Type application/json.' }, 415));
  }
  let body: unknown;
  try { body = await readBody(request); } catch { body = undefined; }
  const id = body && typeof body === 'object' && !Array.isArray(body) && Object.keys(body).length === 1
    ? (body as Record<string, unknown>).id : undefined;
  if (typeof id !== 'number' || !Number.isSafeInteger(id) || id < 1) {
    return json({ success: false, message: 'Identificador inválido.' }, 400);
  }
  try {
    if (!await actions[action](env.DB, id)) return json({ success: false, message: 'Solicitud no encontrada.' }, 404);
  } catch {
    return json({ success: false, message: 'No se pudo completar la acción.' }, 503);
  }
  return json({ success: true });
}

export async function privateRoutes(request: Request, env: Env): Promise<Response> {
  const path = new URL(request.url).pathname;
  if (path === '/private' || path === '/private/') {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return reject(request, new Response('Method not allowed', { status: 405, headers: { ...baseHeaders, allow: 'GET, HEAD' } }));
    }
    try { return await panel(env); }
    catch { return new Response('Servicio no disponible', { status: 503, headers: baseHeaders }); }
  }
  const action = path.slice('/private/api/'.length);
  if (path.startsWith('/private/api/') && Object.hasOwn(actions, action)) {
    return mutation(request, env, action as keyof typeof actions);
  }
  return reject(request, notFound());
}
