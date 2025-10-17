
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
import { useState } from 'react';
import { ItemDetailsDialog } from './item-details-dialog';
import { EditItemDialog } from './edit-item-dialog';
import { Button } from '@/components/ui/button';
import { View, Edit } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
  
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);


  const inventoryQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'inventory'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: inventory, isLoading } = useCollection<InventoryItem>(inventoryQuery);
  
  const isDataLoading = isLoading || isUserLoading;
  
  const getUpdatedByLabel = (item: InventoryItem) => {
    if (!item.updatedBy) return '';
    let label = item.updatedBy.displayName;
    if (item.updatedBy.post) {
        label += ` (${item.updatedBy.post})`;
    }
    return label;
  }

  return (
    <>
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
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isDataLoading && (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              )}
              {!isDataLoading && inventory?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
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
                  <TableCell className={cn(item.quantity !== undefined && item.quantity < 10 ? "text-red-500" : "")}>
                    {item.quantity} {item.unit}
                  </TableCell>
                  <TableCell>{item.value}</TableCell>
                  <TableCell>
                    {item.updatedAt && (
                      <div className="text-xs text-muted-foreground">
                        <p>{formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}</p>
                        <p>by {getUpdatedByLabel(item)}</p>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => setViewingItem(item)}>
                        <View className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setEditingItem(item)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {viewingItem && (
        <ItemDetailsDialog 
          item={viewingItem}
          open={!!viewingItem}
          onOpenChange={(isOpen) => !isOpen && setViewingItem(null)}
        />
      )}

      {editingItem && (
        <EditItemDialog
          item={editingItem}
          open={!!editingItem}
          onOpenChange={(isOpen) => !isOpen && setEditingItem(null)}
        />
      )}
    </>
  );
}
