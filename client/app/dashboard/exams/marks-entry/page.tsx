'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { examAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, UserCheck, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

export default function MarksEntryPage() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            setIsLoading(true);
            const data = await examAPI.getTeacherTasks();
            setTasks(data.tasks || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch assigned tasks');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-md bg-destructive/10 p-4 text-destructive flex items-center gap-3">
                <AlertCircle className="h-5 w-5" />
                <p>{typeof error === "string" ? error : JSON.stringify(error)}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Marks Entry Portal</h1>
                <p className="text-muted-foreground">Manage marks for your assigned subjects and classes</p>
            </div>

            {tasks.length === 0 ? (
                <Card className="bg-muted/50">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
                        <h3 className="text-lg font-medium">No active tasks found</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
                            You don't have any pending marks entry tasks. This could be because no exams are currently published for your assigned classes.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {tasks.map((task, idx) => {
                        const percentage = task.progress.total > 0
                            ? Math.round((task.progress.entered / task.progress.total) * 100)
                            : 0;

                        return (
                            <Card key={`${task.examId}-${task.subjectId}-${idx}`} className="hover:border-primary/50 transition-colors">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                            {task.className}
                                        </Badge>
                                        {task.progress.isComplete && (
                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        )}
                                    </div>
                                    <CardTitle className="text-xl line-clamp-1">{task.subjectName}</CardTitle>
                                    <CardDescription className="line-clamp-1">{task.examName}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-medium">
                                            <span>Progress</span>
                                            <span>{task.progress.entered} / {task.progress.total} Students</span>
                                        </div>
                                        <Progress value={percentage} className="h-2" />
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <UserCheck className="h-3.5 w-3.5" />
                                        <span>Roll No range & student names loaded</span>
                                    </div>

                                    <Button asChild className="w-full mt-2">
                                        <Link href={`/dashboard/exams/${task.examId}?tab=marks&subject=${task.subjectId}`}>
                                            Enter Marks
                                            <ChevronRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
