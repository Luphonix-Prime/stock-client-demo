import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera, Package, Scan } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface QRScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductScanned?: (product: Product) => void;
}

export function QRScannerDialog({ open, onOpenChange, onProductScanned }: QRScannerDialogProps) {
  const [scannedSKU, setScannedSKU] = useState<string>("");
  const [manualSKU, setManualSKU] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [barcodeBuffer, setBarcodeBuffer] = useState("");
  const [lastKeyTime, setLastKeyTime] = useState(0);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(false);
  const { toast } = useToast();

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const scannedProduct = products.find((p) => p.sku === scannedSKU);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Handle physical barcode scanner input
  useEffect(() => {
    if (!open) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;

      // If more than 100ms between keypresses, start new barcode
      if (timeDiff > 100) {
        setBarcodeBuffer("");
      }

      setLastKeyTime(currentTime);

      // Enter key indicates end of barcode scan
      if (e.key === "Enter" && barcodeBuffer.length > 0) {
        e.preventDefault();
        setScannedSKU(barcodeBuffer);
        setBarcodeBuffer("");
        return;
      }

      // Build up the barcode from rapid keystrokes
      if (e.key.length === 1 && timeDiff < 100) {
        setBarcodeBuffer((prev) => prev + e.key);
      }
    };

    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, [open, barcodeBuffer, lastKeyTime]);

  // Auto-select product if callback provided
  useEffect(() => {
    if (scannedProduct && onProductScanned) {
      onProductScanned(scannedProduct);
      // Close the dialog after successful scan to prevent duplicates
      handleClose();
    }
  }, [scannedProduct, onProductScanned]);

  const startScanning = async () => {
    if (isScanning || scannerRef.current) {
      return;
    }

    const element = document.getElementById("qr-reader");
    if (!element) {
      console.error("QR reader element not found");
      return;
    }

    try {
      setIsScanning(true);
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      // Get available cameras first
      const devices = await Html5Qrcode.getCameras();

      if (!devices || devices.length === 0) {
        console.error("No cameras found");
        toast({
          title: "Camera Error",
          description: "No cameras found on this device.",
          variant: "destructive",
        });
        setIsScanning(false);
        return;
      }

      // Use the first available camera (usually back camera on mobile)
      const cameraId = devices[0].id;

      await scanner.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          if (mountedRef.current) {
            setScannedSKU(decodedText);
            stopScanning();
          }
        },
        (errorMessage) => {
          // Suppress scanning errors
        }
      );
    } catch (err: any) {
      console.error("Failed to start scanner:", err);
      if (mountedRef.current) {
        toast({
          title: "Camera Error",
          description: "Failed to access camera. Please ensure camera permissions are granted.",
          variant: "destructive",
        });
        setIsScanning(false);
        scannerRef.current = null;
      }
    }
  };

  const stopScanning = async () => {
    if (!scannerRef.current) {
      return;
    }

    try {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      setIsScanning(false);

      if (scanner.isScanning) {
        await scanner.stop();
      }
      scanner.clear();
    } catch (err: any) {
      // Ignore errors during cleanup
      scannerRef.current = null;
      setIsScanning(false);
    }
  };

  const handleManualSearch = () => {
    if (manualSKU.trim()) {
      setScannedSKU(manualSKU.trim());
    }
  };

  const handleClose = () => {
    stopScanning();
    onOpenChange(false);
    setScannedSKU("");
    setManualSKU("");
    setBarcodeBuffer("");
  };

  useEffect(() => {
    if (!open) {
      handleClose();
    }
  }, [open]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {});
          scannerRef.current.clear();
        } catch (err) {
          // Ignore cleanup errors
        }
        scannerRef.current = null;
      }
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl" data-testid="dialog-qr-scanner">
        <DialogHeader>
          <DialogTitle>Scan Product Code</DialogTitle>
          <DialogDescription>
            Use your device camera or a physical barcode scanner
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Alert>
            <Scan className="h-4 w-4" />
            <AlertDescription>
              Physical barcode scanner detected: Ready to scan barcodes (1D & 2D)
            </AlertDescription>
          </Alert>
          {!scannedProduct ? (
            <>
              <div className="space-y-4">
                <div
                  id="qr-reader"
                  className="w-full rounded-lg overflow-hidden"
                  style={{ 
                    minHeight: "400px",
                    display: isScanning ? "block" : "none"
                  }}
                />

                {!isScanning && (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <div className="rounded-full bg-muted p-6 mb-4">
                        <Camera className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Click the button below to start scanning
                      </p>
                      <Button onClick={startScanning} data-testid="button-start-scan">
                        <Camera className="h-4 w-4 mr-2" />
                        Start Camera
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or enter manually
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="manual-sku">Enter SKU</Label>
                <div className="flex gap-2">
                  <Input
                    id="manual-sku"
                    value={manualSKU}
                    onChange={(e) => setManualSKU(e.target.value)}
                    placeholder="Enter product SKU..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleManualSearch();
                      }
                    }}
                    data-testid="input-manual-sku"
                  />
                  <Button onClick={handleManualSearch} data-testid="button-search-sku">
                    Search
                  </Button>
                </div>
              </div>

              {scannedSKU && !scannedProduct && (
                <Card className="border-destructive">
                  <CardContent className="p-4">
                    <p className="text-sm text-destructive" data-testid="text-product-not-found">
                      No product found with SKU: <span className="font-mono">{scannedSKU}</span>
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 rounded-md bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {scannedProduct.productImage ? (
                      <img
                        src={scannedProduct.productImage}
                        alt={scannedProduct.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold mb-2" data-testid="text-found-product-name">
                      {scannedProduct.productName}
                    </h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p className="font-mono" data-testid="text-found-sku">SKU: {scannedProduct.sku}</p>
                      <p>{scannedProduct.brand} • {scannedProduct.category}</p>
                      <p>{scannedProduct.size} • {scannedProduct.color}</p>
                    </div>
                    <div className="mt-4">
                      <p className="text-2xl font-bold">${scannedProduct.price}</p>
                      <p className="text-sm text-muted-foreground" data-testid="text-found-stock">
                        Stock: {scannedProduct.stockQuantity} units
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setScannedSKU("");
                      setManualSKU("");
                    }}
                    data-testid="button-scan-another"
                  >
                    Scan Another
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => onOpenChange(false)}
                    data-testid="button-close-scanner"
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}