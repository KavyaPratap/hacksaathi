/**
 * @fileOverview Zod schemas and TypeScript types for the content proctoring flow.
 */
import { z } from 'zod';

export const ProctorTextInputSchema = z.object({
  text: z.string().describe("The text content to analyze."),
});
export type ProctorTextInput = z.infer<typeof ProctorTextInputSchema>;

export const ProctorImageInputSchema = z.object({
    photoDataUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ProctorImageInput = z.infer<typeof ProctorImageInputSchema>;


export const ProctorOutputSchema = z.object({
  isSafe: z.boolean().describe("Whether or not the content is safe and appropriate."),
  reason: z.string().optional().describe("The reason why the content was flagged as not safe."),
});
export type ProctorOutput = z.infer<typeof ProctorOutputSchema>;
