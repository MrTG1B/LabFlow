
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
import { useState, useMemo } from 'react';
import { ItemDetailsDialog } from './item-details-dialog';
import { EditItemDialog } from './edit-item-dialog';
import { Button } from '@/components/ui/button';
import { View, Edit, Smartphone, Monitor } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

  const itemTypesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'inventoryItemTypes'));
  }, [firestore]);
  const { data: itemTypes, isLoading: isLoadingTypes } = useCollection<InventoryItemType>(itemTypesQuery);

  const typeColorMap = useMemo(() => {
    if (!itemTypes) return {};
    return itemTypes.reduce((acc, type) => {
        acc[type.name] = type.color;
        return acc;
    }, {} as Record<string, string>);
  }, [itemTypes]);
  
  const isDataLoading = isLoading || isUserLoading || isLoadingTypes;
  
  const getUpdatedByLabel = (item: InventoryItem) => {
    if (!item.updatedBy) return '';
    let label = item.updatedBy.displayName;
    if (item.updatedBy.post) {
        label += ` (${item.updatedBy.post})`;
    }
    return label;
  }

  const getBadgeStyle = (typeName: string) => {
    const color = typeColorMap[typeName];
    if (!color) return {};
    const [h, s, l] = color.split(" ").map(Number);
    return {
        backgroundColor: `hsl(${h} ${s}% ${l}% / 0.15)`,
        color: `hsl(${h} ${s}% ${l + (l > 50 ? -20 : 20)}%)`,
        borderColor: `hsl(${h} ${s}% ${l}% / 0.2)`,
    } as React.CSSProperties;
  };


  return (
    <>
      <Card className="animate-in">
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
                <TableRow key={item.id} className="transition-colors hover:bg-muted/50">
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant={'outline'} style={getBadgeStyle(item.type)}>
                      {item.type}
                    </Badge>
                  </TableCell>
                  <TableCell className={cn(item.quantity !== undefined && item.quantity < 10 ? "text-red-400" : "")}>
                    {item.quantity} {item.unit}
                  </TableCell>
                  <TableCell>{item.value}</TableCell>
                  <TableCell>
                    {item.updatedAt && (
                      <div className="text-xs text-muted-foreground">
                        <p>{formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}</p>
                        <p className="flex items-center gap-1">
                          by {getUpdatedByLabel(item)}
                          {item.updatedBy?.device === 'Mobile' && <Smartphone className="h-3 w-3 text-green-400" />}
                          {item.updatedBy?.device === 'Desktop' && <Monitor className="h-3 w-3 text-blue-400" />}
                        </p>
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
