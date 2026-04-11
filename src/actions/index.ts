import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { db } from '../db';
import { contactRequests, contactFunnelEvents } from '../db/schema';

export const server = {
  submitContact: defineAction({
    accept: 'form',
    input: z.object({
      name: z.string().trim().min(2, "😊 Cuéntame tu nombre, ¡me gusta saber con quién hablo!"),
      email: z.string().trim().email("📧 Hmm, ese email no parece válido. ¿Podrías revisarlo?"),
      subject: z.string().trim().min(3, "💡 Dame una pista de qué se trata tu proyecto"),
      message: z.string().trim().min(10, "🤝 Ten confianza, ¡explícame tu idea con más detalle! Así te puedo ayudar mejor."),
    }).passthrough(),
    handler: async (values) => {
      console.log('📩 Contact form received:', JSON.stringify(values));
      try {
        await db.insert(contactRequests).values({
          name: values.name,
          email: values.email,
          subject: values.subject,
          message: values.message,
        });
        return { success: true, message: "Solicitud registrada con éxito. ¡Hablamos pronto!" };
      } catch (error) {
        console.error('Error saving to DB:', error);
        return { success: false, message: "Hubo un error al guardar tu solicitud. Inténtalo de nuevo." };
      }
    },
  }),

  trackFunnel: defineAction({
    accept: 'json',
    input: z.object({
      sessionId: z.string().min(8).max(64),
      event: z.enum(['cta_click', 'form_start', 'form_submit_success']),
      source: z.enum(['hero', 'nav', 'contact_form']).default('contact_form'),
    }),
    handler: async (values) => {
      await db.insert(contactFunnelEvents).values({
        sessionId: values.sessionId,
        event: values.event,
        source: values.source,
      });

      return { success: true };
    },
  }),

  markAsRead: defineAction({
    accept: 'form',
    input: z.object({
      id: z.string(),
    }),
    handler: async (values) => {
      const { eq } = await import('drizzle-orm');
      await db.update(contactRequests)
        .set({ isRead: true })
        .where(eq(contactRequests.id, parseInt(values.id)));
      return { success: true };
    },
  }),

  deleteContact: defineAction({
    accept: 'form',
    input: z.object({
      id: z.string(),
    }),
    handler: async (values) => {
      const { eq } = await import('drizzle-orm');
      await db.delete(contactRequests)
        .where(eq(contactRequests.id, parseInt(values.id)));
      return { success: true };
    },
  }),
};
