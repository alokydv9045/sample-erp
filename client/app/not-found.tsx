'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Search, Home, ArrowLeft, Map } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-sans overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/20 blur-[150px] rounded-full"
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 text-center space-y-12 max-w-xl"
      >
        {/* 404 Visual */}
        <div className="relative">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-[12rem] md:text-[16rem] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-white/20 to-white/5 select-none"
          >
            404
          </motion.h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-32 w-32 rounded-[2.5rem] glass flex items-center justify-center border-none ring-1 ring-white/20 shadow-2xl animate-bounce">
              <Search className="h-16 w-16 text-primary" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.6em] text-primary mb-4">Navigation Failure</p>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">
              Coordinate <span className="text-primary">Mismatch</span>
            </h2>
          </motion.div>
          
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
            The resource you are attempting to access does not exist in the current system architecture. Please verify the URL or return to base.
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button className="h-14 px-10 rounded-2xl premium-gradient text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all w-full sm:w-auto">
              <Home className="h-4 w-4 mr-3" /> Dashboard Core
            </Button>
          </Link>
          <Button 
            variant="ghost"
            onClick={() => window.history.back()}
            className="h-14 px-10 rounded-2xl glass text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/5 border-white/10 w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-3" /> Go Back
          </Button>
        </motion.div>

        {/* System Status Line */}
        <div className="pt-8 flex items-center justify-center gap-3 text-[9px] font-black uppercase tracking-widest text-slate-600">
          <Map className="h-3 w-3" /> Global Directory Search Active
        </div>
      </motion.div>
    </div>
  );
}
