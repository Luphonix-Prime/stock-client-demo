import QRCode from "qrcode";

export class QRCodeService {
  /**
   * Generate a QR code as a data URL
   */
  async generateQRCode(data: string): Promise<string> {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(data, {
        errorCorrectionLevel: "H",
        margin: 2,
        width: 512,
      });
      return qrCodeDataURL;
    } catch (error) {
      throw new Error("Failed to generate QR code");
    }
  }

  /**
   * Generate a QR code as a buffer
   */
  async generateQRCodeBuffer(data: string): Promise<Buffer> {
    try {
      const buffer = await QRCode.toBuffer(data, {
        errorCorrectionLevel: "H",
        margin: 2,
        width: 512,
      });
      return buffer;
    } catch (error) {
      throw new Error("Failed to generate QR code buffer");
    }
  }
}

export const qrCodeService = new QRCodeService();
