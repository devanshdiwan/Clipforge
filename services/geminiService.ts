
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { Clip, ChatMessage, ConversationResponse } from '../types';

let ai: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
    if (!ai) {
        if (!process.env.API_KEY) {
            throw new Error("API key is missing. Please ensure it's configured in your environment.");
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
}

const clipSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.NUMBER },
        title: { type: Type.STRING, description: "A catchy title for the clip (max 5 words)." },
        start: { type: Type.NUMBER, description: "Start time of the clip in seconds." },
        end: { type: Type.NUMBER, description: "End time of the clip in seconds." },
        hook: { type: Type.STRING, description: "A short, viral hook for the beginning of the video (e.g., 'You won't believe what happens next!')." },
        caption: { type: Type.STRING, description: "A full, engaging caption for the video, including emojis. Max 30 words." },
        highlighted_keywords: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of 2-3 keywords from the caption to highlight visually."
        }
    },
    required: ["id", "title", "start", "end", "hook", "caption", "highlighted_keywords"],
};

export async function generateClipsFromDescription(description: string): Promise<Clip[]> {
    const aiClient = getAiClient();
    const prompt = `
        You are a viral video expert specializing in creating short-form content for platforms like TikTok, YouTube Shorts, and Instagram Reels.
        A user has provided a long video with the following description: "${description}".
        
        Your task is to identify 4 potentially viral moments from this video that would make excellent short clips.
        The clips should be between 20 and 60 seconds long.
        For each clip, provide a catchy title, a viral hook, an engaging caption with emojis, and a few keywords to highlight.
        
        Generate the output in a valid JSON array format.
    `;

    try {
        const response = await aiClient.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: clipSchema
                },
                temperature: 0.7
            }
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error calling Gemini API in generateClipsFromDescription:", error);
        if (error instanceof Error && error.message.includes('API key not valid')) {
            throw new Error('Your API key is invalid. Please check and try again.');
        }
        throw new Error(`Failed to generate clips due to an AI error. Please try again.`);
    }
}

const updateClipTool: FunctionDeclaration = {
    name: 'updateClipDetails',
    description: 'Updates the details of a specific video clip. Only update the fields the user asks to change.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            clipId: {
                type: Type.NUMBER,
                description: 'The ID of the clip to update.',
            },
            title: { type: Type.STRING, description: 'The new catchy title for the clip.' },
            hook: { type: Type.STRING, description: 'The new viral hook for the beginning of the video.' },
            caption: { type: Type.STRING, description: 'The new engaging caption for the video.' },
        },
        required: ['clipId'],
    },
};

export async function continueConversation(messages: ChatMessage[], clips: Clip[]): Promise<ConversationResponse> {
    const aiClient = getAiClient();
    const lastMessage = messages[messages.length - 1];
    
    const history = messages.slice(0, -1).map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
    }));
    
    const relevantClipData = clips.map(c => ({ id: c.id, title: c.title, hook: c.hook, caption: c.caption }));
    const clipsContext = `Here is the context of the video clips the user is currently working on: ${JSON.stringify(relevantClipData)}.`;

    const chat = aiClient.chats.create({
        model: 'gemini-2.5-flash',
        history: history,
        config: {
            systemInstruction: 'You are a friendly and helpful AI assistant for a video editing app called ClipForge. Your primary goal is to help users refine their video clips by modifying titles, hooks, and captions. When a user requests a change, use the `updateClipDetails` tool to apply it. After using the tool, provide a friendly confirmation message.',
            tools: [{ functionDeclarations: [updateClipTool] }],
        }
    });

    try {
        const response = await chat.sendMessage({ message: `${clipsContext}\n\nUser message: ${lastMessage.content}`});
        
        const fc = response.functionCalls?.[0];

        return {
            text: response.text,
            functionCall: fc ? { name: fc.name, args: fc.args } : undefined,
        };
    } catch (error) {
        console.error("Error in chat conversation:", error);
         if (error instanceof Error && error.message.includes('API key not valid')) {
            throw new Error('Your API key is invalid. Please check it.');
        }
        throw new Error("An unknown error occurred during the chat conversation.");
    }
}
