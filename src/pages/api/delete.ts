import type { APIRoute } from 'astro';
import { db } from '../../db';
import { contactRequests } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request, redirect }) => {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  
  if (id) {
    await db.delete(contactRequests)
      .where(eq(contactRequests.id, parseInt(id)));
  }
  
  return redirect('/admin?key=blazz2026', 302);
};
