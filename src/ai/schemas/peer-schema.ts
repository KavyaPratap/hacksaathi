import { z } from 'genkit';

// Define the schema for a single user profile
export const UserProfileSchema = z.object({
  id: z.string().describe('The unique identifier for the user.'),
  full_name: z.string().describe("The user's full name."),
  avatar_url: z.string().optional().nullable().describe("The URL for the user's avatar image."),
  bio: z.string().optional().nullable().describe('A short biography of the user.'),
  experience: z.string().optional().nullable().describe("The user's experience level."),
  tech_stack: z.array(z.string()).optional().nullable().describe("A list of the user's technical skills."),
  interests: z.array(z.string()).optional().nullable().describe("A list of the user's interests."),
  location: z.string().optional().nullable().describe("The user's location."),
  phone_number: z.string().optional().nullable().describe("The user's phone number."),
  github_url: z.string().optional().nullable().describe("The user's GitHub profile URL."),
  linkedin_url: z.string().optional().nullable().describe("The user's LinkedIn profile URL."),
  portfolio_url: z.string().optional().nullable().describe("The user's portfolio URL."),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

// Input schema for the flow
export const PeerSearchInputSchema = z.object({
  query: z.string().describe('The natural language query describing the desired teammate.'),
  users: z.array(UserProfileSchema).describe('The list of all available users to search from.'),
  currentUser: UserProfileSchema.describe('The profile of the user performing the search.'),
});
export type PeerSearchInput = z.infer<typeof PeerSearchInputSchema>;

// Output schema for the flow
export const PeerSearchOutputSchema = z.array(z.object({
    userId: z.string().describe("The ID of the user."),
    reason: z.string().describe("A brief, one-sentence explanation for why this user is a good match."),
    match_score: z.number().describe("A score from 0 to 1 indicating the quality of the match, where 1 is a perfect match.")
})).describe("A list of user IDs, sorted from best to worst match.");
export type PeerSearchOutput = z.infer<typeof PeerSearchOutputSchema>;
