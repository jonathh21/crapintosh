import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const shirts = defineCollection({
  loader: glob({ base: './src/content/shirts', pattern: '**/*.md' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      tagline: z.string(),
      // Photo/mockup of the shirt. If omitted, a mockup is generated from `print`.
      image: image().optional(),
      imageAlt: z.string().optional(),
      // CSS object-position for the cropped catalogue thumbnail, e.g. 'left' or '30% 50%'.
      imageFocus: z.string().default('center'),
      // Flat artwork of just the print, shown under the shirt on its own page.
      design: image().optional(),
      designAlt: z.string().optional(),
      // Optional full prompt for the image generator scripts, used instead of one built from `print`.
      designPrompt: z.string().optional(),
      // Lines of text printed on the generated mockup.
      print: z.array(z.string()).default([]),
      shirtColour: z.string().default('#e8e2d0'),
      inkColour: z.string().default('#1a1a1a'),
      tags: z.array(z.string()).default([]),
      price: z.number().positive(),
      sizes: z.array(z.string()).default(['S', 'M', 'L', 'XL', 'XXL']),
      order: z.number().default(100),
    })
    .refine((d) => d.image || d.print.length > 0, {
      message: 'A shirt needs either an `image` or at least one `print` line.',
    }),
});

export const collections = { shirts };
