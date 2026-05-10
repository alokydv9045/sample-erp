import { useState, useCallback, useRef } from 'react';
import { aiAPI, ChatMessage } from '@/lib/api/ai';
import { toast } from 'sonner';

export const useAiAssistant = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const hasInitialized = useRef(false);

  const initChat = useCallback(async () => {
    if (hasInitialized.current) return;
    
    setIsInitializing(true);
    try {
      const data = await aiAPI.initChat();
      if (data.success) {
        setMessages([{ role: 'ai', content: data.greeting }]);
        hasInitialized.current = true;
      }
    } catch (error) {
      console.error('Failed to initialize AI:', error);
      // Fallback greeting if API fails
      setMessages([{ role: 'ai', content: "Hello! I'm your EduSphere Assistant. How can I help you today?" }]);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Prepare history (limit to last 10 messages for token efficiency)
      const history = messages
        .slice(-10)
        .map(msg => ({ 
          role: msg.role === 'user' ? 'user' : 'assistant', 
          content: msg.content 
        }));

      const data = await aiAPI.sendMessage(content, history);
      
      if (data.success) {
        setMessages((prev) => [...prev, { role: 'ai', content: data.response }]);
      }
    } catch (error) {
      console.error('AI Message Error:', error);
      toast.error('Failed to get response from AI assistant');
      setMessages((prev) => [...prev, { role: 'ai', content: "I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsTyping(false);
    }
  }, [messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
    hasInitialized.current = false;
    initChat();
  }, [initChat]);

  return {
    messages,
    isTyping,
    isInitializing,
    initChat,
    sendMessage,
    clearChat
  };
};
