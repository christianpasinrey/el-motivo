import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const Escena = z.object({
  tipo: z.enum(['intertitulo', 'narrativa', 'cita', 'escucha']),
  fondo: z.object({
    src: z.string().regex(/^[\w-]+\.(jpg|png|webp)$/),
    fondoMovil: z.string().regex(/^[\w-]+\.(jpg|png|webp)$/).optional(),
    kenburns: z.enum(['zoom-in', 'zoom-out', 'pan-izq', 'pan-der']).default('zoom-in'),
    credito: z.string().min(3),
  }),
  texto: z.string().min(1),
  atribucion: z.string().optional(),
  timestamp: z.number().int().nonnegative().optional(),
  duracionCine: z.number().positive().default(12),
}).superRefine((e, ctx) => {
  if (e.tipo === 'escucha' && e.timestamp === undefined)
    ctx.addIssue({ code: 'custom', message: 'una escena "escucha" requiere timestamp' });
});

export const ObraSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  orden: z.number().int().min(1),
  titulo: z.string(),
  compositor: z.string(),
  año: z.number().int(),
  lugar: z.string(),
  gancho: z.string().max(90),
  cartel: z.string().regex(/^[\w-]+\.(jpg|png|webp)$/),
  youtube: z.object({
    videoId: z.string().length(11),
    videoIdAlternativos: z.array(z.string().length(11)).default([]),
    grabacion: z.string(),
  }),
  paleta: z.object({ acento: z.string().regex(/^#[0-9a-f]{6}$/i) }),
  vida: z.object({ desde: z.number().int(), hasta: z.number().int() }),
  escenas: z.array(Escena).min(5).max(9),
  cierre: z.object({
    grabaciones: z.array(z.string()).min(1),
    siguiente: z.string(),
  }),
});

const obras = defineCollection({
  loader: glob({ pattern: '*/obra.json', base: './src/content/obras' }),
  schema: ObraSchema,
});

export const collections = { obras };
