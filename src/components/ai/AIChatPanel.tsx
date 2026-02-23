import { useEffect, useRef, useState } from 'react';
import { chat, AIMessage } from '@/lib/ai';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Props = {
  initialMessage?: string;
  onClose?: () => void;
};

export default function AIChatPanel({ initialMessage, onClose }: Props) {
  const [messages, setMessages] = useState<AIMessage[]>(initialMessage ? [{ role: 'user', content: initialMessage }] : []);
  const [loading, setLoading] = useState(false);
  const viewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialMessage) {
      // Avoid duplicate initial messages if component re-renders
      setMessages([{ role: 'user', content: initialMessage }]);
      send([{ role: 'user', content: initialMessage }]);
    }
  }, [initialMessage]);

  useEffect(() => {
    viewRef.current?.scrollTo({ top: viewRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (currentMessages = messages) => {
    if (!currentMessages.length) return;
    setLoading(true);
    try {
      const reply = await chat(currentMessages);
      setMessages((m) => [...m, reply]);
    } catch (err) {
      console.error('AI Chat Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-top-4 duration-500">
      <Card className="mx-auto w-full max-w-4xl h-[50vh] rounded-3xl border border-gray-100 shadow-2xl overflow-hidden flex flex-col bg-white">
        <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="font-semibold text-gray-700">AI Assistant</span>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full hover:bg-gray-200">
              Close
            </Button>
          )}
        </div>

        <div ref={viewRef} className="flex-1 overflow-auto p-6 space-y-4 bg-white scrollbar-hide">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] text-sm p-4 rounded-2xl ${m.role === 'assistant'
                  ? 'bg-gray-100 text-gray-800 self-start rounded-tl-none'
                  : 'bg-blue-600 text-white self-end ml-auto rounded-tr-none'
                }`}
            >
              {m.content}
            </div>
          ))}
          {loading && (
            <div className="bg-gray-100 text-gray-500 text-sm p-4 rounded-2xl w-20 flex justify-center items-center gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50/50 flex gap-2">
          <p className="text-[10px] text-gray-400 italic">This AI assistant helps you find properties and answers questions about our network.</p>
        </div>
      </Card>
    </div>
  );
}

