'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Megaphone, AlertCircle, Info, BellRing, Calendar, User, X } from 'lucide-react';
import { announcementAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export function TopAnnouncementBar() {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isHovered, setIsHovered] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [contentWidth, setContentWidth] = useState(2000);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const res = await announcementAPI.getActive();
                if (res.announcements && res.announcements.length > 0) {
                    setAnnouncements(res.announcements);
                }
            } catch (error) {
                console.error('Failed to fetch announcements:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnnouncements();
    }, []);

    // Dynamically measure content width for smooth scrolling
    const measureWidth = useCallback((node: HTMLDivElement | null) => {
        if (node) {
            // Measure after render
            requestAnimationFrame(() => {
                const scrollW = node.scrollWidth;
                if (scrollW > 0) {
                    setContentWidth(scrollW / 3); // Divided by 3 because we tripled the content
                }
            });
        }
    }, []);

    if (isLoading || announcements.length === 0 || isDismissed) {
        return null;
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENT':
            case 'HIGH': return 'bg-red-600 text-white';
            case 'MEDIUM':
            case 'NORMAL': return 'bg-blue-600 text-white';
            case 'LOW': return 'bg-green-700 text-white';
            default: return 'bg-slate-800 text-white';
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'URGENT':
            case 'HIGH': return <AlertCircle className="h-4 w-4 animate-pulse" />;
            case 'MEDIUM':
            case 'NORMAL': return <Megaphone className="h-4 w-4" />;
            default: return <Info className="h-3.5 w-3.5" />;
        }
    };

    const handleAnnouncementClick = (ann: any) => {
        setSelectedAnnouncement(ann);
        setIsModalOpen(true);
    };

    return (
        <>
            <div
                className="w-full bg-primary overflow-hidden py-2 border-b border-primary/20 relative z-50 flex items-center shadow-lg"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="absolute left-0 top-0 bottom-0 bg-primary z-10 px-4 flex items-center border-r border-white/20">
                    <BellRing className="h-4 w-4 text-white mr-2" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/90">Updates</span>
                </div>

                <motion.div
                    ref={(node) => {
                        measureWidth(node);
                    }}
                    className="flex whitespace-nowrap gap-12 pl-32 pr-10 items-center"
                    animate={{
                        x: isHovered ? 0 : [0, -contentWidth],
                    }}
                    transition={{
                        x: {
                            repeat: Infinity,
                            repeatType: "loop",
                            duration: Math.max(20, contentWidth / 50),
                            ease: "linear",
                        },
                    }}
                >
                    {/* Render announcements multiple times for seamless loop */}
                    {[...announcements, ...announcements, ...announcements].map((ann, idx) => (
                        <button
                            key={`${ann.id}-${idx}`}
                            onClick={() => handleAnnouncementClick(ann)}
                            className="flex items-center gap-3 group outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 transition-all"
                        >
                            <span className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1.5 shrink-0",
                                getPriorityColor(ann.priority)
                            )}>
                                {getPriorityIcon(ann.priority)}
                                {ann.priority}
                            </span>
                            <span className="text-sm font-bold text-white group-hover:text-white/80 transition-all">
                                {ann.title}
                            </span>
                            <span className="text-xs text-white/40">•</span>
                        </button>
                    ))}
                </motion.div>

                <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-900 to-transparent pointer-events-none z-10" />
                {/* Dismiss button */}
                <button
                    onClick={() => setIsDismissed(true)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
                    title="Dismiss announcements"
                >
                    <X className="h-3 w-3" />
                </button>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="w-[90vw] md:w-full max-w-2xl bg-card border-border shadow-2xl p-4 sm:p-6 max-h-[85vh] overflow-y-auto top-[5%] sm:top-[50%] translate-y-0 sm:-translate-y-1/2 mt-4 sm:mt-0">
                    {selectedAnnouncement && (
                        <>
                            <DialogHeader className="space-y-4">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <Badge className={cn(
                                        "px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
                                        getPriorityColor(selectedAnnouncement.priority)
                                    )}>
                                        {selectedAnnouncement.priority} Priority
                                    </Badge>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(selectedAnnouncement.createdAt).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </div>
                                </div>
                                <DialogTitle className="text-2xl font-bold leading-tight">
                                    {selectedAnnouncement.title}
                                </DialogTitle>
                                <DialogDescription className="sr-only">
                                    Details for announcement: {selectedAnnouncement.title}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="mt-6 space-y-6">
                                <div className="p-6 rounded-2xl bg-muted/30 border border-border/50 min-h-[150px]">
                                    <p className="text-base text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                        {selectedAnnouncement.content}
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 border-t border-border/50 gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold">School Administration</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Office of Principal</p>
                                        </div>
                                    </div>

                                    {selectedAnnouncement.expiresAt && (
                                        <div className="text-right">
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Valid Until</p>
                                            <p className="text-xs font-medium">
                                                {new Date(selectedAnnouncement.expiresAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
