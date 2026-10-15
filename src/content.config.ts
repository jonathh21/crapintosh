import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const shirts = defineCollection({
  loader: glob({ base: './src/content/shirts', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    // Lines of text printed on the shirt mockup.
    print: z.array(z.string()).min(1),
    shirtColour: z.string().default('#e8e2d0'),
    inkColour: z.string().default('#1a1a1a'),
    tags: z.array(z.string()).default([]),
    price: z.number().positive(),
    sizes: z.array(z.string()).default(['S', 'M', 'L', 'XL', 'XXL']),
    order: z.number().default(100),
  }),
});

export const collections = { shirts };
