
import nodemailer from 'nodemailer';

export class EmailService {
  private transporter;

  constructor() {
    // Configure with environment variables in production
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendDiscountCode(email: string, code: string, amount: string, expiresAt: Date) {
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@inventory.com',
      to: email,
      subject: 'Your Store Credit Discount Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Store Credit Available!</h2>
          <p>Thank you for your recent return. We've issued you a store credit.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0; color: #555;">Your Discount Code</h3>
            <p style="font-size: 24px; font-weight: bold; color: #4CAF50; margin: 10px 0;">${code}</p>
            <p style="margin: 5px 0;"><strong>Credit Amount:</strong> $${amount}</p>
            <p style="margin: 5px 0;"><strong>Expires:</strong> ${new Date(expiresAt).toLocaleDateString()}</p>
          </div>
          
          <p>Use this code at checkout to apply your store credit to your next purchase.</p>
          <p style="color: #666; font-size: 12px;">This code is valid for one-time use only.</p>
        </div>
      `,
    };

    try {
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await this.transporter.sendMail(mailOptions);
        console.log(`Discount code email sent to ${email}`);
      } else {
        console.log(`Email would be sent to ${email} with code ${code} (SMTP not configured)`);
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }
}

export const emailService = new EmailService();
