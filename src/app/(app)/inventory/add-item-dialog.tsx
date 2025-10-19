
'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Barcode from 'react-barcode';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { PlusCircle, Loader2, Printer } from 'lucide-react';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, orderBy, where, getDocs, doc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { InventoryItem, Vendor } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { Textarea } from '@/components/ui/textarea';
import { useIsMobile } from '@/hooks/use-mobile';
import { generateColorFromString } from '@/lib/color-utils';
import { Combobox } from '@/components/ui/combobox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

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

export function AddItemDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<{name: string, barcode: string} | null>(null);

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const printComponentRef = useRef(null);
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
      name: '',
      value: '',
      quantity: 0,
      unit: 'pcs',
      partNumber: '',
      description: '',
      barcode: '',
      vendorId: 'None',
      rate: undefined,
    },
  });

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
  
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && printComponentRef.current) {
        printWindow.document.write('<html><head><title>Print</title>');
        printWindow.document.write('<style>@media print { body { -webkit-print-color-adjust: exact; } @page { size: 3in 1.5in; margin: 0.1in; } .label { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; } .item-name { font-family: sans-serif; font-weight: bold; margin-bottom: 5px; font-size: 12px; text-align: center; } svg { height: 50px; } }</style>');
        printWindow.document.write('</head><body>');
        const printContent = (printComponentRef.current as HTMLDivElement).innerHTML;
        printWindow.document.write(printContent);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
    }
  };

  async function onSubmit(values: FormValues) {
    if (!firestore || !user) return;
    setIsSubmitting(true);

    try {
      await handleCreateNewType(values.type);

      const inventoryCol = collection(firestore, 'inventory');
      const barcode = values.barcode || uuidv4();
      const now = new Date().toISOString();
      
      const newItem: Omit<InventoryItem, 'id'> = {
        ...values,
        vendorId: values.vendorId === 'None' ? undefined : values.vendorId,
        barcode: barcode,
        createdAt: now,
        updatedAt: now,
        updatedBy: { 
            uid: user.uid, 
            displayName: user.displayName,
            post: user.post,
            device: isMobile ? 'Mobile' : 'Desktop',
        },
      };
      
      if (values.rate === undefined || isNaN(values.rate)) {
        delete (newItem as Partial<InventoryItem>).rate;
      }
      if (values.vendorId === 'None') {
        delete (newItem as Partial<InventoryItem>).vendorId;
      }

      await addDocumentNonBlocking(inventoryCol, newItem);

      toast({
        title: 'Success!',
        description: `"${values.name}" has been added to the inventory.`,
      });

      setLastAddedItem({name: values.name, barcode: barcode});
      setShowPrintDialog(true);
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error('Error adding document: ', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not add the item. Please try again.',
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
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Add Item
            </span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-3xl p-0 flex flex-col max-h-[90dvh] overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Add New Inventory Item</DialogTitle>
            <DialogDescription>
              Fill out the form below to add a new component to the inventory.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <ScrollArea className="flex-1 overflow-y-auto">
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
                                    placeholder="Select or create..."
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
                                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
                                <FormLabel>Barcode (Optional)</FormLabel>
                                <FormControl>
                                <Input placeholder="Leave blank to auto-generate" {...field} />
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
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    'Add Item'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Print Barcode</DialogTitle>
            <DialogDescription>
              A new item has been added. You can now print a barcode label.
            </DialogDescription>
          </DialogHeader>
          {lastAddedItem && (
            <div ref={printComponentRef} className="py-4 flex items-center justify-center">
                <div className="label">
                    <div className="item-name">{lastAddedItem.name}</div>
                    <Barcode value={lastAddedItem.barcode} />
                </div>
            </div>
          )}
          <DialogFooter className="sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setShowPrintDialog(false)}>
              Close
            </Button>
            <Button type="button" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

    