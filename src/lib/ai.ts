export type AIMessage = { role: 'user' | 'assistant' | 'system'; content: string };

import { supabase } from "@/lib/supabase";

export async function chat(messages: AIMessage[]): Promise<AIMessage> {
  const { data, error } = await supabase.functions.invoke("content-engine", {
    body: {
      action: "chat",
      messages,
    },
  });

  if (error) {
    return { role: 'assistant', content: 'Sorry, I could not reach the AI service. Try again in a moment.' };
  }

  const reply = (data?.message || '').toString();
  return { role: 'assistant', content: reply || 'Okay.' };
}
