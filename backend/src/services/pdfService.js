const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

class PDFService {
  static async generateVoucherPDF(voucher) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Company Header
        this.addCompanyHeader(doc, voucher.company);
        
        // Voucher Details
        this.addVoucherDetails(doc, voucher);
        
        // Party Details
        if (voucher.party) {
          this.addPartyDetails(doc, voucher);
        }
        
        // Items Table (for sales/purchase vouchers)
        if (['sales', 'purchase'].includes(voucher.voucherType) && voucher.items) {
          this.addItemsTable(doc, voucher);
        }
        
        // Totals
        if (voucher.totals) {
          this.addTotals(doc, voucher);
        }
        
        // Terms and Conditions
        if (voucher.terms) {
          this.addTerms(doc, voucher);
        }
        
        // Footer
        this.addFooter(doc, voucher);
        
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  static addCompanyHeader(doc, company) {
    // Company Name
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text(company.name, 50, 50);
    
    // Company Address
    if (company.addresses && company.addresses.length > 0) {
      const address = company.addresses.find(addr => addr.isDefault) || company.addresses[0];
      doc.fontSize(10)
         .font('Helvetica')
         .text(`${address.line1}`, 50, 80);
      
      if (address.line2) {
        doc.text(`${address.line2}`, 50, 95);
      }
      
      doc.text(`${address.city}, ${address.state} - ${address.pincode}`, 50, 110);
    }
    
    // GSTIN
    if (company.gstin) {
      doc.text(`GSTIN: ${company.gstin}`, 50, 130);
    }
    
    // Contact
    if (company.contact) {
      let contactY = 145;
      if (company.contact.phone) {
        doc.text(`Phone: ${company.contact.phone}`, 50, contactY);
        contactY += 15;
      }
      if (company.contact.email) {
        doc.text(`Email: ${company.contact.email}`, 50, contactY);
      }
    }
    
    // Draw line
    doc.moveTo(50, 180)
       .lineTo(550, 180)
       .stroke();
  }

  static addVoucherDetails(doc, voucher) {
    const startY = 200;
    
    // Voucher Type and Number
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text(voucher.voucherType.toUpperCase(), 50, startY);
    
    doc.fontSize(12)
       .font('Helvetica')
       .text(`Voucher No: ${voucher.formattedNumber}`, 350, startY);
    
    // Date
    doc.text(`Date: ${moment(voucher.date).format('DD/MM/YYYY')}`, 350, startY + 20);
    
    // Reference
    if (voucher.reference && voucher.reference.number) {
      doc.text(`Ref: ${voucher.reference.number}`, 350, startY + 40);
      if (voucher.reference.date) {
        doc.text(`Ref Date: ${moment(voucher.reference.date).format('DD/MM/YYYY')}`, 350, startY + 60);
      }
    }
  }

  static addPartyDetails(doc, voucher) {
    const startY = 280;
    
    // Party Type Label
    const partyLabel = voucher.voucherType === 'sales' ? 'Bill To:' : 
                      voucher.voucherType === 'purchase' ? 'Bill From:' : 'Party:';
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text(partyLabel, 50, startY);
    
    // Party Name
    doc.fontSize(11)
       .font('Helvetica')
       .text(voucher.party.fullName, 50, startY + 20);
    
    // Party Address
    if (voucher.party.addresses && voucher.party.addresses.length > 0) {
      const address = voucher.party.defaultBillingAddress || voucher.party.addresses[0];
      let addressY = startY + 40;
      
      doc.text(address.line1, 50, addressY);
      addressY += 15;
      
      if (address.line2) {
        doc.text(address.line2, 50, addressY);
        addressY += 15;
      }
      
      doc.text(`${address.city}, ${address.state} - ${address.pincode}`, 50, addressY);
    }
    
    // Party GSTIN
    if (voucher.party.gstin) {
      doc.text(`GSTIN: ${voucher.party.gstin}`, 50, startY + 100);
    }
  }

