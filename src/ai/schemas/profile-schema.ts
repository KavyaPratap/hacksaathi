/**
 * @fileOverview Zod schemas and TypeScript types for the profile generation flow.
 *
 * - BioInputSchema - The Zod schema for the bio generation input.
 * - BioInput - The TypeScript type inferred from the Zod schema.
 */
import { z } from 'zod';

export const BioInputSchema = z.object({
  name: z.string().describe("The user's full name."),
  skills: z.array(z.string()).describe("A list of the user's technical skills."),
  interests: z.array(z.string()).describe("A list of the user's interests or project domains."),
  experience: z.string().describe("The user's experience level (e.g., beginner, intermediate, advanced)."),
});
export type BioInput = z.infer<typeof BioInputSchema>;
