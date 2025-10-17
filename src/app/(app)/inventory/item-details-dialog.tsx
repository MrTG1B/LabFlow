
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
import Barcode from 'react-barcode';
import type { InventoryItem, Vendor } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { enhanceDescription } from '@/app/(app)/scan/actions';
import { Loader2, Sparkles } from 'lucide-react';
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/provider';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ItemDetailsDialogProps {
  item: InventoryItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ItemDetailsDialog({ item, open, onOpenChange }: ItemDetailsDialogProps) {
    const [enhancedDescription, setEnhancedDescription] = useState<string | null>(null);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const firestore = useFirestore();

    const vendorRef = useMemoFirebase(() => {
        if (!firestore || !item.vendorId) return null;
        return doc(firestore, 'vendors', item.vendorId);
    }, [firestore, item.vendorId]);
    const { data: vendor } = useDoc<Vendor>(vendorRef);


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

    const renderDetailRow = (label: string, value: string | number | undefined | null) => (
        <div className="flex justify-between border-b py-3 text-sm">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right font-medium">{value || 'N/A'}</dd>
        </div>
    );
    
    const renderDescriptionRow = (label: string, value: string | undefined | null, isAI?: boolean) => (
        <div className="flex flex-col gap-1 border-b py-3 text-sm">
            <dt className="text-muted-foreground flex items-center gap-1.5">
                {isAI && <Sparkles className="h-4 w-4 text-primary" />}
                {label}
            </dt>
            <dd className="font-medium whitespace-pre-wrap">{value || 'No description provided.'}</dd>
        </div>
    );


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>{item.name}</DialogTitle>
                    <DialogDescription>
                        Details for inventory item.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh]">
                    <div className='px-6'>
                        {item.imageUrl && (
                            <div className='relative w-full aspect-[16/10] rounded-md overflow-hidden mb-4 border'>
                                <Image src={item.imageUrl} alt={item.name} fill={true} objectFit="cover" />
                            </div>
                        )}
                        <dl>
                            {renderDetailRow("Type", item.type)}
                            {renderDetailRow("Quantity", item.quantity ? `${item.quantity} ${item.unit || ''}`.trim() : 'N/A')}
                            {renderDetailRow("Value", item.value)}
                            {renderDetailRow("Part Number", item.partNumber)}
                            {renderDetailRow("Vendor", vendor?.name)}
                            {renderDetailRow("Rate", item.rate ? `₹${item.rate.toFixed(2)}` : undefined)}
                            {renderDescriptionRow("Description", item.description)}
                            {isEnhancing && (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Enhancing description...
                                </div>
                            )}
                            {enhancedDescription && renderDescriptionRow("AI Description", enhancedDescription, true)}
                        </dl>
                        {item.barcode && (
                            <div className="mt-4 flex items-center justify-center bg-white p-2 rounded-md">
                                <Barcode value={item.barcode} height={60} />
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <DialogFooter className="p-6 pt-4 border-t">
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
