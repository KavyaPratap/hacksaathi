'use server';
/**
 * @fileOverview A Genkit flow for profile creation assistance.
 *
 * - generateBio - A function that generates a user bio based on their profile data.
 */
import { ai } from '@/ai/init';
import { BioInputSchema, type BioInput } from '@/ai/schemas/profile-schema';
import { z } from 'genkit';

const bioGenerationPrompt = ai.definePrompt({
    name: 'bioGenerationPrompt',
    input: { schema: BioInputSchema },
    prompt: `You are an expert career coach helping a user write a compelling, short bio for a hackathon team-finding platform called HackSaathi.
    
    The user's name is {{name}}.
    Their experience level is {{experience}}.
    Their skills are: {{#each skills}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.
    They are interested in projects related to: {{#each interests}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.

    Based on this information, generate a friendly, first-person bio (2-3 sentences) that highlights their key strengths and what they're passionate about.
    The tone should be enthusiastic and collaborative. Do not use markdown.
    `,
});

const bioGenerationFlow = ai.defineFlow(
    {
        name: 'bioGenerationFlow',
        inputSchema: BioInputSchema,
        outputSchema: z.string(),
    },
    async (input) => {
        const { text } = await bioGenerationPrompt(input, { model: 'googleai/gemini-2.0-flash' });
        return text;
    }
);

export async function generateBio(input: BioInput): Promise<string> {
    return bioGenerationFlow(input);
}
