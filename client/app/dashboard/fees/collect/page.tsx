'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { feeAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Search, ArrowRight, Banknote, UserRoundCheck } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
interface FeeStudent {
  id: string;
  admissionNumber: string;
  name: string;
  className: string;
  sectionName: string;
  feeStatus: string;
  totalPending: number;
}

export default function FeeCollectSearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<FeeStudent[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { canCollectFees } = usePermissions();

  // Redirect if unauthorized
  useEffect(() => {
    if (canCollectFees === false) {
      router.push('/dashboard/fees');
    }
  }, [canCollectFees, router]);

  // Debounced Search Effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      const query = searchQuery;
      if (!query || query.trim().length === 0) {
        setResults([]);
        setHasSearched(false);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      setHasSearched(true);
      try {
        const data = await feeAPI.getFeeStudents({ search: query, limit: 10 });
        setResults(data.students || []);
      } catch (err) {
        console.error('Student search failed', err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Trigger search on input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      PAID: 'bg-green-100 text-green-700 hover:bg-green-100',
      PENDING: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
      PARTIAL: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
      OVERDUE: 'bg-red-100 text-red-700 hover:bg-red-100',
    };
    return variants[status] || 'bg-gray-100 text-gray-700 hover:bg-gray-100';
  };

  if (canCollectFees === false) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fee Counter</h1>
          <p className="text-muted-foreground">Select a student to view ledgers and collect payments</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/fees">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Fees Dashboard
          </Link>
        </Button>
      </div>

      <Card className="border-2 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b pb-6">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Search className="h-5 w-5 text-primary" />
            Smart Search
          </CardTitle>
          <CardDescription>
            Enter admission number, roll number, or student name
          </CardDescription>

          <div className="relative mt-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <Input
              type="text"
              placeholder="e.g. ADM23001 or John Doe..."
              value={searchQuery}
              onChange={handleInputChange}
              className="pl-10 h-14 text-lg bg-white shadow-inner focus-visible:ring-primary/50"
              autoFocus
            />
            {isSearching && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {!hasSearched && !isSearching && (
            <div className="py-16 text-center text-slate-500 flex flex-col items-center">
              <div className="bg-slate-100 p-4 rounded-full mb-4">
                <UserRoundCheck className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-lg font-medium">Ready to collect</p>
              <p className="text-sm">Start typing above to find a student instantly</p>
            </div>
          )}

          {hasSearched && !isSearching && results.length === 0 && (
            <div className="py-16 text-center text-slate-500">
              <p className="text-lg font-medium text-slate-700">No students found</p>
              <p className="text-sm">Double check the spelling or admission number</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="divide-y">
              {results.map((student) => (
                <div
                  key={student.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex gap-4">
                    <div className="bg-primary/10 text-primary p-3 rounded-lg hidden sm:flex items-center justify-center h-12 w-12 shrink-0">
                      <Banknote className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 group-hover:text-primary transition-colors">
                        {student.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs text-slate-700">
                          {student.admissionNumber}
                        </span>
                        <span>•</span>
                        <span>Class: {student.className} {student.sectionName !== 'N/A' && `(${student.sectionName})`}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-0 flex w-full sm:w-auto items-center justify-between sm:justify-end gap-6 border-t sm:border-0 pt-4 sm:pt-0">
                    <div className="flex flex-col items-start sm:items-end">
                      <Badge className={getStatusBadge(student.feeStatus)} variant="outline">
                        {student.feeStatus}
                      </Badge>
                      {student.totalPending > 0 && (
                        <span className="text-sm font-semibold text-red-600 mt-1">
                          Pending: ₹{student.totalPending.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <Button asChild className="shrink-0 gap-2">
                      <Link href={`/dashboard/fees/collect/${student.id}`}>
                        Select <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
