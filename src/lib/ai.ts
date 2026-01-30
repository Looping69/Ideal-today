export type AIMessage = { role: 'user' | 'assistant' | 'system'; content: string };

export async function chat(messages: AIMessage[]): Promise<AIMessage> {
  const endpoint = import.meta.env.AI_ENDPOINT as string | undefined;
  const apiKey = import.meta.env.AI_KEY as string | undefined;

  if (!endpoint || !apiKey) {
    const last = messages[messages.length - 1]?.content || '';
    const suggestion = last.toLowerCase().includes('beach')
      ? 'I found beachfront stays in Camps Bay and Umhlanga. Would you like dates between 12-16 Dec for 2 guests?'
      : 'Tell me where and when you want to stay. I can suggest top-rated options and set dates for you.';
    return { role: 'assistant', content: suggestion };
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) {
    return { role: 'assistant', content: 'Sorry, I could not reach the AI service. Try again in a moment.' };
  }
  const data = await res.json();
  const reply = (data?.message || data?.choices?.[0]?.message?.content || '').toString();
  return { role: 'assistant', content: reply || 'Okay.' };
}

