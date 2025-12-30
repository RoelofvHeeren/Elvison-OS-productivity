import OpenAI from 'openai';

// Allow build to pass without API key
const apiKey = process.env.OPENAI_API_KEY || 'dummy-key-for-build';

if (!process.env.OPENAI_API_KEY && process.env.NODE_ENV !== 'production') {
    console.warn('Warning: Missing OPENAI_API_KEY environment variable. AI features will not work.');
}

export const openai = new OpenAI({
    apiKey,
});

// Default model for all agents
export const DEFAULT_MODEL = 'gpt-4o';

// Agent types
export type AgentType =
    | 'task-ingestion'
    | 'task-breakdown'
    | 'daily-focus'
    | 'weekly-review'
    | 'weekly-planning'
    | 'knowledge-query'
    | 'metrics-insight';

// Structured output helper
export async function generateStructuredOutput<T>(
    systemPrompt: string,
    userMessage: string,
    model: string = DEFAULT_MODEL
): Promise<T> {
    const response = await openai.chat.completions.create({
        model,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
        throw new Error('No response from OpenAI');
    }

    return JSON.parse(content) as T;
}
