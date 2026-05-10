'use client';

import { motion } from 'framer-motion';
import { CreditCard, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import type { FeeCollectionSummary as SummaryType } from '@/lib/api';

interface FeeCollectionSummaryProps {
  summary: SummaryType;
}

function formatINR(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toFixed(0)}`;
}

export function FeeCollectionSummary({ summary }: FeeCollectionSummaryProps) {
  return (
    <div className="rounded-3xl border-none bg-card text-card-foreground shadow-sm premium-shadow glass overflow-hidden flex flex-col h-full">
      <div className="p-6 flex flex-row items-center justify-between pb-3 bg-primary/5">
        <div>
          <div className="leading-none tracking-tight flex items-center gap-2 text-foreground font-black uppercase text-sm">
            <CreditCard className="h-4 w-4 text-primary" /> Fee Collection
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Academic Year Summary</p>
        </div>
      </div>
      <div className="p-6 pt-8 flex-1 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex justify-between items-center p-3 rounded-2xl bg-muted/30 border border-border/50">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">Expected</span>
              <span className="font-black text-lg">{formatINR(summary.totalExpected)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-2xl bg-green-500/5 border border-green-500/10">
              <span className="text-xs font-bold text-green-600 uppercase tracking-tighter">Collected</span>
              <span className="font-black text-lg text-green-600">{formatINR(summary.collected)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-2xl bg-rose-500/5 border border-rose-500/10">
              <span className="text-xs font-bold text-rose-600 uppercase tracking-tighter">Pending</span>
              <span className="font-black text-lg text-rose-600">{formatINR(summary.pending)}</span>
            </div>
          </div>
          
          <div className="pt-2">
            <div className="flex justify-between text-xs mb-3">
              <span className="font-black uppercase tracking-tighter text-primary">Collection Efficiency</span>
              <span className="font-black text-primary">{Number(summary.collectionRate || 0).toFixed(1)}%</span>
            </div>
            <div className="relative h-3 w-full bg-muted rounded-full overflow-hidden shadow-inner">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${Number(summary.collectionRate || 0)}%` }}
                 transition={{ duration: 1, ease: "easeOut" }}
                 className="h-full premium-gradient shadow-lg shadow-primary/30"
               />
            </div>
          </div>
        </div>
        
        <Link href="/dashboard/fees" className="mt-10">
          <Button className="w-full gap-2 font-black shadow-lg shadow-primary/20 premium-gradient hover:scale-[1.02] active:scale-[0.98] transition-all h-12 rounded-2xl" size="lg">
            View Full Report <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
