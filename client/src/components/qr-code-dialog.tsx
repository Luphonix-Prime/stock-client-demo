import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import type { Product } from "@shared/schema";

interface QRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
}

export function QRCodeDialog({ open, onOpenChange, product }: QRCodeDialogProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadQRCode = async () => {
    setIsDownloading(true);
    try {
      // Use server-generated QR code for download
      const response = await apiRequest("POST", "/api/qr-code/generate", { data: product.sku });
      const qrCodeDataURL = response.qrCode;

      const downloadLink = document.createElement("a");
      downloadLink.download = `${product.sku}-qrcode.png`;
      downloadLink.href = qrCodeDataURL;
      downloadLink.click();
    } catch (error) {
      console.error("Failed to download QR code:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="dialog-qr-code">
        <DialogHeader>
          <DialogTitle>Product QR Code</DialogTitle>
          <DialogDescription>
            Scan this QR code to quickly access product details
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6 py-6">
          <div className="bg-white p-6 rounded-lg" id="qr-code-container">
            <QRCodeSVG
              id="qr-code-svg"
              value={product.sku}
              size={256}
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="text-center space-y-2">
            <h3 className="font-semibold text-lg" data-testid="text-qr-product-name">
              {product.productName}
            </h3>
            <p className="text-sm text-muted-foreground font-mono" data-testid="text-qr-sku">
              SKU: {product.sku}
            </p>
            <p className="text-xs text-muted-foreground">
              Scan this QR code to quickly access product information
            </p>
          </div>

          <Button 
            onClick={downloadQRCode} 
            className="w-full" 
            disabled={isDownloading}
            data-testid="button-download-qr"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download QR Code
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
