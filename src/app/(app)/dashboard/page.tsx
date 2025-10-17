
'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Boxes, Users, Package } from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import type { InventoryItem, Vendor } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const firestore = useFirestore();

  const inventoryQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'inventory'));
  }, [firestore]);
  const { data: inventory, isLoading: isLoadingInventory } = useCollection<InventoryItem>(inventoryQuery);

  const recentItemsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'inventory'), orderBy('createdAt', 'desc'), limit(5));
  }, [firestore]);
  const { data: recentItems, isLoading: isLoadingRecent } = useCollection<InventoryItem>(recentItemsQuery);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'vendors'));
  }, [firestore]);
  const { data: vendors, isLoading: isLoadingVendors } = useCollection<Vendor>(vendorsQuery);

  const stats = useMemo(() => {
    if (!inventory) return { totalValue: 0, lowStockCount: 0 };
    
    const totalValue = inventory.reduce((acc, item) => acc + (item.quantity * (item.rate || 0)), 0);
    const lowStockCount = inventory.filter(item => item.quantity < 10).length;

    return { totalValue, lowStockCount };
  }, [inventory]);

  const isLoading = isLoadingInventory || isLoadingRecent || isLoadingVendors;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Inventory Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">₹{stats.totalValue.toFixed(2)}</div>}
            <p className="text-xs text-muted-foreground">
              Based on quantity and rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Items Low on Stock
            </CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{stats.lowStockCount}</div>}
             <p className="text-xs text-muted-foreground">
              Items with quantity less than 10
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Vendors
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{vendors?.length || 0}</div>}
             <p className="text-xs text-muted-foreground">
              Number of registered suppliers
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Recently Added Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                </TableRow>
              ))}
              {!isLoading && recentItems?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No items have been added yet.
                  </TableCell>
                </TableRow>
              )}
               {!isLoading && recentItems?.map(item => (
                <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                        <Badge variant="outline">{item.type}</Badge>
                    </TableCell>
                    <TableCell>{item.quantity} {item.unit}</TableCell>
                    <TableCell className="text-muted-foreground">
                        {item.createdAt ? `${formatDistanceToNow(new Date(item.createdAt))} ago` : 'N/A'}
                    </TableCell>
                </TableRow>
               ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
