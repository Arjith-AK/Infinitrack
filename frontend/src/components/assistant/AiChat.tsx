import { useState, useRef, useEffect } from 'react';
import { HiOutlinePaperAirplane } from 'react-icons/hi';
import { Button } from '@/components/ui/Button';
import { useRobotStore } from '@/stores/robotStore';
import { generateId } from '@/utils';
import { getAssistantReply } from '@/utils/assistant/respond';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  text: "Hello! I'm your InfiniTrack AI assistant. How can I help with field marking today?",
};

export function AiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const telemetry = useRobotStore((s) => s.telemetry);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    const userMessage: ChatMessage = { id: generateId(), role: 'user', text };
    const reply: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      text: getAssistantReply(text, telemetry),
    };

    setMessages((prev) => [...prev, userMessage, reply]);
    setInput('');
  };

  return (
    <div className="flex flex-col gap-3">
      <div ref={scrollRef} className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {messages.map((message) => (
          <ChatBubble key={message.id} role={message.role} message={message.text} />
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="input-field"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder="Ask about field dimensions, sports rules..."
        />
        <Button
          size="md"
          icon={<HiOutlinePaperAirplane className="w-4 h-4 rotate-90" />}
          onClick={handleSend}
          disabled={!input.trim()}
        />
      </div>
    </div>
  );
}

function ChatBubble({ role, message }: { role: 'user' | 'assistant'; message: string }) {
  return (
    <div className={`p-3 rounded-xl text-sm ${role === 'assistant' ? 'bg-brand-600/20 text-white' : 'bg-white/10 text-white ml-8'}`}>
      {message}
    </div>
  );
}
