'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAiAssistant } from '@/hooks/useAiAssistant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Bot, User, Loader2, Sparkles, X, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ChatInterfaceProps {
  onClose: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onClose }) => {
  const { messages, sendMessage, isTyping, isInitializing, initChat, clearChat } = useAiAssistant();
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [currentAction, setCurrentAction] = useState<{name: string, data: any} | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initChat();
  }, [initChat]);

  // Extract suggestions and actions from the latest AI message
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'ai') {
      // 1. Parse Suggestions
      const suggestionMatches = lastMessage.content.match(/\[SUGGESTION: (.*?)\]/g);
      if (suggestionMatches) {
        setSuggestions(suggestionMatches.map(s => s.replace(/\[SUGGESTION: |\]/g, '')));
      } else {
        setSuggestions([]);
      }

      // 2. Parse Actions
      const actionMatch = lastMessage.content.match(/\[ACTION:(.*?):(\{.*?\})\]/);
      if (actionMatch) {
        setCurrentAction({ name: actionMatch[1], data: JSON.parse(actionMatch[2]) });
      } else {
        setCurrentAction(null);
      }
    }
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = (text?: string) => {
    const messageToSend = text || inputValue;
    if (!messageToSend.trim() || isTyping) return;
    sendMessage(messageToSend);
    setInputValue('');
    setSuggestions([]);
    setCurrentAction(null);
  };

  const executeAiAction = async () => {
    if (!currentAction) return;
    setIsExecuting(true);
    try {
      const response = await fetch('/api/ai/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ action: currentAction.name, data: currentAction.data })
      });
      if (response.ok) {
        sendMessage(`Successfully created: ${currentAction.data.title}`);
        setCurrentAction(null);
      }
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Clean the text for display (remove tags)
  const cleanContent = (text: string) => {
    return text.replace(/\[SUGGESTION: .*?\]/g, '').replace(/\[ACTION:.*?:\{.*?\}\]/g, '').trim();
  };

  return (
    <div className="flex flex-col h-[550px] w-[350px] md:w-[450px] bg-background/95 backdrop-blur-xl border rounded-2xl shadow-2xl overflow-hidden glass-morphism">
      {/* Header */}
      <div className="p-4 bg-primary/10 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary rounded-xl text-primary-foreground shadow-lg shadow-primary/20">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight capitalize">EduSphere AI Assistant</h3>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Academic Mode</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={clearChat} className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors">
            <RotateCcw size={16} />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors">
            <X size={18} />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth" ref={scrollRef}>
        {isInitializing ? (
          <div className="flex flex-col items-center justify-center h-full space-y-2 opacity-50">
            <Loader2 className="animate-spin text-primary" size={24} />
            <p className="text-xs font-medium">Synchronizing Academic Records...</p>
          </div>
        ) : (
          <>
            <AnimatePresence initial={false}>
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={cn(
                    "flex gap-3",
                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <Avatar className={cn(
                    "h-8 w-8 border",
                    msg.role === 'ai' ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted"
                  )}>
                    {msg.role === 'ai' ? (
                      <AvatarFallback className="bg-primary text-primary-foreground shadow-inner">
                        <Bot size={16} />
                      </AvatarFallback>
                    ) : (
                      <AvatarFallback>
                        <User size={16} />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className={cn(
                    "max-w-[85%] rounded-2xl p-3 text-sm shadow-sm leading-relaxed whitespace-pre-wrap",
                    msg.role === 'ai' 
                      ? "bg-secondary/50 text-secondary-foreground rounded-tl-none border backdrop-blur-sm" 
                      : "bg-primary text-primary-foreground rounded-tr-none"
                  )}>
                    {cleanContent(msg.content)}
                    
                    {/* Action Draft Card */}
                    {msg.role === 'ai' && currentAction && index === messages.length - 1 && (
                      <div className="mt-4 p-4 rounded-xl border-2 border-primary/20 bg-primary/5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="flex items-center gap-2 text-primary">
                          <Sparkles size={16} />
                          <span className="font-bold text-xs uppercase tracking-wider">Proposed {currentAction.name === 'createAssignmentDraft' ? 'Assignment' : 'Note'}</span>
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold text-foreground">{currentAction.data.title}</p>
                          <p className="text-[11px] text-muted-foreground line-clamp-2">{currentAction.data.description || currentAction.data.content}</p>
                          {currentAction.data.dueDate && (
                            <p className="text-[10px] font-medium text-primary">Due: {currentAction.data.dueDate}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={executeAiAction} disabled={isExecuting} className="flex-1 rounded-lg h-8 text-xs font-bold gap-1 shadow-lg shadow-primary/20">
                            {isExecuting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                            Create Now
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setCurrentAction(null)} disabled={isExecuting} className="flex-1 rounded-lg h-8 text-xs font-bold bg-background/50">
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <Avatar className="h-8 w-8 bg-primary text-primary-foreground border">
                  <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={16} /></AvatarFallback>
                </Avatar>
                <div className="bg-secondary/50 border rounded-2xl rounded-tl-none p-3 px-4 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-foreground/20 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-foreground/20 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-foreground/20 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Suggestions Tray */}
      {!isTyping && suggestions.length > 0 && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar border-t bg-background/30 backdrop-blur-md">
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => handleSend(suggestion)}
              className="px-3 py-1.5 rounded-full border bg-background/80 hover:bg-primary/5 hover:border-primary/40 text-[11px] font-semibold text-muted-foreground hover:text-primary transition-all whitespace-nowrap shadow-sm hover:shadow-md active:scale-95"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t bg-background/50">
        <div className="relative flex items-center gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            className="pr-10 bg-background/80 border-primary/10 focus-visible:ring-primary/20 rounded-xl placeholder:text-muted-foreground/50 h-10 text-sm"
            disabled={isTyping || isInitializing}
          />
          <Button 
            size="icon" 
            onClick={() => handleSend()} 
            disabled={!inputValue.trim() || isTyping || isInitializing}
            className={cn(
              "absolute right-1 h-8 w-8 rounded-lg transition-all",
              inputValue.trim() ? "translate-x-0 opacity-100" : "translate-x-2 opacity-0 pointer-events-none"
            )}
          >
            <Send size={14} />
          </Button>
        </div>
        <div className="mt-2 flex items-center justify-center gap-2 opacity-60">
           <div className="h-0.5 w-4 bg-primary/20 rounded-full" />
           <p className="text-[10px] text-center text-muted-foreground font-semibold uppercase tracking-widest">
            Specialized Academic Companion
          </p>
          <div className="h-0.5 w-4 bg-primary/20 rounded-full" />
        </div>
      </div>
    </div>
  );
};
