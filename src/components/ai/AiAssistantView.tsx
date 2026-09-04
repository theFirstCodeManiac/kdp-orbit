import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Info, Lock } from 'lucide-react';
import Markdown from 'react-markdown';
import { useSubscription } from '@/src/context/SubscriptionContext.tsx';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const AiAssistantView: React.FC = () => {
  const { canAccess, isLoading: isSubscriptionLoading } = useSubscription();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your specialized KDP Assistant. I can help you with niche ideas, keyword ideas, book concepts, titles, subtitles, descriptions, cover concepts, and publishing checklists.\n\n*Note: I will not fabricate market statistics. I will explicitly tell you if I lack data.*'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        if (!response.ok) {
          throw new Error(response.status === 503 
            ? 'The AI model is currently experiencing high demand. Please try again in a few moments.' 
            : `Server returned an unexpected response (${response.status}).`);
        }
        data = { content: text }; // Fallback if somehow it's a 200 OK with text
      }

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to get response');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `**Error:** ${error.message || 'Something went wrong. Please try again.'}`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-indigo-100 p-2 rounded-lg">
          <Bot className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">KDP Publishing Assistant</h2>
          <p className="text-sm text-slate-500">Research, brainstorm, and plan your next bestselling book</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <strong>Data Policy:</strong> This AI distinguishes between verified market data and generated suggestions. It will not fabricate statistics. If verified data is unavailable, it will state so explicitly.
        </div>
      </div>

      <div className="flex-1 relative bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
        
        {(!isSubscriptionLoading && !canAccess('aiAssistant')) && (
          <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Premium Feature</h3>
            <p className="text-slate-500 max-w-md mb-6">
              The AI Publishing Assistant requires a Premium or Elite subscription. Upgrade your plan to get personalized KDP advice, keyword generation, and cover concepts.
            </p>
            <button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-semibold transition"
              onClick={() => {
                const btn = document.getElementById('nav-billing-btn');
                if (btn) btn.click();
              }}
            >
              View Plans & Pricing
            </button>
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <Bot className="h-5 w-5 text-indigo-600" />
                </div>
              )}
              
              <div 
                className={`max-w-[85%] rounded-2xl p-4 ${
                  message.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-none prose prose-sm max-w-none prose-p:leading-relaxed prose-headings:font-bold prose-a:text-indigo-600'
                }`}
              >
                {message.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <div className="markdown-body">
                    <Markdown>{message.content}</Markdown>
                  </div>
                )}
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-slate-600" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <Bot className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none p-4 flex items-center gap-2 text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. I want to publish a children's activity book about space..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-4 pr-12 transition-shadow"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <div className="mt-2 text-center">
            <span className="text-[11px] text-slate-400">
              AI suggestions are creative ideas. Always verify trends manually before publishing.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
