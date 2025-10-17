
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
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import type { Vendor, VendorType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AddVendorDialog } from './add-vendor-dialog';
import { EditVendorDialog } from './edit-vendor-dialog';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const typeColorMap: Record<VendorType, string> = {
    'Online': 'bg-green-500/20 text-green-500 border-green-500/50',
    'Offline': 'bg-blue-500/20 text-blue-500 border-blue-500/50',
};


export default function VendorsPage() {
  const firestore = useFirestore();
  const { isUserLoading } = useUser();
  const { toast } = useToast();
  
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'vendors'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: vendors, isLoading } = useCollection<Vendor>(vendorsQuery);
  
  const isDataLoading = isLoading || isUserLoading;

  const handleDeleteVendor = (vendor: Vendor) => {
    if (!firestore) return;
    const vendorRef = doc(firestore, 'vendors', vendor.id);
    deleteDocumentNonBlocking(vendorRef);
    toast({
        title: "Vendor deleted",
        description: `"${vendor.name}" has been deleted.`,
    });
  };

  return (
    <>
      <Card>
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
                <TableRow key={vendor.id}>
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
                        <p>by {vendor.updatedBy?.displayName}</p>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => setEditingVendor(vendor)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                                <span className="sr-only">Delete</span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the vendor
                                    "{vendor.name}".
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteVendor(vendor)}>
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
