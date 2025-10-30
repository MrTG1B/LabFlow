
'use client';

import { useState, useMemo } from 'react';
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
import { useFirestore } from '@/firebase/provider';
import type { Vendor, VendorType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AddVendorDialog } from './add-vendor-dialog';
import { EditVendorDialog } from './edit-vendor-dialog';
import { Button } from '@/components/ui/button';
import { Edit, View, Smartphone, Monitor, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { VendorDetailsDialog } from './vendor-details-dialog';
import { Input } from '@/components/ui/input';

const typeColorMap: Record<VendorType, string> = {
    'Online': 'bg-green-900/50 text-green-300 border-green-500/50',
    'Offline': 'bg-blue-900/50 text-blue-300 border-blue-500/50',
};


export default function VendorsPage() {
  const firestore = useFirestore();
  const { isUserLoading } = useUser();
  
  const [viewingVendor, setViewingVendor] = useState<Vendor | null>(null);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const firestoreReady = !!firestore;

  const vendorsQuery = useMemo(() => {
    if (!firestoreReady) return null;
    return query(collection(firestore, 'vendors'), orderBy('name', 'asc'));
  }, [firestoreReady]);

  const { data: vendors, isLoading } = useCollection<Vendor>(vendorsQuery);

  const filteredVendors = useMemo(() => {
    if (!vendors) return [];
    if (!searchQuery) return vendors;

    const lowercasedQuery = searchQuery.toLowerCase();
    return vendors.filter(vendor => 
        vendor.name?.toLowerCase().includes(lowercasedQuery) ||
        vendor.type?.toLowerCase().includes(lowercasedQuery) ||
        vendor.website?.toLowerCase().includes(lowercasedQuery) ||
        vendor.phone?.toLowerCase().includes(lowercasedQuery) ||
        vendor.address?.toLowerCase().includes(lowercasedQuery)
    );
  }, [vendors, searchQuery]);
  
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
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Vendors</CardTitle>
            <CardDescription>
              Manage your suppliers and vendors.
            </CardDescription>
          </div>
           <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search vendors..."
                className="pl-8 sm:w-[250px] md:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <AddVendorDialog />
          </div>
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
              {!isDataLoading && filteredVendors?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                     {searchQuery ? `No results found for "${searchQuery}"` : "No vendors found. Add one to get started."}
                  </TableCell>
                </TableRow>
              )}
              {!isDataLoading && filteredVendors?.map((vendor) => (
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
