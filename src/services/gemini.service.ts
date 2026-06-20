import { GoogleGenAI } from "@google/genai";

// console.log(process.env.GOOGLE_API_KEY);
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });

const callGemini = async (prompt: string)=>{
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: prompt
        });
        return response.text;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export {callGemini}