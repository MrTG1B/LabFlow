
'use client';

import { useState } from 'react';
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
import { useCollection, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import type { Vendor, VendorType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AddVendorDialog } from './add-vendor-dialog';
import { EditVendorDialog } from './edit-vendor-dialog';
import { Button } from '@/components/ui/button';
import { Edit, View, Smartphone, Monitor } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { VendorDetailsDialog } from './vendor-details-dialog';

const typeColorMap: Record<VendorType, string> = {
    'Online': 'bg-green-900/50 text-green-300 border-green-500/50',
    'Offline': 'bg-blue-900/50 text-blue-300 border-blue-500/50',
};


export default function VendorsPage() {
  const firestore = useFirestore();
  const { isUserLoading } = useUser();
  
  const [viewingVendor, setViewingVendor] = useState<Vendor | null>(null);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'vendors'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: vendors, isLoading } = useCollection<Vendor>(vendorsQuery);
  
  const isDataLoading = isLoading || isUserLoading;

  const getUpdatedByLabel = (vendor: Vendor) => {
    if (!vendor.updatedBy) return '';
    let label = vendor.updatedBy.displayName;
    if (vendor.updatedBy.post) {
        label += ` (${vendor.updatedBy.post})`;
    }
    return label;
  }

  return (
    <>
      <Card className="animate-in">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Vendors</CardTitle>
            <CardDescription>
              Manage your suppliers and vendors.
            </CardDescription>
          </div>
          <AddVendorDialog />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isDataLoading && (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              )}
              {!isDataLoading && vendors?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No vendors found. Add one to get started.
                  </TableCell>
                </TableRow>
              )}
              {!isDataLoading && vendors?.map((vendor) => (
                <TableRow key={vendor.id} className="transition-colors hover:bg-muted/50">
                  <TableCell className="font-medium">{vendor.name}</TableCell>
                  <TableCell>
                    {vendor.type && (
                       <Badge variant={'outline'} className={cn(typeColorMap[vendor.type])}>
                         {vendor.type}
                       </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {vendor.updatedAt && (
                      <div className="text-xs text-muted-foreground">
                        <p>{formatDistanceToNow(new Date(vendor.updatedAt), { addSuffix: true })}</p>
                        <p className="flex items-center gap-1">
                          by {getUpdatedByLabel(vendor)}
                          {vendor.updatedBy?.device === 'Mobile' && <Smartphone className="h-3 w-3 text-green-400" />}
                          {vendor.updatedBy?.device === 'Desktop' && <Monitor className="h-3 w-3 text-blue-400" />}
                        </p>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => setViewingVendor(vendor)}>
                        <View className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setEditingVendor(vendor)}>
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

      {viewingVendor && (
        <VendorDetailsDialog
          vendor={viewingVendor}
          open={!!viewingVendor}
          onOpenChange={(isOpen) => !isOpen && setViewingVendor(null)}
        />
      )}

      {editingVendor && (
        <EditVendorDialog
          vendor={editingVendor}
          open={!!editingVendor}
          onOpenChange={(isOpen) => !isOpen && setEditingVendor(null)}
        />
      )}
    </>
  );
}
