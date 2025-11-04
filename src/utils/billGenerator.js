/**
 * Bill Generator Utility
 * Generates bills and invoices for orders
 */

import QRCode from 'qrcode';

class BillGenerator {
  constructor() {
    this.upiId = 'manas28prabhu@okaxis';
    this.companyName = 'FarmTech Materials';
    this.companyAddress = 'Agricultural Solutions Provider';
  }

  // Generate QR code for UPI payment
  async generateQRCode(amount, orderNumber) {
    try {
      const upiString = `upi://pay?pa=${this.upiId}&pn=${encodeURIComponent(this.companyName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Order ${orderNumber}`)}`;
      const qrCodeDataURL = await QRCode.toDataURL(upiString, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return null;
    }
  }

  // Generate order reference number
  generateOrderNumber() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  // Generate bill content as text
  generateTextBill(orderData, language = 'en') {
    const { orderNumber, items, subtotal, tax, totalAmount, customerInfo, createdAt } = orderData;
    
    const translations = {
      en: {
        title: 'FARMTECH MATERIALS - ORDER BILL',
        orderNumber: 'Order Number',
        date: 'Date',
        customer: 'Customer',
        items: 'ITEMS',
        summary: 'SUMMARY',
        subtotal: 'Subtotal',
        tax: 'Tax (5%)',
        total: 'Total',
        paymentInstructions: 'PAYMENT INSTRUCTIONS',
        upiId: 'UPI ID',
        amount: 'Amount',
        note: 'Please complete payment and submit verification details.'
      },
      hi: {
        title: 'फार्मटेक मैटेरियल्स - ऑर्डर बिल',
        orderNumber: 'ऑर्डर संख्या',
        date: 'दिनांक',
        customer: 'ग्राहक',
        items: 'वस्तुएं',
        summary: 'सारांश',
        subtotal: 'उप-योग',
        tax: 'कर (5%)',
        total: 'कुल',
        paymentInstructions: 'भुगतान निर्देश',
        upiId: 'UPI आईडी',
        amount: 'राशि',
        note: 'कृपया भुगतान पूरा करें और सत्यापन विवरण जमा करें।'
      },
      mr: {
        title: 'फार्मटेक मैटेरियल्स - ऑर्डर बिल',
        orderNumber: 'ऑर्डर क्रमांक',
        date: 'दिनांक',
        customer: 'ग्राहक',
        items: 'वस्तू',
        summary: 'सारांश',
        subtotal: 'उप-एकूण',
        tax: 'कर (5%)',
        total: 'एकूण',
        paymentInstructions: 'पेमेंट सूचना',
        upiId: 'UPI आयडी',
        amount: 'रक्कम',
        note: 'कृपया पेमेंट पूर्ण करा आणि पडताळणी तपशील सबमिट करा।'
      }
    };

    const t = translations[language] || translations.en;

    return `
${t.title}
${'='.repeat(50)}

${t.orderNumber}: ${orderNumber}
${t.date}: ${new Date(createdAt).toLocaleDateString()}
${t.customer}: ${customerInfo?.name || 'N/A'}

${t.items}:
${'-'.repeat(50)}
${items.map(item => 
  `${item.materialName} x ${item.quantity} @ ₹${item.unitPrice} = ₹${item.subtotal.toFixed(2)}`
).join('\n')}

${t.summary}:
${'-'.repeat(50)}
${t.subtotal}: ₹${subtotal.toFixed(2)}
${t.tax}: ₹${tax.toFixed(2)}
${t.total}: ₹${totalAmount.toFixed(2)}

${t.paymentInstructions}:
${'-'.repeat(50)}
${t.upiId}: ${this.upiId}
${t.amount}: ₹${totalAmount.toFixed(2)}

${t.note}
    `.trim();
  }

  // Generate HTML bill
  generateHTMLBill(orderData, qrCodeDataURL, language = 'en') {
    const { orderNumber, items, subtotal, tax, totalAmount, customerInfo, createdAt } = orderData;
    
    const translations = {
      en: {
        title: 'Order Bill',
        orderNumber: 'Order Number',
        date: 'Date',
        customer: 'Customer Information',
        items: 'Order Items',
        summary: 'Order Summary',
        subtotal: 'Subtotal',
        tax: 'Tax (5%)',
        total: 'Total Amount',
        paymentInstructions: 'Payment Instructions',
        upiId: 'UPI ID',
        qrCode: 'Scan QR Code to Pay',
        note: 'Please complete payment and submit verification details including transaction ID and payment screenshot.'
      },
      hi: {
        title: 'ऑर्डर बिल',
        orderNumber: 'ऑर्डर संख्या',
        date: 'दिनांक',
        customer: 'ग्राहक जानकारी',
        items: 'ऑर्डर आइटम',
        summary: 'ऑर्डर सारांश',
        subtotal: 'उप-योग',
        tax: 'कर (5%)',
        total: 'कुल राशि',
        paymentInstructions: 'भुगतान निर्देश',
        upiId: 'UPI आईडी',
        qrCode: 'भुगतान के लिए QR कोड स्कैन करें',
        note: 'कृपया भुगतान पूरा करें और लेनदेन आईडी और भुगतान स्क्रीनशॉट सहित सत्यापन विवरण जमा करें।'
      },
      mr: {
        title: 'ऑर्डर बिल',
        orderNumber: 'ऑर्डर क्रमांक',
        date: 'दिनांक',
        customer: 'ग्राहक माहिती',
        items: 'ऑर्डर वस्तू',
        summary: 'ऑर्डर सारांश',
        subtotal: 'उप-एकूण',
        tax: 'कर (5%)',
        total: 'एकूण रक्कम',
        paymentInstructions: 'पेमेंट सूचना',
        upiId: 'UPI आयडी',
        qrCode: 'पेमेंटसाठी QR कोड स्कॅन करा',
        note: 'कृपया पेमेंट पूर्ण करा आणि व्यवहार आयडी आणि पेमेंट स्क्रीनशॉटसह पडताळणी तपशील सबमिट करा।'
      }
    };

    const t = translations[language] || translations.en;

    return `
<!DOCTYPE html>
<html lang="${language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${t.title} - ${orderNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
        .company-name { font-size: 24px; font-weight: bold; color: #2563eb; }
        .bill-title { font-size: 20px; margin-top: 10px; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 16px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .items-table th { background-color: #f5f5f5; }
        .total-row { font-weight: bold; background-color: #f0f9ff; }
        .payment-section { background-color: #f8fafc; padding: 15px; border-radius: 8px; }
        .qr-code { text-align: center; margin: 20px 0; }
        .note { background-color: #fef3c7; padding: 10px; border-radius: 4px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">${this.companyName}</div>
        <div>${this.companyAddress}</div>
        <div class="bill-title">${t.title}</div>
    </div>

    <div class="section">
        <div class="info-row">
            <span><strong>${t.orderNumber}:</strong> ${orderNumber}</span>
            <span><strong>${t.date}:</strong> ${new Date(createdAt).toLocaleDateString()}</span>
        </div>
    </div>

    <div class="section">
        <div class="section-title">${t.customer}</div>
        <div><strong>Name:</strong> ${customerInfo?.name || 'N/A'}</div>
        <div><strong>Email:</strong> ${customerInfo?.email || 'N/A'}</div>
        <div><strong>Phone:</strong> ${customerInfo?.phone || 'N/A'}</div>
    </div>

    <div class="section">
        <div class="section-title">${t.items}</div>
        <table class="items-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => `
                    <tr>
                        <td>${item.materialName}</td>
                        <td>${item.quantity}</td>
                        <td>₹${item.unitPrice.toFixed(2)}</td>
                        <td>₹${item.subtotal.toFixed(2)}</td>
                    </tr>
                `).join('')}
                <tr>
                    <td colspan="3"><strong>${t.subtotal}</strong></td>
                    <td><strong>₹${subtotal.toFixed(2)}</strong></td>
                </tr>
                <tr>
                    <td colspan="3"><strong>${t.tax}</strong></td>
                    <td><strong>₹${tax.toFixed(2)}</strong></td>
                </tr>
                <tr class="total-row">
                    <td colspan="3"><strong>${t.total}</strong></td>
                    <td><strong>₹${totalAmount.toFixed(2)}</strong></td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="payment-section">
        <div class="section-title">${t.paymentInstructions}</div>
        <div class="info-row">
            <span><strong>${t.upiId}:</strong> ${this.upiId}</span>
            <span><strong>Amount:</strong> ₹${totalAmount.toFixed(2)}</span>
        </div>
        ${qrCodeDataURL ? `
            <div class="qr-code">
                <img src="${qrCodeDataURL}" alt="QR Code" style="max-width: 200px;">
                <div>${t.qrCode}</div>
            </div>
        ` : ''}
    </div>

    <div class="note">
        <strong>Note:</strong> ${t.note}
    </div>
</body>
</html>
    `.trim();
  }

  // Generate and download bill
  async generateAndDownloadBill(orderData, format = 'html', language = 'en') {
    try {
      let content, filename, mimeType;

      if (format === 'html') {
        const qrCodeDataURL = await this.generateQRCode(orderData.totalAmount, orderData.orderNumber);
        content = this.generateHTMLBill(orderData, qrCodeDataURL, language);
        filename = `bill-${orderData.orderNumber}.html`;
        mimeType = 'text/html';
      } else {
        content = this.generateTextBill(orderData, language);
        filename = `bill-${orderData.orderNumber}.txt`;
        mimeType = 'text/plain';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Error generating bill:', error);
      return false;
    }
  }

  // Print bill
  async printBill(orderData, language = 'en') {
    try {
      const qrCodeDataURL = await this.generateQRCode(orderData.totalAmount, orderData.orderNumber);
      const htmlContent = this.generateHTMLBill(orderData, qrCodeDataURL, language);
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
      
      return true;
    } catch (error) {
      console.error('Error printing bill:', error);
      return false;
    }
  }
}

// Create singleton instance
const billGenerator = new BillGenerator();

export default billGenerator;
export { BillGenerator };