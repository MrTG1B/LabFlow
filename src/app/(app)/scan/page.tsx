
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
import { Camera, Loader2, Sparkles, Edit, ImagePlus, X } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, limit, doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { InventoryItem, Vendor } from '@/lib/types';
import Barcode from 'react-barcode';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { enhanceDescription } from './actions';
import { Input } from '@/components/ui/input';
import { uploadImage } from './upload-image-action';
import { ScrollArea } from '@/components/ui/scroll-area';


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

  const vendorRef = useMemoFirebase(() => {
    if (!firestore || !scannedItem?.vendorId) return null;
    return doc(firestore, 'vendors', scannedItem.vendorId);
  }, [firestore, scannedItem?.vendorId]);
  const { data: vendor } = useDoc<Vendor>(vendorRef);


  const stopCameraStream = useCallback(() => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    }, []);
  
  const startCameraStream = useCallback(async (captureMode: boolean) => {
    stopCameraStream(); // Ensure any existing stream is stopped
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
        }
        if(!captureMode){
            setIsScanning(true);
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
  }, [toast, stopCameraStream]);

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
    startCameraStream(false);
  };

  const handleSave = async () => {
    if (!firestore || !scannedItem) return;
    setIsSaving(true);
    
    try {
        const itemRef = doc(firestore, 'inventory', scannedItem.id);
        const updates: Partial<InventoryItem> = {
            quantity: editingQuantity,
        };

        if (capturedImage) {
            setIsUploading(true);
            const base64Image = capturedImage.split(',')[1];
            const uploadResult = await uploadImage(base64Image);
            
            if (uploadResult.success && uploadResult.url) {
                updates.imageUrl = uploadResult.url;
            } else {
                throw new Error(uploadResult.error || 'Image upload failed');
            }
            setIsUploading(false);
        }
        
        await setDocumentNonBlocking(itemRef, updates, { merge: true });

        toast({
            title: 'Success!',
            description: `"${scannedItem.name}" has been updated.`,
        });

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
      
      if (!window.BarcodeDetector) {
          toast({
              variant: 'destructive',
              title: 'Unsupported Browser',
              description: 'Barcode detection is not supported in your browser.',
          });
      }
    };

    getCameraPermission();

    return () => {
      stopCameraStream();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  // Effect to switch camera stream when capture mode changes
  useEffect(() => {
      startCameraStream(isCaptureMode);
  }, [isCaptureMode, startCameraStream]);

  // Effect for barcode detection interval, controlled by isScanning state
  useEffect(() => {
    let scanInterval: NodeJS.Timeout | null = null;
    
    if (isScanning && hasCameraPermission && window.BarcodeDetector) {
      const barcodeDetector = new window.BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'qr_code', 'code_128', 'code_39', 'upc_a', 'upc_e'],
      });

      scanInterval = setInterval(async () => {
        if (videoRef.current && videoRef.current.readyState === 4) {
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
  }, [isScanning, hasCameraPermission, handleBarcodeScanned]);

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
            <dd className="font-medium">{value || 'No description provided.'}</dd>
        </div>
    );


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
        <DialogContent className="p-0 max-h-[90dvh] flex flex-col">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>{scannedItem?.name}</DialogTitle>
            <DialogDescription>
              Details for the scanned inventory item.
            </DialogDescription>
          </DialogHeader>
          {scannedItem && (
            <ScrollArea className="flex-1">
                <div className='px-6'>
                    {scannedItem.imageUrl && (
                        <div className='relative w-full aspect-[16/10] rounded-md overflow-hidden mb-4 border'>
                            <Image src={scannedItem.imageUrl} alt={scannedItem.name} layout="fill" objectFit="cover" />
                        </div>
                    )}
                    <dl>
                        {renderDetailRow("Type", scannedItem.type)}
                        {renderDetailRow("Quantity", `${scannedItem.quantity} ${scannedItem.unit}`)}
                        {renderDetailRow("Value", scannedItem.value)}
                        {renderDetailRow("Part Number", scannedItem.partNumber)}
                        {renderDetailRow("Vendor", vendor?.name)}
                        {renderDetailRow("Rate", scannedItem.rate ? `₹${scannedItem.rate.toFixed(2)}` : undefined)}
                        {renderDescriptionRow("Description", scannedItem.description)}
                        {isEnhancing && (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Enhancing...
                            </div>
                        )}
                        {enhancedDescription && renderDescriptionRow("AI Description", enhancedDescription, true)}
                    </dl>
                    <div className="mt-4 flex items-center justify-center bg-white p-2 rounded-md">
                        <Barcode value={scannedItem.barcode} height={60} />
                    </div>
                </div>
            </ScrollArea>
          )}
          <DialogFooter className='p-6 pt-4 mt-auto grid grid-cols-2 gap-4'>
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
            <div className="space-y-4 py-4">
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
                            <Button variant="outline" onClick={() => { setIsCaptureMode(true);}} disabled={isSaving}>
                                <ImagePlus className="mr-2 h-4 w-4" />
                                Add Image
                            </Button>
                        )}
                    </div>
                </div>
            </div>
            <DialogFooter className='grid grid-cols-2 gap-4'>
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</Button>
                <Button onClick={handleSave} disabled={isSaving || isUploading}>
                    {isSaving || isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Changes'}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

       <Dialog open={isCaptureMode} onOpenChange={(open) => { if (!open) { setIsCaptureMode(false); } }}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Capture Component Image</DialogTitle>
                </DialogHeader>
                <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
                    <video ref={videoRef} className="h-full w-full object-cover" autoPlay playsInline muted />
                </div>
                <DialogFooter className='sm:justify-end gap-2'>
                     <Button variant="outline" onClick={() => setIsCaptureMode(false)}>
                        Cancel
                    </Button>
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
