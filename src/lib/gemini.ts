import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';

if (!apiKey && process.env.NODE_ENV !== 'production') {
    console.warn('Warning: Missing GEMINI_API_KEY environment variable. AI features will not work.');
}

const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Structured output helper for Gemini
export async function generateStructuredOutputGemini<T>(
    systemPrompt: string,
    userMessage: string
): Promise<T> {
    const fullPrompt = `${systemPrompt}

IMPORTANT: You MUST respond with ONLY valid JSON. No markdown, no explanation, just the JSON object.

User Input:
${userMessage}`;

    const result = await geminiModel.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    // Clean up response - remove markdown code blocks if present
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.slice(7);
    } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.slice(3);
    }
    if (cleanedText.endsWith('```')) {
        cleanedText = cleanedText.slice(0, -3);
    }
    cleanedText = cleanedText.trim();

    return JSON.parse(cleanedText) as T;
}

// Transcribe audio using Gemini's multimodal capabilities
export async function transcribeAudioGemini(audioBuffer: Buffer, mimeType: string): Promise<string> {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const audioPart = {
        inlineData: {
            data: audioBuffer.toString('base64'),
            mimeType: mimeType,
        },
    };

    const result = await model.generateContent([
        'Transcribe this audio recording word for word. Return ONLY the transcription text, nothing else.',
        audioPart,
    ]);

    const response = await result.response;
    return response.text().trim();
}
