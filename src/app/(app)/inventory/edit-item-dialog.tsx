
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { doc, collection, query, orderBy, where, getDocs } from 'firebase/firestore';
import { setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { InventoryItem, Vendor } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { useIsMobile } from '@/hooks/use-mobile';
import { Combobox } from '@/components/ui/combobox';
import { generateColorFromString } from '@/lib/color-utils';


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

    // Check if type already exists
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
            delete updatedItemData.vendorId;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
            <DialogDescription>
              Update the details of the item.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Ceramic Capacitor" {...field} />
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
                      <FormLabel>Value</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 10k, 1uF" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                        <Input placeholder="e.g. pcs, reels" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                    name="vendorId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Vendor (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || 'None'}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a vendor" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="None">None</SelectItem>
                                {vendors?.map((vendor) => (
                                    <SelectItem key={vendor.id} value={vendor.id}>
                                        {vendor.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                            <Input type="number" placeholder="0.00" value={field.value ?? ''} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode (Optional)</FormLabel>
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
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Item description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                 <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
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
