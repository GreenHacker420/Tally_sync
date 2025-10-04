import twilio from 'twilio';
import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';
import moment from 'moment';
import EmailService from './emailService.js';

class NotificationService {
  constructor() {
    // Initialize Twilio client
    this.twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Initialize email service
    this.emailService = EmailService;

    // Initialize email transporter (legacy support)
    this.emailTransporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Send WhatsApp message
  async sendWhatsApp(messageData) {
    try {
      const { to, message, mediaUrl } = messageData;
      
      const messageOptions = {
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${to}`,
        body: message
      };

      if (mediaUrl) {
        messageOptions.mediaUrl = mediaUrl;
      }

      const result = await this.twilioClient.messages.create(messageOptions);
      
      logger.info('WhatsApp message sent:', { 
        to, 
        messageSid: result.sid,
        status: result.status 
      });

      return {
        success: true,
        data: {
          messageSid: result.sid,
          status: result.status,
          to: result.to,
          from: result.from
        }
      };
    } catch (error) {
      logger.error('Send WhatsApp error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Send SMS
  async sendSMS(messageData) {
    try {
      const { to, message } = messageData;
      
      const result = await this.twilioClient.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to,
        body: message
      });
      
      logger.info('SMS sent:', { 
        to, 
        messageSid: result.sid,
        status: result.status 
      });

      return {
        success: true,
        data: {
          messageSid: result.sid,
          status: result.status,
          to: result.to,
          from: result.from
        }
      };
    } catch (error) {
      logger.error('Send SMS error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Send Email
  async sendEmail(emailData) {
    try {
      const { to, subject, html, text, attachments } = emailData;
      
      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
        text,
        attachments
      };

      const result = await this.emailTransporter.sendMail(mailOptions);
      
      logger.info('Email sent:', { 
        to, 
        subject,
        messageId: result.messageId 
      });

      return {
        success: true,
        data: {
          messageId: result.messageId,
          accepted: result.accepted,
          rejected: result.rejected
        }
      };
    } catch (error) {
      logger.error('Send email error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Send payment reminder
  async sendPaymentReminder(reminderData) {
    try {
      const {
        party,
        voucher,
        company,
        methods = ['whatsapp', 'email'],
        customMessage
      } = reminderData;

      const results = [];
      
      // Generate reminder message
      const message = customMessage || this.generatePaymentReminderMessage(party, voucher, company);
      
      // Send WhatsApp reminder
      if (methods.includes('whatsapp') && party.contact?.phone) {
        const whatsappResult = await this.sendWhatsApp({
          to: party.contact.phone,
          message
        });
        results.push({ method: 'whatsapp', ...whatsappResult });
      }

      // Send Email reminder
      if (methods.includes('email') && party.contact?.email) {
        const emailResult = await this.sendEmail({
          to: party.contact.email,
          subject: `Payment Reminder - ${voucher.formattedNumber}`,
          html: this.generatePaymentReminderHTML(party, voucher, company, message),
          text: message
        });
        results.push({ method: 'email', ...emailResult });
      }

      // Send SMS reminder
      if (methods.includes('sms') && party.contact?.phone) {
        const smsResult = await this.sendSMS({
          to: party.contact.phone,
          message
        });
        results.push({ method: 'sms', ...smsResult });
      }

      logger.info('Payment reminder sent:', { 
        partyId: party._id,
        voucherId: voucher._id,
        methods: results.map(r => r.method)
      });

      return {
        success: true,
        data: results
      };
    } catch (error) {
      logger.error('Send payment reminder error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Generate payment reminder message
  generatePaymentReminderMessage(party, voucher, company) {
    const dueDate = moment(voucher.dueDate).format('DD/MM/YYYY');
    const amount = `₹${voucher.totals.grandTotal.toFixed(2)}`;
    const overdueDays = moment().diff(moment(voucher.dueDate), 'days');
    
    let message = `Dear ${party.name},\n\n`;
    
    if (overdueDays > 0) {
      message += `This is a reminder that your payment of ${amount} for invoice ${voucher.formattedNumber} was due on ${dueDate} and is now ${overdueDays} days overdue.\n\n`;
    } else {
      message += `This is a reminder that your payment of ${amount} for invoice ${voucher.formattedNumber} is due on ${dueDate}.\n\n`;
    }
    
    message += `Please make the payment at your earliest convenience.\n\n`;
    message += `For any queries, please contact us.\n\n`;
    message += `Thank you,\n${company.name}`;
    
    if (company.contact?.phone) {
      message += `\nPhone: ${company.contact.phone}`;
    }
    
    return message;
  }

  // Generate payment reminder HTML
  generatePaymentReminderHTML(party, voucher, company, textMessage) {
    const dueDate = moment(voucher.dueDate).format('DD/MM/YYYY');
    const amount = `₹${voucher.totals.grandTotal.toFixed(2)}`;
    const overdueDays = moment().diff(moment(voucher.dueDate), 'days');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .invoice-details { background-color: #f8f9fa; padding: 15px; margin: 20px 0; }
          .amount { font-size: 24px; font-weight: bold; color: #dc3545; }
          .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; }
          ${overdueDays > 0 ? '.overdue { color: #dc3545; font-weight: bold; }' : ''}
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${company.name}</h2>
            <h3>Payment Reminder</h3>
          </div>
          
          <div class="content">
            <p>Dear ${party.name},</p>
            
            ${overdueDays > 0 ? 
              `<p class="overdue">This is a reminder that your payment is ${overdueDays} days overdue.</p>` :
              `<p>This is a reminder about your upcoming payment.</p>`
            }
            
            <div class="invoice-details">
              <h4>Invoice Details:</h4>
              <p><strong>Invoice Number:</strong> ${voucher.formattedNumber}</p>
              <p><strong>Due Date:</strong> ${dueDate}</p>
              <p><strong>Amount:</strong> <span class="amount">${amount}</span></p>
            </div>
            
            <p>Please make the payment at your earliest convenience.</p>
            <p>For any queries, please contact us.</p>
            
            <p>Thank you,<br>
            <strong>${company.name}</strong></p>
            
            ${company.contact?.phone ? `<p>Phone: ${company.contact.phone}</p>` : ''}
            ${company.contact?.email ? `<p>Email: ${company.contact.email}</p>` : ''}
          </div>
          
          <div class="footer">
            <p>This is an automated reminder. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Send invoice notification
  async sendInvoiceNotification(notificationData) {
    try {
      const {
        party,
        voucher,
        company,
        methods = ['whatsapp', 'email'],
        pdfBuffer
      } = notificationData;

      const results = [];
      
      // Generate invoice message
      const message = this.generateInvoiceMessage(party, voucher, company);
      
      // Send WhatsApp notification
      if (methods.includes('whatsapp') && party.contact?.phone) {
        const whatsappResult = await this.sendWhatsApp({
          to: party.contact.phone,
          message
        });
        results.push({ method: 'whatsapp', ...whatsappResult });
      }

      // Send Email notification with PDF attachment
      if (methods.includes('email') && party.contact?.email) {
        const attachments = [];
        if (pdfBuffer) {
          attachments.push({
            filename: `${voucher.formattedNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          });
        }

        const emailResult = await this.sendEmail({
          to: party.contact.email,
          subject: `Invoice - ${voucher.formattedNumber}`,
          html: this.generateInvoiceHTML(party, voucher, company, message),
          text: message,
          attachments
        });
        results.push({ method: 'email', ...emailResult });
      }

      logger.info('Invoice notification sent:', { 
        partyId: party._id,
        voucherId: voucher._id,
        methods: results.map(r => r.method)
      });

      return {
        success: true,
        data: results
      };
    } catch (error) {
      logger.error('Send invoice notification error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Generate invoice message
  generateInvoiceMessage(party, voucher, company) {
    const amount = `₹${voucher.totals.grandTotal.toFixed(2)}`;
    const date = moment(voucher.date).format('DD/MM/YYYY');
    
    let message = `Dear ${party.name},\n\n`;
    message += `Please find attached your invoice ${voucher.formattedNumber} dated ${date} for ${amount}.\n\n`;
    
    if (voucher.dueDate) {
      const dueDate = moment(voucher.dueDate).format('DD/MM/YYYY');
      message += `Payment is due by ${dueDate}.\n\n`;
    }
    
    message += `Thank you for your business!\n\n`;
    message += `Best regards,\n${company.name}`;
    
    return message;
  }

  // Generate invoice HTML
  generateInvoiceHTML(party, voucher, company, textMessage) {
    const amount = `₹${voucher.totals.grandTotal.toFixed(2)}`;
    const date = moment(voucher.date).format('DD/MM/YYYY');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .invoice-details { background-color: #f8f9fa; padding: 15px; margin: 20px 0; }
          .amount { font-size: 24px; font-weight: bold; color: #007bff; }
          .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${company.name}</h2>
            <h3>Invoice Notification</h3>
          </div>
          
          <div class="content">
            <p>Dear ${party.name},</p>
            
            <p>Please find attached your invoice for the recent transaction.</p>
            
            <div class="invoice-details">
              <h4>Invoice Details:</h4>
              <p><strong>Invoice Number:</strong> ${voucher.formattedNumber}</p>
              <p><strong>Date:</strong> ${date}</p>
              <p><strong>Amount:</strong> <span class="amount">${amount}</span></p>
              ${voucher.dueDate ? `<p><strong>Due Date:</strong> ${moment(voucher.dueDate).format('DD/MM/YYYY')}</p>` : ''}
            </div>
            
            <p>Thank you for your business!</p>
            
            <p>Best regards,<br>
            <strong>${company.name}</strong></p>
          </div>
          
          <div class="footer">
            <p>This is an automated notification. For any queries, please contact us.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export default new NotificationService();