  static addItemsTable(doc, voucher) {
    const startY = 400;
    const tableTop = startY;
    const itemCodeX = 50;
    const descriptionX = 120;
    const quantityX = 300;
    const rateX = 350;
    const amountX = 420;
    const taxX = 480;
    
    // Table Headers
    doc.fontSize(10)
       .font('Helvetica-Bold');
    
    doc.text('Code', itemCodeX, tableTop);
    doc.text('Description', descriptionX, tableTop);
    doc.text('Qty', quantityX, tableTop);
    doc.text('Rate', rateX, tableTop);
    doc.text('Amount', amountX, tableTop);
    doc.text('Tax', taxX, tableTop);
    
    // Draw header line
    doc.moveTo(50, tableTop + 15)
       .lineTo(550, tableTop + 15)
       .stroke();
    
    // Table Rows
    let currentY = tableTop + 25;
    doc.font('Helvetica');
    
    voucher.items.forEach((item, index) => {
      const itemAmount = item.quantity * item.rate;
      const taxAmount = (itemAmount * (item.cgst + item.sgst + item.igst + item.cess)) / 100;
      
      doc.text(item.item.code || '', itemCodeX, currentY);
      doc.text(item.item.name, descriptionX, currentY);
      doc.text(item.quantity.toString(), quantityX, currentY);
      doc.text(`₹${item.rate.toFixed(2)}`, rateX, currentY);
      doc.text(`₹${itemAmount.toFixed(2)}`, amountX, currentY);
      doc.text(`₹${taxAmount.toFixed(2)}`, taxX, currentY);
      
      currentY += 20;
      
      // Add page break if needed
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }
    });
    
    // Draw bottom line
    doc.moveTo(50, currentY)
       .lineTo(550, currentY)
       .stroke();
  }

  static addTotals(doc, voucher) {
    const startY = doc.y + 20;
    const labelX = 350;
    const valueX = 480;
    
    doc.fontSize(10)
       .font('Helvetica');
    
    let currentY = startY;
    
    // Subtotal
    doc.text('Subtotal:', labelX, currentY);
    doc.text(`₹${voucher.totals.subtotal.toFixed(2)}`, valueX, currentY);
    currentY += 15;
    
    // Discount
    if (voucher.totals.totalDiscount > 0) {
      doc.text('Discount:', labelX, currentY);
      doc.text(`₹${voucher.totals.totalDiscount.toFixed(2)}`, valueX, currentY);
      currentY += 15;
    }
    
    // Tax Breakup
    if (voucher.totals.taxBreakup) {
      if (voucher.totals.taxBreakup.cgst > 0) {
        doc.text('CGST:', labelX, currentY);
        doc.text(`₹${voucher.totals.taxBreakup.cgst.toFixed(2)}`, valueX, currentY);
        currentY += 15;
      }
      
      if (voucher.totals.taxBreakup.sgst > 0) {
        doc.text('SGST:', labelX, currentY);
        doc.text(`₹${voucher.totals.taxBreakup.sgst.toFixed(2)}`, valueX, currentY);
        currentY += 15;
      }
      
      if (voucher.totals.taxBreakup.igst > 0) {
        doc.text('IGST:', labelX, currentY);
        doc.text(`₹${voucher.totals.taxBreakup.igst.toFixed(2)}`, valueX, currentY);
        currentY += 15;
      }
    }
    
    // Grand Total
    doc.fontSize(12)
       .font('Helvetica-Bold');
    doc.text('Grand Total:', labelX, currentY);
    doc.text(`₹${voucher.totals.grandTotal.toFixed(2)}`, valueX, currentY);
  }

  static addTerms(doc, voucher) {
    const startY = doc.y + 30;
    
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Terms & Conditions:', 50, startY);
    
    doc.font('Helvetica');
    let currentY = startY + 20;
    
    if (voucher.terms.paymentTerms) {
      doc.text(`Payment Terms: ${voucher.terms.paymentTerms}`, 50, currentY);
      currentY += 15;
    }
    
    if (voucher.terms.deliveryTerms) {
      doc.text(`Delivery Terms: ${voucher.terms.deliveryTerms}`, 50, currentY);
      currentY += 15;
    }
    
    if (voucher.terms.otherTerms) {
      doc.text(`Other Terms: ${voucher.terms.otherTerms}`, 50, currentY);
    }
  }

  static addFooter(doc, voucher) {
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 100;
    
    // Signature
    doc.fontSize(10)
       .font('Helvetica')
       .text('Authorized Signatory', 400, footerY);
    
    // Generated timestamp
    doc.text(`Generated on: ${moment().format('DD/MM/YYYY HH:mm')}`, 50, footerY + 30);
    
    // Page number
    const pageNumber = doc.bufferedPageRange().count;
    doc.text(`Page ${pageNumber}`, 500, footerY + 30);
  }
}

module.exports = PDFService;
