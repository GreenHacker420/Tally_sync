const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');
const logger = require('../utils/logger');
const moment = require('moment');

class EmailService {
  constructor() {
    this.transporter = null;
    this.templates = new Map();
    this.emailQueue = [];
    this.isProcessingQueue = false;
    this.deliveryStatus = new Map();
    
    this.initializeTransporter();
    this.loadTemplates();
    this.startQueueProcessor();
  }

  // Initialize SMTP transporter
  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        pool: true, // Use connection pooling
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 1000, // 1 second
        rateLimit: 5 // max 5 emails per second
      });

      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error('SMTP connection failed:', error);
        } else {
          logger.info('SMTP server is ready to send emails');
        }
      });
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
    }
  }

  // Load email templates
  async loadTemplates() {
    try {
      const templatesDir = path.join(__dirname, '../templates/email');
      
      // Ensure templates directory exists
      try {
        await fs.access(templatesDir);
      } catch {
        await fs.mkdir(templatesDir, { recursive: true });
        await this.createDefaultTemplates(templatesDir);
      }

      const templateFiles = await fs.readdir(templatesDir);
      
      for (const file of templateFiles) {
        if (file.endsWith('.hbs')) {
          const templateName = path.basename(file, '.hbs');
          const templateContent = await fs.readFile(path.join(templatesDir, file), 'utf8');
          this.templates.set(templateName, handlebars.compile(templateContent));
        }
      }

      logger.info(`Loaded ${this.templates.size} email templates`);
    } catch (error) {
      logger.error('Failed to load email templates:', error);
    }
  }

  // Create default email templates
  async createDefaultTemplates(templatesDir) {
    const templates = {
      'invoice-notification': this.getInvoiceNotificationTemplate(),
      'payment-reminder': this.getPaymentReminderTemplate(),
      'payment-confirmation': this.getPaymentConfirmationTemplate(),
      'account-verification': this.getAccountVerificationTemplate(),
      'password-reset': this.getPasswordResetTemplate(),
      'welcome': this.getWelcomeTemplate()
    };

    for (const [name, content] of Object.entries(templates)) {
      await fs.writeFile(path.join(templatesDir, `${name}.hbs`), content);
    }
  }

  // Send email with template
  async sendEmail(emailData) {
    try {
      const {
        to,
        subject,
        template,
        data = {},
        attachments = [],
        priority = 'normal',
        trackDelivery = true
      } = emailData;

      // Generate email content
      let html, text;
      
      if (template && this.templates.has(template)) {
        const templateFunc = this.templates.get(template);
        html = templateFunc(data);
        text = this.htmlToText(html);
      } else {
        html = emailData.html;
        text = emailData.text;
      }

      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'FinSync360'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
        text,
        attachments,
        priority: priority === 'high' ? 'high' : 'normal'
      };

      // Add to queue or send immediately based on priority
      if (priority === 'high') {
        return await this.sendImmediately(mailOptions, trackDelivery);
      } else {
        return await this.addToQueue(mailOptions, trackDelivery);
      }
    } catch (error) {
      logger.error('Send email error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Send email immediately
  async sendImmediately(mailOptions, trackDelivery = true) {
    try {
      const result = await this.transporter.sendMail(mailOptions);
      
      if (trackDelivery) {
        this.deliveryStatus.set(result.messageId, {
          status: 'sent',
          timestamp: new Date(),
          to: mailOptions.to,
          subject: mailOptions.subject
        });
      }

      logger.info('Email sent immediately:', {
        to: mailOptions.to,
        subject: mailOptions.subject,
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
      logger.error('Send email immediately error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Add email to queue
  async addToQueue(mailOptions, trackDelivery = true) {
    const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.emailQueue.push({
      id: emailId,
      mailOptions,
      trackDelivery,
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date()
    });

    logger.info('Email added to queue:', {
      emailId,
      to: mailOptions.to,
      subject: mailOptions.subject,
      queueLength: this.emailQueue.length
    });

    return {
      success: true,
      data: {
        emailId,
        status: 'queued'
      }
    };
  }

  // Start queue processor
  startQueueProcessor() {
    setInterval(async () => {
      if (!this.isProcessingQueue && this.emailQueue.length > 0) {
        await this.processQueue();
      }
    }, 5000); // Process queue every 5 seconds
  }

  // Process email queue
  async processQueue() {
    if (this.isProcessingQueue || this.emailQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    
    try {
      const batchSize = 5; // Process 5 emails at a time
      const batch = this.emailQueue.splice(0, batchSize);

      const promises = batch.map(async (emailItem) => {
        try {
          const result = await this.transporter.sendMail(emailItem.mailOptions);
          
          if (emailItem.trackDelivery) {
            this.deliveryStatus.set(result.messageId, {
              status: 'sent',
              timestamp: new Date(),
              to: emailItem.mailOptions.to,
              subject: emailItem.mailOptions.subject,
              emailId: emailItem.id
            });
          }

          logger.info('Queued email sent:', {
            emailId: emailItem.id,
            to: emailItem.mailOptions.to,
            messageId: result.messageId
          });

          return { success: true, emailId: emailItem.id };
        } catch (error) {
          emailItem.attempts++;
          
          if (emailItem.attempts < emailItem.maxAttempts) {
            // Re-add to queue for retry
            this.emailQueue.push(emailItem);
            logger.warn('Email failed, will retry:', {
              emailId: emailItem.id,
              attempt: emailItem.attempts,
              error: error.message
            });
          } else {
            logger.error('Email failed permanently:', {
              emailId: emailItem.id,
              attempts: emailItem.attempts,
              error: error.message
            });
            
            if (emailItem.trackDelivery) {
              this.deliveryStatus.set(emailItem.id, {
                status: 'failed',
                timestamp: new Date(),
                to: emailItem.mailOptions.to,
                subject: emailItem.mailOptions.subject,
                error: error.message
              });
            }
          }

          return { success: false, emailId: emailItem.id, error: error.message };
        }
      });

      await Promise.all(promises);
    } catch (error) {
      logger.error('Queue processing error:', error);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // Get delivery status
  getDeliveryStatus(messageId) {
    return this.deliveryStatus.get(messageId) || { status: 'unknown' };
  }

  // Get queue status
  getQueueStatus() {
    return {
      queueLength: this.emailQueue.length,
      isProcessing: this.isProcessingQueue,
      totalDelivered: Array.from(this.deliveryStatus.values()).filter(s => s.status === 'sent').length,
      totalFailed: Array.from(this.deliveryStatus.values()).filter(s => s.status === 'failed').length
    };
  }

  // Preview email template
  previewTemplate(templateName, data = {}) {
    if (!this.templates.has(templateName)) {
      throw new Error(`Template '${templateName}' not found`);
    }

    const templateFunc = this.templates.get(templateName);
    return templateFunc(data);
  }

  // Convert HTML to plain text
  htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Send bulk emails
  async sendBulkEmails(emailsData) {
    const results = [];

    for (const emailData of emailsData) {
      const result = await this.addToQueue(emailData.mailOptions, emailData.trackDelivery);
      results.push({
        ...result,
        recipient: emailData.mailOptions.to
      });
    }

    return {
      success: true,
      data: {
        totalEmails: emailsData.length,
        results
      }
    };
  }

  // Email template methods
  getInvoiceNotificationTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice Notification</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px 20px; border: 1px solid #e9ecef; }
        .invoice-details { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 6px; border-left: 4px solid #007bff; }
        .amount { font-size: 28px; font-weight: bold; color: #007bff; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-radius: 0 0 8px 8px; }
        .btn { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .btn:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{company.name}}</h1>
            <h2>Invoice Notification</h2>
        </div>

        <div class="content">
            <p>Dear {{party.name}},</p>

            <p>We hope this email finds you well. Please find attached your invoice for the recent transaction.</p>

            <div class="invoice-details">
                <h3>Invoice Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px 0;"><strong>Invoice Number:</strong></td><td>{{voucher.formattedNumber}}</td></tr>
                    <tr><td style="padding: 8px 0;"><strong>Date:</strong></td><td>{{voucher.date}}</td></tr>
                    <tr><td style="padding: 8px 0;"><strong>Amount:</strong></td><td><span class="amount">₹{{voucher.amount}}</span></td></tr>
                    {{#if voucher.dueDate}}<tr><td style="padding: 8px 0;"><strong>Due Date:</strong></td><td>{{voucher.dueDate}}</td></tr>{{/if}}
                </table>
            </div>

            {{#if paymentLink}}
            <p style="text-align: center;">
                <a href="{{paymentLink}}" class="btn">Pay Now</a>
            </p>
            {{/if}}

            <p>Thank you for your business! We appreciate your continued partnership.</p>

            <p>Best regards,<br>
            <strong>{{company.name}}</strong><br>
            {{#if company.contact.phone}}Phone: {{company.contact.phone}}<br>{{/if}}
            {{#if company.contact.email}}Email: {{company.contact.email}}{{/if}}
            </p>
        </div>

        <div class="footer">
            <p>This is an automated notification. For any queries, please contact us at the above details.</p>
            <p>Generated on {{currentDate}} by FinSync360 ERP System</p>
        </div>
    </div>
</body>
</html>`;
  }

  getPaymentReminderTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Reminder</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc3545, #c82333); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px 20px; border: 1px solid #e9ecef; }
        .reminder-details { background: #fff3cd; padding: 20px; margin: 20px 0; border-radius: 6px; border-left: 4px solid #ffc107; }
        .overdue { background: #f8d7da; border-left-color: #dc3545; }
        .amount { font-size: 28px; font-weight: bold; color: #dc3545; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-radius: 0 0 8px 8px; }
        .btn { display: inline-block; padding: 12px 24px; background: #dc3545; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .btn:hover { background: #c82333; }
        .urgent { color: #dc3545; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{company.name}}</h1>
            <h2>Payment Reminder</h2>
        </div>

        <div class="content">
            <p>Dear {{party.name}},</p>

            {{#if isOverdue}}
            <p class="urgent">This is an urgent reminder that your payment is {{overdueDays}} days overdue.</p>
            {{else}}
            <p>This is a friendly reminder about your upcoming payment.</p>
            {{/if}}

            <div class="reminder-details {{#if isOverdue}}overdue{{/if}}">
                <h3>Payment Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px 0;"><strong>Invoice Number:</strong></td><td>{{voucher.formattedNumber}}</td></tr>
                    <tr><td style="padding: 8px 0;"><strong>Due Date:</strong></td><td>{{voucher.dueDate}}</td></tr>
                    <tr><td style="padding: 8px 0;"><strong>Amount Due:</strong></td><td><span class="amount">₹{{voucher.amount}}</span></td></tr>
                    {{#if isOverdue}}<tr><td style="padding: 8px 0;"><strong>Days Overdue:</strong></td><td class="urgent">{{overdueDays}} days</td></tr>{{/if}}
                </table>
            </div>

            {{#if paymentLink}}
            <p style="text-align: center;">
                <a href="{{paymentLink}}" class="btn">Pay Now</a>
            </p>
            {{/if}}

            <p>Please make the payment at your earliest convenience to avoid any inconvenience.</p>

            <p>If you have already made the payment, please ignore this reminder or contact us with the payment details.</p>

            <p>Thank you for your prompt attention to this matter.</p>

            <p>Best regards,<br>
            <strong>{{company.name}}</strong><br>
            {{#if company.contact.phone}}Phone: {{company.contact.phone}}<br>{{/if}}
            {{#if company.contact.email}}Email: {{company.contact.email}}{{/if}}
            </p>
        </div>

        <div class="footer">
            <p>This is an automated reminder. For any queries, please contact us at the above details.</p>
            <p>Generated on {{currentDate}} by FinSync360 ERP System</p>
        </div>
    </div>
</body>
</html>`;
  }

  getPaymentConfirmationTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #28a745, #1e7e34); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px 20px; border: 1px solid #e9ecef; }
        .payment-details { background: #d4edda; padding: 20px; margin: 20px 0; border-radius: 6px; border-left: 4px solid #28a745; }
        .amount { font-size: 28px; font-weight: bold; color: #28a745; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-radius: 0 0 8px 8px; }
        .success-icon { font-size: 48px; color: #28a745; text-align: center; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{company.name}}</h1>
            <h2>Payment Confirmation</h2>
        </div>

        <div class="content">
            <div class="success-icon">✓</div>

            <p>Dear {{party.name}},</p>

            <p>Thank you! We have successfully received your payment.</p>

            <div class="payment-details">
                <h3>Payment Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px 0;"><strong>Payment ID:</strong></td><td>{{payment.id}}</td></tr>
                    <tr><td style="padding: 8px 0;"><strong>Invoice Number:</strong></td><td>{{voucher.formattedNumber}}</td></tr>
                    <tr><td style="padding: 8px 0;"><strong>Amount Paid:</strong></td><td><span class="amount">₹{{payment.amount}}</span></td></tr>
                    <tr><td style="padding: 8px 0;"><strong>Payment Date:</strong></td><td>{{payment.date}}</td></tr>
                    <tr><td style="padding: 8px 0;"><strong>Payment Method:</strong></td><td>{{payment.method}}</td></tr>
                    <tr><td style="padding: 8px 0;"><strong>Status:</strong></td><td style="color: #28a745; font-weight: bold;">{{payment.status}}</td></tr>
                </table>
            </div>

            <p>Your account has been updated and the invoice has been marked as paid.</p>

            <p>If you have any questions about this payment or need a receipt, please don't hesitate to contact us.</p>

            <p>Thank you for your business!</p>

            <p>Best regards,<br>
            <strong>{{company.name}}</strong><br>
            {{#if company.contact.phone}}Phone: {{company.contact.phone}}<br>{{/if}}
            {{#if company.contact.email}}Email: {{company.contact.email}}{{/if}}
            </p>
        </div>

        <div class="footer">
            <p>This is an automated confirmation. For any queries, please contact us at the above details.</p>
            <p>Generated on {{currentDate}} by FinSync360 ERP System</p>
        </div>
    </div>
</body>
</html>`;
  }

  getAccountVerificationTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Verification</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6f42c1, #5a32a3); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px 20px; border: 1px solid #e9ecef; }
        .verification-box { background: #e7e3ff; padding: 20px; margin: 20px 0; border-radius: 6px; border-left: 4px solid #6f42c1; text-align: center; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-radius: 0 0 8px 8px; }
        .btn { display: inline-block; padding: 15px 30px; background: #6f42c1; color: white; text-decoration: none; border-radius: 6px; margin: 15px 0; font-weight: bold; }
        .btn:hover { background: #5a32a3; }
        .verification-code { font-size: 24px; font-weight: bold; color: #6f42c1; letter-spacing: 3px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to FinSync360</h1>
            <h2>Account Verification</h2>
        </div>

        <div class="content">
            <p>Dear {{user.name}},</p>

            <p>Thank you for registering with FinSync360! To complete your account setup, please verify your email address.</p>

            <div class="verification-box">
                <h3>Verification Required</h3>
                <p>Click the button below to verify your account:</p>
                <a href="{{verificationLink}}" class="btn">Verify Account</a>

                <p style="margin-top: 20px;">Or use this verification code:</p>
                <div class="verification-code">{{verificationCode}}</div>
            </div>

            <p><strong>Important:</strong> This verification link will expire in 24 hours for security reasons.</p>

            <p>If you didn't create an account with us, please ignore this email.</p>

            <p>Welcome aboard!</p>

            <p>Best regards,<br>
            <strong>The FinSync360 Team</strong>
            </p>
        </div>

        <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>If you need help, contact our support team.</p>
        </div>
    </div>
</body>
</html>`;
  }

  getPasswordResetTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #fd7e14, #e55a00); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px 20px; border: 1px solid #e9ecef; }
        .reset-box { background: #fff3cd; padding: 20px; margin: 20px 0; border-radius: 6px; border-left: 4px solid #fd7e14; text-align: center; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-radius: 0 0 8px 8px; }
        .btn { display: inline-block; padding: 15px 30px; background: #fd7e14; color: white; text-decoration: none; border-radius: 6px; margin: 15px 0; font-weight: bold; }
        .btn:hover { background: #e55a00; }
        .warning { color: #856404; background: #fff3cd; padding: 15px; border-radius: 6px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>FinSync360</h1>
            <h2>Password Reset Request</h2>
        </div>

        <div class="content">
            <p>Dear {{user.name}},</p>

            <p>We received a request to reset your password for your FinSync360 account.</p>

            <div class="reset-box">
                <h3>Reset Your Password</h3>
                <p>Click the button below to reset your password:</p>
                <a href="{{resetLink}}" class="btn">Reset Password</a>
            </div>

            <div class="warning">
                <strong>Security Notice:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>This link will expire in 1 hour for security reasons</li>
                    <li>If you didn't request this reset, please ignore this email</li>
                    <li>Your password will remain unchanged until you create a new one</li>
                </ul>
            </div>

            <p>If you're having trouble clicking the button, copy and paste the following link into your browser:</p>
            <p style="word-break: break-all; color: #6c757d; font-size: 12px;">{{resetLink}}</p>

            <p>If you didn't request a password reset, please contact our support team immediately.</p>

            <p>Best regards,<br>
            <strong>The FinSync360 Security Team</strong>
            </p>
        </div>

        <div class="footer">
            <p>This is an automated security email. Please do not reply to this message.</p>
            <p>For security questions, contact our support team.</p>
        </div>
    </div>
</body>
</html>`;
  }

  getWelcomeTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to FinSync360</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #20c997, #17a085); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px 20px; border: 1px solid #e9ecef; }
        .welcome-box { background: #d1ecf1; padding: 20px; margin: 20px 0; border-radius: 6px; border-left: 4px solid #20c997; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-radius: 0 0 8px 8px; }
        .btn { display: inline-block; padding: 12px 24px; background: #20c997; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
        .btn:hover { background: #17a085; }
        .feature-list { list-style: none; padding: 0; }
        .feature-list li { padding: 8px 0; }
        .feature-list li:before { content: "✓"; color: #20c997; font-weight: bold; margin-right: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to FinSync360!</h1>
            <h2>Your Complete ERP Solution</h2>
        </div>

        <div class="content">
            <p>Dear {{user.name}},</p>

            <p>Welcome to FinSync360! We're excited to have you on board. Your account has been successfully created and verified.</p>

            <div class="welcome-box">
                <h3>What's Next?</h3>
                <ul class="feature-list">
                    <li>Set up your company profile</li>
                    <li>Add your first customers and suppliers</li>
                    <li>Create your inventory items</li>
                    <li>Start creating invoices and managing payments</li>
                    <li>Explore our Tally integration features</li>
                </ul>
            </div>

            <p style="text-align: center;">
                <a href="{{dashboardLink}}" class="btn">Go to Dashboard</a>
                <a href="{{helpLink}}" class="btn">Getting Started Guide</a>
            </p>

            <h3>Key Features Available:</h3>
            <ul class="feature-list">
                <li>Complete Voucher Management (Sales, Purchase, Payments)</li>
                <li>Advanced Inventory Tracking</li>
                <li>Digital Payment Integration (Razorpay, UPI)</li>
                <li>Automated WhatsApp & Email Notifications</li>
                <li>GST Compliance & Reporting</li>
                <li>Tally ERP Integration</li>
                <li>Multi-Company Support</li>
            </ul>

            <p>If you have any questions or need assistance getting started, our support team is here to help!</p>

            <p>Thank you for choosing FinSync360!</p>

            <p>Best regards,<br>
            <strong>The FinSync360 Team</strong>
            </p>
        </div>

        <div class="footer">
            <p>Need help? Contact our support team or visit our help center.</p>
            <p>This email was sent to {{user.email}}</p>
        </div>
    </div>
</body>
</html>`;
  }
}

module.exports = new EmailService();
