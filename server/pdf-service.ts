
import PDFDocument from 'pdfkit';
import type { OrderWithItems, ReturnWithItems } from '@shared/schema';

export class PDFService {
  async generateReturnInvoice(returnData: ReturnWithItems, order: OrderWithItems): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        // Header
        doc.fontSize(20).text('RETURN/EXCHANGE INVOICE', { align: 'center' });
        doc.moveDown();

        // Return details
        doc.fontSize(10);
        doc.text(`Return Number: ${returnData.returnNumber}`, { align: 'right' });
        doc.text(`Original Order: ${returnData.orderNumber}`, { align: 'right' });
        doc.text(`Date: ${new Date(returnData.createdAt).toLocaleDateString()}`, { align: 'right' });
        doc.moveDown();

        // Customer details
        doc.fontSize(12).text('Customer:', { underline: true });
        doc.fontSize(10);
        doc.text(returnData.customerName);
        if (returnData.customerEmail) doc.text(returnData.customerEmail);
        doc.moveDown();

        // Returned items table
        let tableTop = doc.y;
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('Returned Items:', 50, tableTop);
        doc.moveDown(0.5);
        
        tableTop = doc.y;
        doc.fontSize(10);
        doc.text('Item', 50, tableTop);
        doc.text('SKU', 200, tableTop);
        doc.text('Qty', 320, tableTop);
        doc.text('Price', 380, tableTop);
        doc.text('Total', 480, tableTop, { align: 'right' });
        
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
        
        doc.font('Helvetica');
        let yPosition = tableTop + 25;
        
        let totalReturnValue = 0;
        returnData.items.forEach((item) => {
          doc.text(item.productName, 50, yPosition, { width: 140 });
          doc.text(item.sku, 200, yPosition);
          doc.text(item.quantity.toString(), 320, yPosition);
          doc.text(`$${item.unitPrice}`, 380, yPosition);
          doc.text(`$${item.subtotal}`, 480, yPosition, { align: 'right' });
          totalReturnValue += parseFloat(item.subtotal);
          yPosition += 25;
        });

        // Exchange items if any
        const exchangeItems = returnData.items.filter(item => item.exchangeProductId);
        if (exchangeItems.length > 0) {
          yPosition += 10;
          doc.fontSize(12).font('Helvetica-Bold');
          doc.text('Exchange Items:', 50, yPosition);
          doc.moveDown(0.5);
          
          yPosition = doc.y;
          doc.fontSize(10);
          doc.text('Item', 50, yPosition);
          doc.text('Qty', 320, yPosition);
          doc.text('Price', 380, yPosition);
          doc.text('Total', 480, yPosition, { align: 'right' });
          
          doc.moveTo(50, yPosition + 15).lineTo(550, yPosition + 15).stroke();
          
          doc.font('Helvetica');
          yPosition += 25;
          
          let totalExchangeValue = 0;
          exchangeItems.forEach((item) => {
            if (item.exchangeProductName) {
              const exchangeTotal = parseFloat(returnData.exchangeValue || '0') / exchangeItems.length;
              doc.text(item.exchangeProductName, 50, yPosition, { width: 260 });
              doc.text(item.quantity.toString(), 320, yPosition);
              doc.text(`$${(exchangeTotal / item.quantity).toFixed(2)}`, 380, yPosition);
              doc.text(`$${exchangeTotal.toFixed(2)}`, 480, yPosition, { align: 'right' });
              totalExchangeValue += exchangeTotal;
              yPosition += 25;
            }
          });
        }

        // Financial Summary
        doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
        yPosition += 15;
        doc.fontSize(10).font('Helvetica');
        
        doc.text('Return Value:', 320, yPosition);
        doc.text(`$${totalReturnValue.toFixed(2)}`, 480, yPosition, { align: 'right' });
        yPosition += 20;

        if (returnData.exchangeValue && parseFloat(returnData.exchangeValue) > 0) {
          doc.text('Exchange Value:', 320, yPosition);
          doc.text(`$${returnData.exchangeValue}`, 480, yPosition, { align: 'right' });
          yPosition += 25;
          
          doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
          yPosition += 15;
          
          doc.fontSize(12).font('Helvetica-Bold');
          if (returnData.refundAmount && parseFloat(returnData.refundAmount) > 0) {
            doc.text('Refund Amount:', 320, yPosition);
            doc.text(`$${returnData.refundAmount}`, 480, yPosition, { align: 'right' });
          } else if (returnData.additionalPayment && parseFloat(returnData.additionalPayment) > 0) {
            doc.text('Additional Payment:', 320, yPosition);
            doc.text(`$${returnData.additionalPayment}`, 480, yPosition, { align: 'right' });
          } else {
            doc.text('Even Exchange:', 320, yPosition);
            doc.text('$0.00', 480, yPosition, { align: 'right' });
          }
        } else {
          doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
          yPosition += 15;
          doc.fontSize(12).font('Helvetica-Bold');
          doc.text('Refund Amount:', 320, yPosition);
          doc.text(`$${returnData.refundAmount}`, 480, yPosition, { align: 'right' });
        }

        // Reason
        if (returnData.reason) {
          doc.moveDown(2);
          doc.fontSize(10).font('Helvetica');
          doc.text('Return Reason:', { underline: true });
          doc.text(returnData.reason);
        }

        // Notes
        if (returnData.notes) {
          doc.moveDown();
          doc.fontSize(10).font('Helvetica');
          doc.text('Notes:', { underline: true });
          doc.text(returnData.notes);
        }

        // Footer
        doc.moveDown(3);
        doc.fontSize(8).text('Thank you for your business!', { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  generateInvoice(order: OrderWithItems): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        // Header
        doc.fontSize(20).text('INVOICE', { align: 'center' });
        doc.moveDown();

        // Order details
        doc.fontSize(10);
        doc.text(`Order Number: ${order.orderNumber}`, { align: 'right' });
        doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, { align: 'right' });
        doc.moveDown();

        // Customer details
        doc.fontSize(12).text('Bill To:', { underline: true });
        doc.fontSize(10);
        doc.text(order.customerName);
        if (order.customerEmail) doc.text(order.customerEmail);
        if (order.customerPhone) doc.text(order.customerPhone);
        doc.moveDown();

        // Items table header
        const tableTop = doc.y;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Item', 50, tableTop);
        doc.text('SKU', 200, tableTop);
        doc.text('Qty', 320, tableTop);
        doc.text('Price', 380, tableTop);
        doc.text('Total', 480, tableTop, { align: 'right' });
        
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
        
        // Items
        doc.font('Helvetica');
        let yPosition = tableTop + 25;
        
        order.items.forEach((item) => {
          doc.text(item.productName, 50, yPosition, { width: 140 });
          doc.text(item.sku, 200, yPosition);
          doc.text(item.quantity.toString(), 320, yPosition);
          doc.text(`$${item.unitPrice}`, 380, yPosition);
          doc.text(`$${item.subtotal}`, 480, yPosition, { align: 'right' });
          yPosition += 25;
        });

        // Total
        doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
        yPosition += 15;
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('Total:', 380, yPosition);
        doc.text(`$${order.totalAmount}`, 480, yPosition, { align: 'right' });

        // Notes
        if (order.notes) {
          doc.moveDown(2);
          doc.fontSize(10).font('Helvetica');
          doc.text('Notes:', { underline: true });
          doc.text(order.notes);
        }

        // Footer
        doc.moveDown(3);
        doc.fontSize(8).text('Thank you for your business!', { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export const pdfService = new PDFService();
