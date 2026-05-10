'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PremiumSectionProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function PremiumSection({
  title,
  subtitle,
  description,
  icon,
  children,
  className,
  delay = 0,
}: PremiumSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className={cn("space-y-6", className)}
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                {icon}
              </div>
            )}
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
              {title}
            </h2>
          </div>
          {(subtitle || description) && (
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {subtitle || description}
            </p>
          )}
        </div>
      </div>

      <div className="relative">
        {/* Glow behind the content */}
        <div className="absolute -inset-4 bg-primary/5 blur-[60px] rounded-[3rem] -z-10 opacity-50" />
        {children}
      </div>
    </motion.section>
  );
}
