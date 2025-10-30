
'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Trash2 } from 'lucide-react';
import { generateColorFromString } from '@/lib/color-utils';
import type { InventoryItemType } from '@/lib/types';


const formSchema = z.object({
  name: z.string().min(2, 'Type name must be at least 2 characters.'),
});

export default function InventoryTypesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const firestoreReady = !!firestore;

  const itemTypesQuery = useMemo(() => {
    if (!firestoreReady) return null;
    return query(collection(firestore, 'inventoryItemTypes'), orderBy('name'));
  }, [firestoreReady]);

  const { data: itemTypes, isLoading } = useCollection<InventoryItemType>(itemTypesQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '' },
  });

  const handleDelete = async (type: InventoryItemType) => {
    if (!firestore) return;
    try {
        const typeRef = doc(firestore, 'inventoryItemTypes', type.id);
        await deleteDocumentNonBlocking(typeRef);
        toast({
            title: 'Type Deleted',
            description: `The type "${type.name}" has been deleted.`,
        });
    } catch (error) {
        console.error('Error deleting type:', error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not delete the type.',
        });
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore) return;
    setIsSubmitting(true);
    try {
      const newType = {
        name: values.name,
        color: generateColorFromString(values.name),
      };
      await addDocumentNonBlocking(collection(firestore, 'inventoryItemTypes'), newType);
      toast({
        title: 'Success',
        description: `Type "${values.name}" has been created.`,
      });
      form.reset();
    } catch (error) {
      console.error('Error creating type:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not create the new type.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Inventory Types</h2>
          <p className="text-muted-foreground">
              Manage the categories for your inventory items.
          </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Existing Types</CardTitle>
                    <CardDescription>The list of all current inventory types.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Color Preview</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && Array.from({length: 5}).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-10 ml-auto" /></TableCell>
                                </TableRow>
                            ))}
                            {itemTypes?.map(type => (
                                <TableRow key={type.id}>
                                    <TableCell className="font-medium">{type.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div 
                                                className="h-4 w-4 rounded-full border"
                                                style={{ backgroundColor: `hsl(${type.color})` }}
                                            />
                                            <span className="text-sm text-muted-foreground">{type.color}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete the type
                                                        "{type.name}". Existing items with this type will not be affected but may need to be updated.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(type)} className="bg-destructive hover:bg-destructive/90">
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>Create New Type</CardTitle>
                    <CardDescription>Add a new category for your inventory items.</CardDescription>
                </CardHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Type Name</FormLabel>
                                    <FormControl>
                                    <Input placeholder="e.g. Diodes" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Type
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
      </div>
    </div>
  );
}
