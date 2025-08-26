'use server';
/**
 * @fileOverview A Genkit flow for AI-powered teammate matching.
 *
 * - findPeers - A function that takes a search query and a list of users,
 *   and returns a sorted list of users based on skill/interest relevance.
 */
import { ai } from '@/ai/init';
import {
  PeerSearchInputSchema,
  PeerSearchOutputSchema,
  type PeerSearchInput,
  type PeerSearchOutput,
} from '@/ai/schemas/peer-schema';
import { z } from 'genkit';

// This prompt handles general conversation and decides if a user search is needed.
const triagePrompt = ai.definePrompt({
  name: 'peerSearchTriagePrompt',
  input: { schema: z.object({ query: z.string() }) },
  output: {
    format: 'json',
    schema: z.object({
      thought: z
        .string()
        .describe(
          'Your reasoning. Is the user asking for a person, or is it a general question/greeting?'
        ),
      action: z
        .enum(['search', 'answer'])
        .describe(
          'Choose "search" if the user is looking for people. Choose "answer" for greetings, questions about you, or requests for help.'
        ),
      answer: z
        .string()
        .optional()
        .describe(
          'If the action is "answer", provide a direct response here.'
        ),
    }),
  },
  prompt: `You are an AI assistant for HackSaathi, a platform to find hackathon teammates. Your name is PeerJet.

Analyze the user's query: "{{query}}"

- If the user is asking to find people with skills, interests, or project ideas, set action to "search".
- If the query is a simple greeting like "hi" or "hello", set action to "answer" and provide a friendly response.
- If the query is a question about you, like "who made you?" or "what do you do?", set action to "answer" and provide a helpful response.
- If the query is a request for "help", set action to "answer" and provide example search queries.

Example 'answer' responses:
- for "who made you?": "I was made by a talented team from dt club lead by KavyaPratap, Arhaan and Suryansh"
- for "what do you do?": "I help you find the perfect teammates for your hackathon projects by matching your query against a database of talented individuals."
- for 'help': "You can ask me things like 'Find a react developer' or 'Show me designers who know Figma'."`,
});

// This prompt performs the actual user search and ranking.
const peerSearchPrompt = ai.definePrompt({
  name: 'peerSearchPrompt',
  input: { schema: PeerSearchInputSchema },
  output: { schema: PeerSearchOutputSchema },
  prompt: `You are an expert at building hackathon teams. Your task is to find and rank potential teammates from a list based on a user's request.

The user's search query is: "{{query}}"

The user making the request has the following profile:
- Name: {{currentUser.full_name}}
- Skills: {{#each currentUser.tech_stack}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
- Interests: {{#each currentUser.interests}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Here is the list of available users:
{{#each users}}
- User ID: {{id}}
  - Name: {{full_name}}
  - Bio: {{bio}}
  - Skills: {{#each tech_stack}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  - Interests: {{#each interests}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
{{/each}}

1.  **Filter:** First, identify users who are relevant to the query. If the query is "find me people who work on websites", you should only consider users with skills like "React", "frontend", "HTML", "CSS", "javascript", etc. If no users are relevant, return an empty array.
2.  **Rank:** Rank the filtered users. Prioritize users whose skills and interests directly match the keywords in the query. Also, consider skills that are complementary to the current user.
3.  **Output:** Return a JSON array of the filtered and sorted user objects. Each object must include the user's ID ('userId'), a brief 'reason' for the ranking, and a 'match_score' from 0 to 1. Do not include the current user in the results.`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ],
  },
});

// The wrapper function that calls the flow
export async function findPeers(
  input: PeerSearchInput
): Promise<PeerSearchOutput | string> {
  return peerSearchFlow(input);
}

// The Genkit flow definition
const peerSearchFlow = ai.defineFlow(
  {
    name: 'peerSearchFlow',
    inputSchema: PeerSearchInputSchema,
    outputSchema: z.union([PeerSearchOutputSchema, z.string()]),
  },
  async (input) => {
    // Step 1: Handle hard-coded greetings before calling the AI.
    const lowerCaseQuery = input.query.toLowerCase().trim();
    if (lowerCaseQuery === 'hi' || lowerCaseQuery === 'hello') {
      return 'Hello! How can I help you find teammates today?';
    }

    // Step 2: Triage the query to see if it's a general question or a search.
    const { output: triageResult } = await triagePrompt(
        { query: input.query }, 
        { model: 'googleai/gemini-2.0-flash' }
    );
    
    if (triageResult?.action === 'answer' && triageResult.answer) {
      return triageResult.answer;
    }

    // Step 3: If it's a search, proceed with the peer search prompt.
    if (!input.users || input.users.length === 0) {
      return "I couldn't find anyone in the database to search. Please check if there are users available.";
    }

    const { output: searchOutput } = await peerSearchPrompt(input, {
      model: 'googleai/gemini-2.0-flash',
    });
    
    return searchOutput || [];
  }
);
