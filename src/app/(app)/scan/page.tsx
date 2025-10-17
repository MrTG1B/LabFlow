
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
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
import { Camera, Loader2, Sparkles, Edit, ImagePlus, Upload, X } from 'lucide-react';
import { useFirestore, useStorage } from '@/firebase';
import { collection, query, where, getDocs, limit, doc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { InventoryItem } from '@/lib/types';
import Barcode from 'react-barcode';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { enhanceDescription } from './actions';
import { Input } from '@/components/ui/input';

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
  const [isScanning, setIsScanning] = useState(false);
  const [isFindingItem, setIsFindingItem] = useState(false);
  const [enhancedDescription, setEnhancedDescription] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingQuantity, setEditingQuantity] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCaptureMode, setIsCaptureMode] = useState(false);


  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const storage = useStorage();

  const enhanceItemDescription = useCallback(async (item: InventoryItem) => {
    if (!item.description || item.description.length < 20) {
      setIsEnhancing(true);
      setEnhancedDescription(null);
      try {
        const result = await enhanceDescription({
          name: item.name,
          type: item.type,
          value: item.value || '',
          partNumber: item.partNumber || '',
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

  const handleBarcodeScanned = useCallback(async (barcode: string) => {
    if (!firestore || isFindingItem) return;
    setIsFindingItem(true);
    setIsScanning(false); // Stop scanning while we search
    
    try {
      const inventoryRef = collection(firestore, 'inventory');
      const q = query(inventoryRef, where('barcode', '==', barcode), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const item = { id: doc.id, ...doc.data() } as InventoryItem;
        setScannedItem(item);
        setEditingQuantity(item.quantity);
        enhanceItemDescription(item);
      } else {
        toast({
          variant: 'destructive',
          title: 'Not Found',
          description: `No inventory item found with barcode: ${barcode}`,
        });
        // Resume scanning if not found
        setIsScanning(true);
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
    } finally {
      setIsFindingItem(false);
    }
  }, [firestore, toast, isFindingItem, enhanceItemDescription]);
  
  const handleCloseDialog = () => {
    setScannedItem(null);
    setEnhancedDescription(null);
    setIsEnhancing(false);
    setIsEditing(false);
    setCapturedImage(null);
    setIsScanning(true); // Re-enable scanning
  };

  const handleSave = async () => {
    if (!firestore || !scannedItem) return;
    setIsSaving(true);
    
    try {
        const itemRef = doc(firestore, 'inventory', scannedItem.id);
        const updates: Partial<InventoryItem> = {
            quantity: editingQuantity,
        };

        if (capturedImage && storage) {
            setIsUploading(true);
            const storageRef = ref(storage, `inventory_images/${scannedItem.id}_${Date.now()}.jpg`);
            const uploadResult = await uploadString(storageRef, capturedImage, 'data_url');
            const downloadURL = await getDownloadURL(uploadResult.ref);
            updates.imageUrl = downloadURL;
            setIsUploading(false);
        }
        
        await setDocumentNonBlocking(itemRef, updates, { merge: true });

        toast({
            title: 'Success!',
            description: `"${scannedItem.name}" has been updated.`,
        });

        // Optimistically update local state
        setScannedItem(prev => prev ? {...prev, ...updates} : null);
        handleCloseDialog();

    } catch (error) {
        console.error("Error saving item:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not save the item. Please try again.",
        });
    } finally {
        setIsSaving(false);
        setIsUploading(false);
    }
  };

  const handleCaptureImage = () => {
    if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            setCapturedImage(dataUrl);
            setIsCaptureMode(false);
        }
    }
  };

  // Effect for camera permission and setup
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
            setIsScanning(true); // Start scanning after permission is granted
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
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [toast]);

  // Effect for barcode detection interval, controlled by isScanning state
  useEffect(() => {
    let scanInterval: NodeJS.Timeout | null = null;
    
    if (isScanning && hasCameraPermission && window.BarcodeDetector) {
      const barcodeDetector = new window.BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'qr_code', 'code_128', 'code_39', 'upc_a', 'upc_e'],
      });

      scanInterval = setInterval(async () => {
        if (videoRef.current && videoRef.current.readyState === 4 && !isCaptureMode) {
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);

            if (barcodes.length > 0) {
              handleBarcodeScanned(barcodes[0].rawValue);
            }
          } catch (error) {
            console.error('Barcode detection error:', error);
            setIsScanning(false); // Stop on error
          }
        }
      }, 500); // Scan every 500ms
    }

    return () => {
      if (scanInterval) {
        clearInterval(scanInterval);
      }
    };
  }, [isScanning, hasCameraPermission, handleBarcodeScanned, isCaptureMode]);


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
            <canvas ref={canvasRef} className="hidden"></canvas>

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
      
      <Dialog open={!!scannedItem && !isEditing} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{scannedItem?.name}</DialogTitle>
            <DialogDescription>
              Details for the scanned inventory item.
            </DialogDescription>
          </DialogHeader>
          {scannedItem && (
             <div>
                {scannedItem.imageUrl && (
                    <div className='relative w-full aspect-video rounded-md overflow-hidden mb-4 border'>
                        <Image src={scannedItem.imageUrl} alt={scannedItem.name} layout="fill" objectFit="cover" />
                    </div>
                )}
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
                        <TableRow>
                            <TableCell className="font-semibold align-top">Description</TableCell>
                            <TableCell>
                                {scannedItem.description || 'No description provided.'}
                            </TableCell>
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
                    <Barcode value={scannedItem.barcode} height={60} />
                </div>
             </div>
          )}
          <DialogFooter className='sm:justify-between'>
            <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
            </Button>
            <Button onClick={handleCloseDialog}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditing} onOpenChange={(open) => !open && setIsEditing(false)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit {scannedItem?.name}</DialogTitle>
                <DialogDescription>Update the item's details below.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
                <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-muted-foreground mb-1">Quantity</label>
                    <Input id="quantity" type="number" value={editingQuantity} onChange={e => setEditingQuantity(parseInt(e.target.value, 10))} />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Component Image</label>
                    <div className="relative p-2 border rounded-md min-h-[100px] flex items-center justify-center">
                        {capturedImage ? (
                             <div className="relative w-full">
                                <Image src={capturedImage} alt="Captured component" width={200} height={150} className="rounded-md mx-auto" />
                                <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => setCapturedImage(null)}>
                                    <X className="h-4 w-4" />
                                </Button>
                             </div>
                        ) : (
                            <Button variant="outline" onClick={() => setIsCaptureMode(true)} disabled={isSaving}>
                                <ImagePlus className="mr-2 h-4 w-4" />
                                Add Image
                            </Button>
                        )}
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Changes'}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

       <Dialog open={isCaptureMode} onOpenChange={setIsCaptureMode}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Capture Component Image</DialogTitle>
                </DialogHeader>
                <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
                    <video ref={videoRef} className="h-full w-full object-cover" autoPlay playsInline muted />
                </div>
                <DialogFooter>
                    <Button onClick={handleCaptureImage}>
                        <Camera className="mr-2 h-4 w-4" />
                        Capture
                    </Button>
                </DialogFooter>
            </DialogContent>
       </Dialog>
    </>
  );
}
