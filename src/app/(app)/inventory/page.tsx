
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useCollection, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import type { InventoryItem, InventoryItemType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AddItemDialog } from './add-item-dialog';
import { Skeleton } from '@/components/ui/skeleton';

const typeColorMap: Record<InventoryItemType, string> = {
    'Capacitor': 'bg-blue-500/20 text-blue-500 border-blue-500/50',
    'Resistor': 'bg-green-500/20 text-green-500 border-green-500/50',
    'IC': 'bg-purple-500/20 text-purple-500 border-purple-500/50',
    'Connector': 'bg-orange-500/20 text-orange-500 border-orange-500/50',
    'Misc': 'bg-gray-500/20 text-gray-500 border-gray-500/50',
};

export default function InventoryPage() {
  const firestore = useFirestore();
  const { isUserLoading } = useUser();

  const inventoryQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'inventory'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: inventory, isLoading } = useCollection<InventoryItem>(inventoryQuery);
  
  const isDataLoading = isLoading || isUserLoading;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Inventory</CardTitle>
          <CardDescription>
            Manage electronic components, including storage locations.
          </CardDescription>
        </div>
        <AddItemDialog />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Barcode</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isDataLoading && (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                </TableRow>
              ))
            )}
            {!isDataLoading && inventory?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No inventory items found. Add one to get started.
                </TableCell>
              </TableRow>
            )}
            {!isDataLoading && inventory?.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  <Badge variant={'outline'} className={cn(typeColorMap[item.type])}>
                    {item.type}
                  </Badge>
                </TableCell>
                <TableCell className={cn(item.quantity < 10 ? "text-red-500" : "")}>
                  {item.quantity} {item.unit}
                </TableCell>
                <TableCell>{item.value}</TableCell>
                <TableCell className="font-mono text-xs">{item.barcode}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
