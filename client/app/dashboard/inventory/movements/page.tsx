'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { inventoryAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, TrendingUp, TrendingDown } from 'lucide-react';

export default function InventoryMovementsPage() {
  const [movements, setMovements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    try {
      setIsLoading(true);
      const data = await inventoryAPI.getMovements();
      setMovements(data.movements || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch movements');
    } finally {
      setIsLoading(false);
    }
  };

  const getMovementBadge = (type: string) => {
    if (type === 'IN' || type === 'PURCHASE') {
      return {
        label: type === 'IN' ? 'Stock In' : 'Purchase',
        className: 'bg-green-100 text-green-700',
        icon: TrendingUp
      };
    } else {
      return {
        label: type === 'OUT' ? 'Stock Out' : 'Usage',
        className: 'bg-red-100 text-red-700',
        icon: TrendingDown
      };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/inventory">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Inventory
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Stock Movements</h1>
        <p className="text-muted-foreground">Track all inventory stock movements and transactions</p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Total Movements</p>
              <p className="text-3xl font-bold">{movements.length}</p>
              <p className="mt-2 text-xs text-muted-foreground">Last 30 days</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="mx-auto mb-2 h-8 w-8 text-green-600" />
              <p className="text-sm font-medium text-muted-foreground">Stock In</p>
              <p className="text-3xl font-bold text-green-600">
                {movements.filter(m => m.type === 'IN' || m.type === 'PURCHASE').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingDown className="mx-auto mb-2 h-8 w-8 text-red-600" />
              <p className="text-sm font-medium text-muted-foreground">Stock Out</p>
              <p className="text-3xl font-bold text-red-600">
                {movements.filter(m => m.type === 'OUT' || m.type === 'USAGE').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Movements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Movement History</CardTitle>
          <CardDescription>Complete log of all inventory movements</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{typeof error === "string" ? error : JSON.stringify(error)}</div>
          ) : movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium">No movements recorded</p>
              <p className="text-sm text-muted-foreground">
                Stock movements will appear here once items are added or removed
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => {
                    const badge = getMovementBadge(movement.type);
                    const Icon = badge.icon;
                    return (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {new Date(movement.createdAt).toLocaleDateString()}
                          <br />
                          <span className="text-xs text-muted-foreground">
                            {new Date(movement.createdAt).toLocaleTimeString()}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{movement.item?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className={badge.className}>
                            <Icon className="mr-1 h-3 w-3" />
                            {badge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {movement.type === 'IN' || movement.type === 'PURCHASE' ? '+' : '-'}
                          {movement.quantity} {movement.item?.unit || 'units'}
                        </TableCell>
                        <TableCell>{movement.reference || '-'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {movement.remarks || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
