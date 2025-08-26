import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// This file initializes the Genkit AI instance.
// It is kept separate from flow files that use 'use server' to avoid
// exporting a non-async function from a server action module.

export const ai = genkit({
  plugins: [
    googleAI({
        apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
});
