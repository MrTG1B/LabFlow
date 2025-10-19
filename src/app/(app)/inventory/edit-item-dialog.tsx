
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { doc, collection, query, orderBy, where, getDocs } from 'firebase/firestore';
import { setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { InventoryItem, Vendor } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { useIsMobile } from '@/hooks/use-mobile';
import { Combobox } from '@/components/ui/combobox';
import { generateColorFromString } from '@/lib/color-utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  type: z.string({ required_error: 'Please select an item type.' }),
  value: z.string().min(1, { message: 'Value is required.' }),
  quantity: z.coerce.number().optional(),
  unit: z.string().optional(),
  partNumber: z.string().optional(),
  description: z.string().optional(),
  barcode: z.string().optional(),
  vendorId: z.string().optional(),
  rate: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditItemDialogProps {
  item: InventoryItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditItemDialog({ item, open, onOpenChange }: EditItemDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const firestoreReady = !!firestore;

  const vendorsQuery = useMemo(() => {
    if (!firestoreReady) return null;
    return query(collection(firestore, 'vendors'), orderBy('name', 'asc'));
  }, [firestoreReady]);
  const { data: vendors } = useCollection<Vendor>(vendorsQuery);

  const itemTypesQuery = useMemo(() => {
    if (!firestoreReady) return null;
    return query(collection(firestore, 'inventoryItemTypes'), orderBy('name'));
  }, [firestoreReady]);
  const { data: itemTypes, isLoading: isLoadingTypes } = useCollection(itemTypesQuery);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...item,
      vendorId: item.vendorId || 'None',
    },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        ...item,
        vendorId: item.vendorId || 'None',
      });
    }
  }, [item, form]);

  const handleCreateNewType = useCallback(async (typeName: string) => {
    if (!firestore) return;
    const normalizedTypeName = typeName.trim();
    if (normalizedTypeName === '') return;

    const typesRef = collection(firestore, 'inventoryItemTypes');
    const q = query(typesRef, where('name', '==', normalizedTypeName));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      const newType = {
        name: normalizedTypeName,
        color: generateColorFromString(normalizedTypeName),
      };
      await addDocumentNonBlocking(collection(firestore, 'inventoryItemTypes'), newType);
      toast({
        title: 'New Type Created',
        description: `"${normalizedTypeName}" has been added to inventory types.`,
      });
    }
  }, [firestore, toast]);


  async function onSubmit(values: FormValues) {
    if (!firestore || !user) return;
    setIsSubmitting(true);
    
    try {
        await handleCreateNewType(values.type);

        const itemRef = doc(firestore, 'inventory', item.id);
        
        const updatedItemData: Partial<InventoryItem> = {
            ...values,
            updatedAt: new Date().toISOString(),
            updatedBy: { 
                uid: user.uid, 
                displayName: user.displayName,
                post: user.post,
                device: isMobile ? 'Mobile' : 'Desktop',
            },
        };

        if (values.vendorId === 'None') {
            updatedItemData.vendorId = undefined;
        }

        if (values.rate === undefined || isNaN(values.rate)) {
             delete (updatedItemData as any).rate;
        }

        setDocumentNonBlocking(itemRef, updatedItemData, { merge: true });

        toast({
            title: 'Success!',
            description: `"${values.name}" has been updated.`,
        });

        form.reset();
        onOpenChange(false);
    } catch (error) {
        console.error('Error updating document: ', error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not update the item. Please try again.',
        });
    } finally {
        setIsSubmitting(false);
    }
}

  const typeOptions = itemTypes?.map(type => ({ value: type.name, label: type.name })) || [];
  const vendorOptions = useMemo(() => {
    if (!vendors) return [];
    return [
        { value: 'None', label: 'None' },
        ...vendors.map((vendor) => ({ value: vendor.id, label: vendor.name })),
    ];
  }, [vendors]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl p-0 flex flex-col max-h-[90dvh] overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Edit Inventory Item</DialogTitle>
            <DialogDescription>
              Make changes to the item details below.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <ScrollArea className="flex-1 overflow-y-auto px-6 pb-6">
                    <div className="space-y-6 p-6">
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-muted-foreground">Core Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                        <FormLabel>Item Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. 10k Ohm 0805 Resistor" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                        <FormLabel>Type</FormLabel>
                                        <Combobox
                                            options={typeOptions}
                                            value={field.value}
                                            onChange={field.onChange}
                                            onCreate={handleCreateNewType}
                                            placeholder="Select or create type..."
                                            notFoundMessage="No types found."
                                            createMessage="Create new type:"
                                            isLoading={isLoadingTypes}
                                        />
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="value"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Value / Specification</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. 10k, 1uF, ATMEGA328P" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-muted-foreground">Stock & Sourcing</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="quantity"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Quantity</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="0" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="unit"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Unit</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. pcs, reels, m" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="vendorId"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                        <FormLabel>Vendor (Optional)</FormLabel>
                                         <Combobox
                                            options={vendorOptions}
                                            value={field.value || 'None'}
                                            onChange={field.onChange}
                                            placeholder="Select a vendor..."
                                            notFoundMessage="No vendors found."
                                        />
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="rate"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Rate (per unit, Optional)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="0.00" value={field.value ?? ''} onChange={field.onChange} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-muted-foreground">Identifiers & Notes</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="partNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Part Number (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. C0805C104K5RACTU" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="barcode"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Barcode</FormLabel>
                                        <FormControl>
                                        <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Description (Optional)</FormLabel>
                                        <FormControl>
                                        <Textarea placeholder="Add any relevant notes, pinouts, or details..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </ScrollArea>
              <DialogFooter className="border-t p-6 mt-auto">
                 <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
    </Dialog>
  );
}

    