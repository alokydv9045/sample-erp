'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { inventoryAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, Loader2, Package, AlertTriangle, TrendingDown, BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RealtimeChart } from '@/components/dashboard/RealtimeChart';
import { useSocket } from '@/hooks/useSocket';

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [itemForm, setItemForm] = useState({
    name: '',
    category: '',
    quantity: '',
    unit: '',
    minStockLevel: '',
    location: '',
  });

  const fetchItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await inventoryAPI.getItems();
      setItems(data.items || []);
    } catch (err) {
      console.error('Failed to fetch inventory items', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const { socket } = useSocket();

  useEffect(() => {
    if (socket) {
      const handleUpdate = () => {
        // fetchItems() is called automatically on socket updates to keep the UI in sync
        fetchItems();
      };

      socket.on('INVENTORY_ITEM_CREATED', handleUpdate);
      socket.on('INVENTORY_ITEM_UPDATED', handleUpdate);
      socket.on('INVENTORY_STOCK_MOVEMENT', handleUpdate);

      return () => {
        socket.off('INVENTORY_ITEM_CREATED', handleUpdate);
        socket.off('INVENTORY_ITEM_UPDATED', handleUpdate);
        socket.off('INVENTORY_STOCK_MOVEMENT', handleUpdate);
      };
    }
  }, [socket, fetchItems]);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inventoryAPI.createItem({
        ...itemForm,
        quantity: parseInt(itemForm.quantity),
        minStockLevel: parseInt(itemForm.minStockLevel),
      });
      setIsDialogOpen(false);
      setItemForm({ name: '', category: '', quantity: '', unit: '', minStockLevel: '', location: '' });
      fetchItems();
    } catch (err) {
      console.error('Failed to create item', err);
    }
  };

  const filteredItems = items.filter((item) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      item.name?.toLowerCase().includes(searchLower) ||
      item.category?.toLowerCase().includes(searchLower)
    );
  });

  const lowStockItems = filteredItems.filter(item =>
    item.quantity <= (item.minStockLevel || 10)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">Manage school inventory and track stock levels</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/inventory/movements">View Movements</Link>
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Inventory Item</DialogTitle>
                <DialogDescription>Add a new item to the inventory</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateItem} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name *</Label>
                  <Input
                    id="name"
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    placeholder="e.g., Whiteboard Marker"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="STATIONERY">Stationery</option>
                    <option value="FURNITURE">Furniture</option>
                    <option value="ELECTRONICS">Electronics</option>
                    <option value="SPORTS">Sports Equipment</option>
                    <option value="CLEANING">Cleaning Supplies</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={itemForm.quantity}
                      onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                      placeholder="e.g., 100"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit *</Label>
                    <Input
                      id="unit"
                      value={itemForm.unit}
                      onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                      placeholder="e.g., pieces, boxes"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minStockLevel">Minimum Stock Level *</Label>
                  <Input
                    id="minStockLevel"
                    type="number"
                    value={itemForm.minStockLevel}
                    onChange={(e) => setItemForm({ ...itemForm, minStockLevel: e.target.value })}
                    placeholder="e.g., 10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={itemForm.location}
                    onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })}
                    placeholder="e.g., Store Room A"
                  />
                </div>
                <Button type="submit">Add Item</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList>
          <TabsTrigger value="list">Item List</TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6 pt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <RealtimeChart 
              title="Stock Distribution" 
              description="Breakdown of stock by category"
              endpoint="/dashboard/inventory-stats"
              socketEvent="INVENTORY_UPDATE"
              type="pie"
              xAxisKey="name"
              dataKey="value"
              colors={["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"]}
            />
            <RealtimeChart 
              title="Movement Frequency" 
              description="Top 10 most moved items"
              endpoint="/dashboard/inventory-stats"
              socketEvent="INVENTORY_UPDATE"
              type="bar"
              xAxisKey="name"
              dataKey="movements"
              color="#8b5cf6"
            />
          </div>
          
          <div className="grid gap-6 md:grid-cols-1">
             <RealtimeChart 
                title="Inventory Activity" 
                description="Recent stock level changes across all items"
                endpoint="/dashboard/inventory-stats"
                socketEvent="INVENTORY_UPDATE"
                type="area"
                xAxisKey="name"
                dataKey="value"
                color="#10b981"
              />
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Package className="mx-auto mb-2 h-8 w-8 text-blue-600" />
                  <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold">{items.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <TrendingDown className="mx-auto mb-2 h-8 w-8 text-green-600" />
                  <p className="text-sm font-medium text-muted-foreground">In Stock</p>
                  <p className="text-2xl font-bold">{items.filter(i => i.quantity > 10).length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-orange-600" />
                  <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                  <p className="text-2xl font-bold text-orange-600">{lowStockItems.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Package className="mx-auto mb-2 h-8 w-8 text-purple-600" />
                  <p className="text-sm font-medium text-muted-foreground">Categories</p>
                  <p className="text-2xl font-bold">6</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Low Stock Alert */}
          {lowStockItems.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-900">
                      {lowStockItems.length} item{lowStockItems.length !== 1 ? 's are' : ' is'} running low on stock
                    </p>
                    <p className="text-sm text-orange-700">
                      Please reorder these items to maintain adequate inventory levels
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Inventory Table */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Items</CardTitle>
              <CardDescription>
                Browse and manage all inventory items ({filteredItems.length} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium">No items found</p>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? 'Try adjusting your search' : 'Get started by adding inventory items'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Min Level</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map((item) => {
                        const isLowStock = item.quantity <= (item.minStockLevel || 10);
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{item.category || 'Other'}</Badge>
                            </TableCell>
                            <TableCell className={isLowStock ? 'font-bold text-orange-600' : ''}>
                              {item.quantity}
                            </TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell>{item.minStockLevel || 'N/A'}</TableCell>
                            <TableCell>{item.location || '-'}</TableCell>
                            <TableCell>
                              {isLowStock ? (
                                <Badge className="bg-orange-100 text-orange-700">Low Stock</Badge>
                              ) : (
                                <Badge className="bg-green-100 text-green-700">In Stock</Badge>
                              )}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
