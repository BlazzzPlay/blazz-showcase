export type ContactInput = { name: string; email: string; subject: string; message: string };
export type FunnelInput = {
  sessionId: string;
  event: 'cta_click' | 'form_start' | 'form_submit_success';
  source: 'hero' | 'nav' | 'contact_form';
};
export type ApiResult = { success: true; message?: string } | {
  success: false; message: string; fieldErrors?: Record<string, string[]>;
};

// Validate untrusted responses before allowing reset or rendering inline errors.
export async function postJson(path: '/api/contact' | '/api/funnel', input: ContactInput | FunnelInput | Record<string, unknown>, fetcher: typeof fetch = fetch): Promise<ApiResult> {
  const response = await fetcher(path, {
    method: 'POST', credentials: 'same-origin',
    headers: { 'content-type': 'application/json' }, body: JSON.stringify(input),
  });
  const body: unknown = await response.json();
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid API response');
  const value = body as Record<string, unknown>;
  if (value.success === true && response.ok) {
    if (path === '/api/contact' && (typeof value.message !== 'string' || !value.message.trim())) throw new Error('Missing success message');
    return { success: true, ...(typeof value.message === 'string' ? { message: value.message } : {}) };
  }
  if (value.success !== false || typeof value.message !== 'string' || !value.message.trim()) throw new Error('Invalid API response');
  let fieldErrors: Record<string, string[]> | undefined;
  if (value.fieldErrors !== undefined) {
    if (!value.fieldErrors || typeof value.fieldErrors !== 'object' || Array.isArray(value.fieldErrors)) throw new Error('Invalid field errors');
    fieldErrors = {};
    for (const [field, messages] of Object.entries(value.fieldErrors)) {
      if (!Array.isArray(messages) || !messages.every(message => typeof message === 'string')) throw new Error('Invalid field errors');
      if (['name', 'email', 'subject', 'message'].includes(field)) fieldErrors[field] = messages;
    }
  }
  return { success: false, message: value.message, ...(fieldErrors ? { fieldErrors } : {}) };
}
