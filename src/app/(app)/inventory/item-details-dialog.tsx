
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import Barcode from 'react-barcode';
import type { InventoryItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { enhanceDescription } from '@/app/(app)/scan/actions';
import { Loader2, Sparkles } from 'lucide-react';

interface ItemDetailsDialogProps {
  item: InventoryItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ItemDetailsDialog({ item, open, onOpenChange }: ItemDetailsDialogProps) {
    const [enhancedDescription, setEnhancedDescription] = useState<string | null>(null);
    const [isEnhancing, setIsEnhancing] = useState(false);

    const enhanceItemDescription = useCallback(async (itemToEnhance: InventoryItem) => {
        if (!itemToEnhance.description || itemToEnhance.description.length < 20) {
            setIsEnhancing(true);
            setEnhancedDescription(null);
            try {
                const result = await enhanceDescription({
                    name: itemToEnhance.name,
                    type: itemToEnhance.type,
                    value: itemToEnhance.value || '',
                    partNumber: itemToEnhance.partNumber || '',
                });
                if (result.success && result.description) {
                    setEnhancedDescription(result.description);
                }
            } catch (error) {
                console.error("Failed to enhance description:", error);
            } finally {
                setIsEnhancing(false);
            }
        } else {
            setEnhancedDescription(null);
        }
    }, []);

    useEffect(() => {
        if (open && item) {
            enhanceItemDescription(item);
        }
    }, [item, open, enhanceItemDescription]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{item.name}</DialogTitle>
                    <DialogDescription>
                        Details for inventory item.
                    </DialogDescription>
                </DialogHeader>
                <div>
                    <Table>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-semibold">Type</TableCell>
                                <TableCell>{item.type}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-semibold">Quantity</TableCell>
                                <TableCell>{item.quantity} {item.unit}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-semibold">Value</TableCell>
                                <TableCell>{item.value || 'N/A'}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-semibold">Part Number</TableCell>
                                <TableCell>{item.partNumber || 'N/A'}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-semibold align-top">Description</TableCell>
                                <TableCell>{item.description || 'No description provided.'}</TableCell>
                            </TableRow>
                             {isEnhancing && (
                            <TableRow>
                                <TableCell colSpan={2} className='text-center'>
                                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Enhancing description...
                                </TableCell>
                            </TableRow>
                         )}
                         {enhancedDescription && (
                             <TableRow>
                                 <TableCell className="font-semibold align-top">
                                     <div className='flex items-center gap-1'>
                                        <Sparkles className="h-4 w-4 text-primary" />
                                        AI Description
                                     </div>
                                 </TableCell>
                                 <TableCell>{enhancedDescription}</TableCell>
                             </TableRow>
                         )}
                        </TableBody>
                    </Table>
                    <div className="mt-4 flex items-center justify-center bg-white p-2 rounded-md">
                        <Barcode value={item.barcode} height={60} />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
