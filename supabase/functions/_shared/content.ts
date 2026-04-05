import { assert, isNonEmptyString } from "./validation.ts";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

function geminiApiKey() {
  const value = Deno.env.get("GEMINI_API_KEY");
  if (!value) throw new Error("Missing GEMINI_API_KEY");
  return value;
}

function modelName() {
  return Deno.env.get("GEMINI_MODEL") || "gemini-1.5-flash";
}

async function generate(prompt: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName()}:generateContent?key=${geminiApiKey()}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      }),
    },
  );

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error?.message || "Content generation failed");
  }

  const text = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("").trim();
  if (!text) throw new Error("Model returned an empty response");
  return text;
}

export async function generateHolidayChat(messages: ChatMessage[]) {
  assert(Array.isArray(messages) && messages.length > 0, "At least one message is required");
  const transcript = messages
    .filter((message) => isNonEmptyString(message.content))
    .slice(-12)
    .map((message) => `${message.role.toUpperCase()}: ${message.content.trim()}`)
    .join("\n");

  const prompt = [
    "You are Ideal Stay's holiday accommodation assistant for South Africa.",
    "Help guests narrow down destinations, stay styles, trip timing, family fit, and booking questions.",
    "Do not invent live inventory or prices.",
    "If exact availability is unknown, say that clearly and suggest the next best narrowing question.",
    "Keep answers under 120 words and make them useful and direct.",
    "",
    transcript,
  ].join("\n");

  return generate(prompt);
}

export async function generateSocialPost(input: {
  propertyTitle: string;
  description: string;
  location: string;
  price: number;
  amenities: string[];
  platform: "instagram" | "facebook" | "twitter" | "linkedin";
}) {
  const prompt = [
    `Write a ${input.platform} post for a holiday accommodation listing in South Africa.`,
    "Return strict JSON with keys: hook, body, callToAction, hashtags.",
    `Title: ${input.propertyTitle}`,
    `Location: ${input.location}`,
    `Price per night (ZAR): ${input.price}`,
    `Amenities: ${input.amenities.join(", ") || "None provided"}`,
    `Description: ${input.description}`,
  ].join("\n");

  return JSON.parse(await generate(prompt));
}

export async function auditListing(input: {
  title: string;
  description: string;
  price: number;
  amenities: string[];
  imagesCount: number;
}) {
  const prompt = [
    "Audit this holiday accommodation listing.",
    "Return strict JSON with keys: score, strengths, weaknesses, actionableAdvice.",
    "Be commercially useful and blunt when needed.",
    `Title: ${input.title}`,
    `Description: ${input.description}`,
    `Price per night (ZAR): ${input.price}`,
    `Amenities: ${input.amenities.join(", ") || "None provided"}`,
    `Image count: ${input.imagesCount}`,
  ].join("\n");

  return JSON.parse(await generate(prompt));
}
