
'use client';

import { useState } from 'react';
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
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, PlusCircle } from 'lucide-react';
import { generateColorFromString } from '@/lib/color-utils';
import type { InventoryItemType } from '@/lib/types';


const formSchema = z.object({
  name: z.string().min(2, 'Type name must be at least 2 characters.'),
});

export default function InventoryTypesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const itemTypesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'inventoryItemTypes'), orderBy('name'));
  }, [firestore]);

  const { data: itemTypes, isLoading } = useCollection<InventoryItemType>(itemTypesQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '' },
  });

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
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && Array.from({length: 5}).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
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
