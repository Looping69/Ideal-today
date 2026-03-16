import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Service } from "encore.dev/service";

// Service declaration - Our highly slimmed down, purpose-built Content & AI Engine
export default new Service("ai");

const geminiApiKey = secret("GeminiApiKey");
const modelName = "gemini-1.5-flash";

// ============= TYPES =============

export interface PropertySocialRequest {
    propertyTitle: string;
    description: string;
    location: string;
    price: number;
    amenities: string[];
    platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin';
}

export interface PropertySocialResponse {
    hook: string;
    body: string;
    callToAction: string;
    hashtags: string[];
}

export interface PropertyAuditRequest {
    title: string;
    description: string;
    price: number;
    amenities: string[];
    imagesCount: number;
}

export interface PropertyAuditResponse {
    score: number;
    strengths: string[];
    weaknesses: string[];
    actionableAdvice: string[];
}

// ============= INTERNAL HELPERS =============

async function getModel(systemInstruction?: string, responseMimeType: string = "application/json") {
    const key = geminiApiKey();
    if (!key) throw APIError.failedPrecondition("GeminiApiKey secret is not set");

    const genAI = new GoogleGenerativeAI(key);
    return genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
        generationConfig: {
            responseMimeType,
        }
    });
}

// ============= API ENDPOINTS =============

export const generateSocialPost = api(
    { method: "POST", path: "/ai/social-post", expose: true },
    async (params: PropertySocialRequest): Promise<PropertySocialResponse> => {
        const systemInstruction = `You are an expert real estate and vacation rental marketer specializing in ${params.platform}. 
Return JSON strictly in this structure: 
{ "hook": "...", "body": "...", "callToAction": "...", "hashtags": ["...", "..."] }`;

        const model = await getModel(systemInstruction);
        const prompt = `Create a highly engaging ${params.platform} post for this property:
Title: ${params.propertyTitle}
Location: ${params.location}
Price: ${params.price} per night
Amenities: ${params.amenities.join(", ")}
Description: ${params.description}

It must be compelling and drive bookings immediately.`;

        const result = await model.generateContent(prompt);
        try {
            return JSON.parse(result.response.text());
        } catch (e) {
            throw APIError.internal("Failed to parse AI response into JSON");
        }
    }
);

export const auditListing = api(
    { method: "POST", path: "/ai/audit-listing", expose: true },
    async (params: PropertyAuditRequest): Promise<PropertyAuditResponse> => {
        const systemInstruction = `You are a strict, top-tier Airbnb/Booking.com listing auditor.
Your job is to analyze the provided listing details and identify exact reasons why it might not convert well, and list actionable improvements.
Return JSON strictly in this structure: 
{ 
    "score": number (0-100), 
    "strengths": ["...", "..."], 
    "weaknesses": ["...", "..."], 
    "actionableAdvice": ["...", "..."] 
}`;

        const model = await getModel(systemInstruction);
        const prompt = `Audit this listing for marketing resonance and conversion potential:
Title: ${params.title}
Description: ${params.description}
Price: ${params.price}
Amenities: ${params.amenities.join(', ')}
Total Images Provided: ${params.imagesCount}

Be brutal but highly actionable.`;

        const result = await model.generateContent(prompt);
        try {
            return JSON.parse(result.response.text());
        } catch (e) {
            throw APIError.internal("Failed to parse AI audit response into JSON");
        }
    }
);
