'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  index: number;
  colorClassName?: string;
}

export function KpiCard({
  title,
  value,
  subtitle,
  change,
  changeLabel = 'vs last month',
  icon,
  index,
  colorClassName,
}: KpiCardProps) {
  const isPositive = change && change > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={cn(
        "relative group overflow-hidden rounded-[2rem] p-6 transition-all duration-500",
        "glass-card hover:shadow-primary/10 hover:border-primary/30",
        colorClassName
      )}
    >
      {/* Decorative Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10 flex flex-col h-full justify-between gap-4">
        <div className="flex items-center justify-between">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-lg shadow-primary/5">
            {icon}
          </div>
          {change !== undefined && (
            <div className={cn(
              "flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
              isPositive ? "bg-green-500/10 text-green-600" : "bg-rose-500/10 text-rose-600"
            )}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(change)}%
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">{title}</p>
          <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-primary transition-colors duration-300">
            {value}
          </h4>
          {(subtitle || changeLabel) && (
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
              {subtitle || `${changeLabel}`}
            </p>
          )}
        </div>
      </div>

      {/* Shine effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
    </motion.div>
  );
}
