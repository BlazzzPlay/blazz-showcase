import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { db } from '../db';
import { contactRequests } from '../db/schema';

export const server = {
  submitContact: defineAction({
    accept: 'form',
    input: z.object({
      name: z.string().min(2, "El nombre es muy corto"),
      email: z.string().email("Email inválido"),
      subject: z.string().min(3, "Asunto requerido"),
      message: z.string().min(10, "Mensajes cortos no permitidos"),
    }),
    handler: async (values) => {
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
};
