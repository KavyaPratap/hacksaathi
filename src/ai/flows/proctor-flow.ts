'use server';
/**
 * @fileOverview A Genkit flow for AI-powered content proctoring.
 *
 * - proctorText - Analyzes text for inappropriate content.
 * - proctorImage - Analyzes an image for inappropriate content.
 */
import { ai } from '@/ai/init';
import { 
    ProctorTextInputSchema,
    ProctorImageInputSchema,
    ProctorOutputSchema,
    type ProctorTextInput,
    type ProctorImageInput,
    type ProctorOutput,
} from '@/ai/schemas/proctor-schema';

const textProctorPrompt = ai.definePrompt({
    name: 'textProctorPrompt',
    input: { schema: ProctorTextInputSchema },
    output: { schema: ProctorOutputSchema },
    prompt: `You are a very strict content moderator for a professional networking platform called "HackSaathi".
    Your task is to analyze the given text for any profanity, hate speech, explicit content, or anything that would be inappropriate for a professional setting.
    This includes insults, slurs, and derogatory terms.

    In addition to English, you must also block common Hindi slang and profanity. This includes, but is not limited to, words like 'bund', 'gaand', 'lodu', 'loduchand', and other similar offensive terms.
    You must also block common insults that use animal names, such as 'donkey', 'gadha', 'kutta', 'dog', etc., when used in a derogatory context. The check should be case-insensitive.

    Analyze the following text: "{{text}}"
    
    If the text is safe and professional, return {"isSafe": true}.
    If the text is inappropriate, return {"isSafe": false, "reason": "The provided text violates community guidelines by containing profanity or inappropriate language."}.
    Be very strict. Do not allow any curse words, even mild ones. A user's name or team name should not be an insult.
    `,
    config: {
        safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
    }
});

const imageProctorPrompt = ai.definePrompt({
    name: 'imageProctorPrompt',
    input: { schema: ProctorImageInputSchema },
    output: { schema: ProctorOutputSchema },
    prompt: `You are a strict image moderator for a professional networking platform called "HackSaathi".
    Your task is to analyze the given image to determine if it is an appropriate and professional profile picture.
    The image MUST be a photograph of a real human. The person's face must be clearly visible and recognizable.
    Do NOT allow illustrations, anime, cartoons, avatars, pictures of objects, animals, or landscapes.

    Analyze the provided image. {{media url=photoDataUri}}
    
    If the image is a suitable profile picture (a recognizable photo of a human face), return {"isSafe": true}.
    If the image is inappropriate or irrelevant (e.g., anime, object, not a real person), return {"isSafe": false, "reason": "Profile picture must be a clear photo of your face. Illustrations, anime, or objects are not allowed."}.
    `,
    config: {
        safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
        ],
    }
});

const proctorTextFlow = ai.defineFlow(
    {
        name: 'proctorTextFlow',
        inputSchema: ProctorTextInputSchema,
        outputSchema: ProctorOutputSchema,
    },
    async (input) => {
        try {
            const { output } = await textProctorPrompt(input, { model: 'googleai/gemini-2.0-flash' });
            return output || { isSafe: false, reason: "Failed to get a valid response from AI." };
        } catch (error) {
            console.error("Error in text proctoring flow:", error);
            return { isSafe: false, reason: "Content could not be verified due to a safety block or system error." };
        }
    }
);

const proctorImageFlow = ai.defineFlow(
    {
        name: 'proctorImageFlow',
        inputSchema: ProctorImageInputSchema,
        outputSchema: ProctorOutputSchema,
    },
    async (input) => {
        try {
            const { output } = await imageProctorPrompt(input, { model: 'googleai/gemini-2.0-flash' });
            return output || { isSafe: false, reason: "Failed to get a valid response from AI." };
        } catch (error) {
            console.error("Error in image proctoring flow:", error);
            return { isSafe: false, reason: "Content could not be verified due to a safety block or system error." };
        }
    }
);

export async function proctorText(input: ProctorTextInput): Promise<ProctorOutput> {
    return proctorTextFlow(input);
}

export async function proctorImage(input: ProctorImageInput): Promise<ProctorOutput> {
    return proctorImageFlow(input);
}
