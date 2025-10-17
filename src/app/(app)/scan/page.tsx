
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import type { InventoryItem } from '@/lib/types';
import Barcode from 'react-barcode';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

// Polyfill for BarcodeDetector
interface BarcodeDetectorOptions {
  formats: string[];
}
interface DetectedBarcode {
  rawValue: string;
}
declare global {
  interface Window {
    BarcodeDetector: {
      new (options?: BarcodeDetectorOptions): {
        detect(image: ImageBitmapSource): Promise<DetectedBarcode[]>;
        getSupportedFormats(): Promise<string[]>;
      };
    };
  }
}

export default function ScanPage() {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [isFindingItem, setIsFindingItem] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  const startScanning = () => {
    if (scanIntervalRef.current) return; // Already scanning

    scanIntervalRef.current = setInterval(async () => {
      if (videoRef.current && videoRef.current.readyState === 4 && window.BarcodeDetector) {
        try {
          const barcodeDetector = new window.BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'qr_code', 'code_128', 'code_39', 'upc_a', 'upc_e'],
          });
          const barcodes = await barcodeDetector.detect(videoRef.current);

          if (barcodes.length > 0 && isScanning) {
            const scannedValue = barcodes[0].rawValue;
            setIsScanning(false);
            stopScanning();
            handleBarcodeScanned(scannedValue);
          }
        } catch (error) {
          // Barcode detector may not be supported
          console.error('Barcode detection error:', error);
          stopScanning();
        }
      }
    }, 500); // Scan every 500ms
  };

  const handleBarcodeScanned = async (barcode: string) => {
    if (!firestore) return;
    setIsFindingItem(true);
    
    try {
      const inventoryRef = collection(firestore, 'inventory');
      const q = query(inventoryRef, where('barcode', '==', barcode), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        setScannedItem({ id: doc.id, ...doc.data() } as InventoryItem);
      } else {
        toast({
          variant: 'destructive',
          title: 'Not Found',
          description: `No inventory item found with barcode: ${barcode}`,
        });
        // Resume scanning if not found
        setIsScanning(true);
        startScanning();
      }
    } catch (error) {
      console.error('Error fetching item:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not fetch item details.',
      });
      // Resume scanning on error
      setIsScanning(true);
      startScanning();
    } finally {
      setIsFindingItem(false);
    }
  };
  
  const handleCloseDialog = () => {
    setScannedItem(null);
    setIsScanning(true);
    startScanning();
  };

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Unsupported Browser',
          description: 'Your browser does not support camera access.',
        });
        return;
      }
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        if (window.BarcodeDetector) {
            startScanning();
        } else {
            toast({
                variant: 'destructive',
                title: 'Unsupported Browser',
                description: 'Barcode detection is not supported in your browser.',
            });
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    };

    getCameraPermission();

    return () => {
      stopScanning();
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-6 w-6" />
            Scan Inventory Item
          </CardTitle>
          <CardDescription>
            Point your camera at a barcode to get item details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
            <video ref={videoRef} className="h-full w-full object-cover" autoPlay playsInline muted />
            {isFindingItem && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-2 text-sm text-muted-foreground">Looking up item...</p>
              </div>
            )}
            {hasCameraPermission === false && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <Alert variant="destructive" className="w-auto">
                  <AlertTitle>Camera Access Required</AlertTitle>
                  <AlertDescription>
                    Please allow camera access to scan barcodes.
                  </AlertDescription>
                </Alert>
              </div>
            )}
            {hasCameraPermission === null && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <p>Requesting camera permission...</p>
              </div>
            )}
            {isScanning && hasCameraPermission && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-3/4 h-1/2 border-4 border-dashed border-primary/50 rounded-lg" />
                </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={!!scannedItem} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{scannedItem?.name}</DialogTitle>
            <DialogDescription>
              Details for the scanned inventory item.
            </DialogDescription>
          </DialogHeader>
          {scannedItem && (
             <div>
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell className="font-semibold">Type</TableCell>
                            <TableCell>{scannedItem.type}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="font-semibold">Quantity</TableCell>
                            <TableCell>{scannedItem.quantity} {scannedItem.unit}</TableCell>
                        </TableRow>
                         <TableRow>
                            <TableCell className="font-semibold">Value</TableCell>
                            <TableCell>{scannedItem.value || 'N/A'}</TableCell>
                        </TableRow>
                         <TableRow>
                            <TableCell className="font-semibold">Part Number</TableCell>
                            <TableCell>{scannedItem.partNumber || 'N/A'}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
                <div className="mt-4 flex items-center justify-center bg-white p-2 rounded-md">
                    <Barcode value={scannedItem.barcode} height={60} />
                </div>
             </div>
          )}
          <DialogFooter>
            <Button onClick={handleCloseDialog}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

    