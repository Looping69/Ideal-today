import { useEffect, useRef, useState } from 'react';
import { chat, AIMessage } from '@/lib/ai';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Props = {
  initialMessage?: string;
};

export default function AIChatPanel({ initialMessage }: Props) {
  const [messages, setMessages] = useState<AIMessage[]>(initialMessage ? [{ role: 'user', content: initialMessage }] : []);
  const [loading, setLoading] = useState(false);
  const viewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialMessage) send();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage]);

  useEffect(() => {
    viewRef.current?.scrollTo({ top: viewRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    if (!messages.length) return;
    setLoading(true);
    const reply = await chat(messages);
    setMessages((m) => [...m, reply]);
    setLoading(false);
  };

  return (
    <div className="fixed bottom-24 left-0 right-0 z-[1500] px-4">
      <Card className="mx-auto w-full max-w-4xl h-[45vh] rounded-2xl border shadow-lg overflow-hidden">
        <div ref={viewRef} className="h-full overflow-auto p-4 space-y-3 bg-white">
          {messages.map((m, i) => (
            <div key={i} className={`text-sm ${m.role === 'assistant' ? 'bg-gray-50' : 'bg-blue-50'} border rounded-xl p-3`}>{m.content}</div>
          ))}
          {loading && <div className="text-sm text-gray-500">Thinking…</div>}
        </div>
        <div className="p-3 border-t bg-white flex justify-end">
          <Button size="sm" onClick={send} disabled={loading || messages.length === 0}>Ask AI</Button>
        </div>
      </Card>
    </div>
  );
}

