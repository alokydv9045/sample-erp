'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ChatInterface } from './ChatInterface';
import { Button } from '@/components/ui/button';
import { Sparkles, MessageSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export const AiFloatingWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();

  // Only show the widget for STUDENTS and TEACHERS
  const isTargetRole = user && ['STUDENT', 'TEACHER'].includes(user.role);
  
  if (!isAuthenticated || !isTargetRole) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="mb-2"
          >
            <ChatInterface onClose={() => setIsOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.div
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="icon"
          className={cn(
            "h-16 w-16 rounded-3xl shadow-2xl transition-all duration-500 premium-shadow",
            isOpen 
              ? "bg-rose-500 hover:bg-rose-600 rotate-90" 
              : "premium-gradient hover:shadow-primary/40 text-primary-foreground"
          )}
        >
          {isOpen ? (
            <X size={32} />
          ) : (
            <div className="relative">
              <MessageSquare size={32} className="fill-current/10" />
              <motion.div
                animate={{ 
                  scale: [1, 1.4, 1],
                  rotate: [0, 15, -15, 0],
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -top-2 -right-2"
              >
                <Sparkles size={20} className="text-yellow-300 fill-yellow-300 shadow-glow" />
              </motion.div>
            </div>
          )}
        </Button>
      </motion.div>

      {/* "How can I help?" Tooltip (Only when closed) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: 1 }}
            className="absolute right-24 bottom-4 glass px-4 py-2 rounded-2xl shadow-xl hidden md:block border-none ring-1 ring-primary/20"
          >
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Hi {user.firstName}! <span className="text-primary">How can I help?</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
