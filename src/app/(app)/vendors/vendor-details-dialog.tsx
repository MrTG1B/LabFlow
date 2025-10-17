
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { Vendor } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Globe, Phone, MapPin } from 'lucide-react';

interface VendorDetailsDialogProps {
  vendor: Vendor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VendorDetailsDialog({ vendor, open, onOpenChange }: VendorDetailsDialogProps) {
    const renderDetailRow = (label: string, value: string | number | undefined | null, icon?: React.ReactNode) => (
        <div className="flex justify-between items-start border-b py-3 text-sm">
            <dt className="text-muted-foreground flex items-center gap-2">
                {icon}
                <span>{label}</span>
            </dt>
            <dd className="text-right font-medium break-words max-w-xs">
                {value ? (
                    label === 'Website' && typeof value === 'string' ? (
                        <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {value}
                        </a>
                    ) : (
                        value
                    )
                ) : 'N/A'}
            </dd>
        </div>
    );
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>{vendor.name}</DialogTitle>
                    <DialogDescription>
                        Details for vendor.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh]">
                    <div className='px-6'>
                        <dl>
                            {renderDetailRow("Type", vendor.type)}
                            {renderDetailRow("Website", vendor.website, <Globe className="h-4 w-4" />)}
                            {renderDetailRow("Phone", vendor.phone, <Phone className="h-4 w-4" />)}
                            {renderDetailRow("Address", vendor.address, <MapPin className="h-4 w-4" />)}
                        </dl>
                    </div>
                </ScrollArea>
                <DialogFooter className="p-6 pt-4 border-t">
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
