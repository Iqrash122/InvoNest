import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export interface InvoiceItem {
  description: string;
  qty: number;
  rate: number;
  taxRate?: number;
  amount: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  dueDate: string | Date;
  createdAt: string | Date;
  items: InvoiceItem[];
  subtotal: number;
  discount?: number;
  lateFee?: number;
  tax: number;
  total: number;
  currency: string;
  status: string;
  notes?: string;
  templateId?: 'classic' | 'modern' | 'minimal';
  amountPaid?: number;
  balanceDue?: number;
}

export interface ClientData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface BusinessProfile {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  logoUrl?: string;
  currency?: string;
}

export interface PaymentData {
  amount: number;
  method: string;
  date: string | Date;
  reference?: string;
}

function formatDate(date: string | Date) {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return String(date);
  }
}

function formatCurrency(amount: any, currency: string = 'USD') {
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num)) return `${currency} 0.00`;
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num);
  } catch {
    // Fallback if currency code is unrecognised on device
    return `${currency} ${num.toFixed(2)}`;
  }
}

function getStatusBadgeHtml(status: string) {
  const s = status.toUpperCase();
  let bg = '#E5E7EB';
  let color = '#374151';

  if (s === 'PAID') { bg = '#D1FAE5'; color = '#065F46'; }
  else if (s === 'SENT') { bg = '#DBEAFE'; color = '#1E40AF'; }
  else if (s === 'OVERDUE') { bg = '#FEE2E2'; color = '#991B1B'; }
  else if (s === 'DRAFT') { bg = '#F3F4F6'; color = '#4B5563'; }

  return `<span style="background-color: ${bg}; color: ${color}; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; display: inline-block;">${status}</span>`;
}

function getLogoHtml(logoUrl?: string, size = 64): string {
  if (!logoUrl) return '';
  // logoUrl can be a file URI (from expo-image-picker) or a base64 data URI
  return `<img src="${logoUrl}" style="width: ${size}px; height: ${size}px; object-fit: contain; border-radius: 8px; display: block;" alt="Logo" />`;
}

function getInvoiceHtml(
  invoice: InvoiceData,
  client: ClientData,
  business: BusinessProfile,
  templateId: 'classic' | 'modern' | 'minimal' = 'classic'
): string {
  const currency = invoice.currency || 'USD';
  const itemsHtml = invoice.items.map((item) => `
    <tr style="border-bottom: 1px solid #E5E7EB;">
      <td style="padding: 12px 0; font-size: 14px; color: #1F2937;">${item.description}</td>
      <td style="padding: 12px 0; font-size: 14px; color: #4B5563; text-align: center;">${item.qty}</td>
      <td style="padding: 12px 0; font-size: 14px; color: #4B5563; text-align: right;">${formatCurrency(item.rate, currency)}</td>
      <td style="padding: 12px 0; font-size: 14px; color: #1F2937; text-align: right; font-weight: 600;">${formatCurrency(item.amount, currency)}</td>
    </tr>
  `).join('');

  const statusBadge = getStatusBadgeHtml(invoice.status);

  // Template-specific CSS styles
  let themeColor = '#1F2937';
  const fontStyle = "font-family: 'Inter', system-ui, -apple-system, sans-serif;";
  let containerStyle = 'padding: 40px;';
  let headerHtml = '';

  if (templateId === 'classic') {
    themeColor = '#1E3A8A';
    headerHtml = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid ${themeColor}; padding-bottom: 20px; margin-bottom: 30px;">
        <div style="display: flex; align-items: flex-start; gap: 14px;">
          ${getLogoHtml(business.logoUrl, 60)}
          <div>
            <h1 style="margin: 0; color: ${themeColor}; font-size: 28px; font-weight: 800;">${business.name}</h1>
            <p style="margin: 4px 0 0 0; color: #6B7280; font-size: 13px;">${business.address || ''}</p>
            <p style="margin: 2px 0 0 0; color: #6B7280; font-size: 13px;">${business.email || ''}</p>
            ${business.taxId ? `<p style="margin: 2px 0 0 0; color: #6B7280; font-size: 13px;">Tax ID: ${business.taxId}</p>` : ''}
          </div>
        </div>
        <div style="text-align: right;">
          <h2 style="margin: 0; color: #1F2937; font-size: 20px; font-weight: 700;">INVOICE</h2>
          <p style="margin: 4px 0 0 0; color: #4B5563; font-weight: 600;"># ${invoice.invoiceNumber}</p>
          <div style="margin-top: 10px;">${statusBadge}</div>
        </div>
      </div>
    `;
  } else if (templateId === 'modern') {
    themeColor = '#0284C7';
    containerStyle = 'padding: 40px; border-left: 10px solid ' + themeColor + ';';
    headerHtml = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px; align-items: flex-start;">
        <div>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
            ${getLogoHtml(business.logoUrl, 48)}
            <span style="background-color: ${themeColor}; color: white; padding: 6px 12px; border-radius: 8px; font-weight: 800; font-size: 14px; text-transform: uppercase;">${business.name}</span>
          </div>
          <p style="margin: 0; color: #4B5563; font-size: 13px; font-weight: 500; line-height: 1.5;">
            ${business.address ? `${business.address}<br/>` : ''}
            ${business.email ? `${business.email}<br/>` : ''}
            ${business.taxId ? `Tax ID: ${business.taxId}` : ''}
          </p>
        </div>
        <div style="text-align: right;">
          <h1 style="margin: 0; color: #0F172A; font-size: 32px; font-weight: 900; letter-spacing: -1px;">INVOICE</h1>
          <p style="margin: 4px 0 0 0; color: ${themeColor}; font-size: 16px; font-weight: 700;"># ${invoice.invoiceNumber}</p>
          <div style="margin-top: 15px;">${statusBadge}</div>
        </div>
      </div>
    `;
  } else if (templateId === 'minimal') {
    themeColor = '#111827';
    headerHtml = `
      <div style="margin-bottom: 50px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          ${getLogoHtml(business.logoUrl, 48)}
          <h1 style="margin: 0; color: #111827; font-size: 24px; font-weight: 400; letter-spacing: 1px; text-transform: uppercase;">${business.name}</h1>
        </div>
        <div style="height: 1px; background-color: #E5E7EB; margin: 15px 0; width: 100%;"></div>
        <table style="width: 100%;">
          <tr>
            <td style="font-size: 12px; color: #6B7280; width: 50%; vertical-align: top;">
              ${business.address || ''}<br/>
              ${business.email || ''}
            </td>
            <td style="font-size: 12px; color: #111827; width: 50%; text-align: right; vertical-align: top;">
              <strong>INVOICE NO:</strong> ${invoice.invoiceNumber}<br/>
              <strong>STATUS:</strong> ${invoice.status}<br/>
              <strong>DATE:</strong> ${formatDate(invoice.createdAt)}
            </td>
          </tr>
        </table>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          margin: 0;
          ${fontStyle}
          background-color: #ffffff;
          -webkit-print-color-adjust: exact;
        }
        * {
          box-sizing: border-box;
        }
      </style>
    </head>
    <body>
      <div style="${containerStyle}">
        ${headerHtml}

        <!-- Bill To / Invoice Dates -->
        <table style="width: 100%; margin-bottom: 40px; border-collapse: collapse;">
          <tr>
            <td style="width: 50%; vertical-align: top; padding: 0;">
              <h3 style="margin: 0 0 8px 0; color: #4B5563; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Billed To</h3>
              <p style="margin: 0; color: #1F2937; font-size: 15px; font-weight: 700;">${client.name}</p>
              ${client.address ? `<p style="margin: 4px 0 0 0; color: #4B5563; font-size: 13px;">${client.address}</p>` : ''}
              ${client.email ? `<p style="margin: 2px 0 0 0; color: #4B5563; font-size: 13px;">${client.email}</p>` : ''}
              ${client.phone ? `<p style="margin: 2px 0 0 0; color: #4B5563; font-size: 13px;">${client.phone}</p>` : ''}
            </td>
            <td style="width: 50%; vertical-align: top; text-align: right; padding: 0;">
              <div style="display: inline-block; text-align: left;">
                <table style="border-collapse: collapse;">
                  <tr>
                    <td style="padding: 2px 10px 2px 0; font-size: 13px; color: #4B5563; font-weight: 600;">Date Issued:</td>
                    <td style="padding: 2px 0; font-size: 13px; color: #1F2937; font-weight: 500;">${formatDate(invoice.createdAt)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 2px 10px 2px 0; font-size: 13px; color: #4B5563; font-weight: 600;">Due Date:</td>
                    <td style="padding: 2px 0; font-size: 13px; color: #EF4444; font-weight: 700;">${formatDate(invoice.dueDate)}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
        </table>

        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="border-bottom: 2px solid #E5E7EB;">
              <th style="padding: 12px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #4B5563; text-align: left; letter-spacing: 0.5px;">Description</th>
              <th style="padding: 12px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #4B5563; text-align: center; width: 80px; letter-spacing: 0.5px;">Qty</th>
              <th style="padding: 12px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #4B5563; text-align: right; width: 120px; letter-spacing: 0.5px;">Unit Price</th>
              <th style="padding: 12px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #4B5563; text-align: right; width: 120px; letter-spacing: 0.5px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Summary & Totals -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="width: 50%;">
            ${invoice.notes ? `
              <h3 style="margin: 0 0 6px 0; color: #4B5563; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Notes &amp; Terms</h3>
              <p style="margin: 0; color: #4B5563; font-size: 12px; line-height: 1.6; white-space: pre-line;">${invoice.notes}</p>
            ` : ''}
          </div>
          <div style="width: 40%; text-align: right;">
            <table style="width: 100%; border-collapse: collapse; margin-left: auto;">
              <tr>
                <td style="padding: 6px 0; font-size: 14px; color: #4B5563; text-align: left;">Subtotal</td>
                <td style="padding: 6px 0; font-size: 14px; color: #1F2937; text-align: right; font-weight: 500;">${formatCurrency(invoice.subtotal, currency)}</td>
              </tr>
              ${invoice.tax > 0 ? `
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #4B5563; text-align: left;">Tax</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #1F2937; text-align: right; font-weight: 500;">${formatCurrency(invoice.tax, currency)}</td>
                </tr>
              ` : ''}
              ${invoice.discount && invoice.discount > 0 ? `
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #10B981; text-align: left;">Discount</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #10B981; text-align: right; font-weight: 500;">-${formatCurrency(invoice.discount, currency)}</td>
                </tr>
              ` : ''}
              ${invoice.lateFee && invoice.lateFee > 0 ? `
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #EF4444; text-align: left;">Late Fee</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #EF4444; text-align: right; font-weight: 500;">+${formatCurrency(invoice.lateFee, currency)}</td>
                </tr>
              ` : ''}
              <tr style="border-top: 2px solid #E5E7EB;">
                <td style="padding: 12px 0; font-size: 16px; color: #1F2937; font-weight: 700; text-align: left;">Total</td>
                <td style="padding: 12px 0; font-size: 20px; color: ${themeColor}; font-weight: 800; text-align: right;">${formatCurrency(invoice.total, currency)}</td>
              </tr>
              ${invoice.amountPaid !== undefined && invoice.amountPaid > 0 ? `
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #10B981; text-align: left; font-weight: 600;">Amount Paid</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #10B981; text-align: right; font-weight: 600;">-${formatCurrency(invoice.amountPaid, currency)}</td>
                </tr>
              ` : ''}
              ${invoice.balanceDue !== undefined ? `
                <tr style="border-top: 1px solid #E5E7EB; border-bottom: 2px solid #E5E7EB;">
                  <td style="padding: 8px 0; font-size: 14px; color: #1F2937; text-align: left; font-weight: 700;">Balance Due</td>
                  <td style="padding: 8px 0; font-size: 16px; color: ${invoice.balanceDue > 0 ? '#EF4444' : '#10B981'}; font-weight: 800; text-align: right;">${formatCurrency(invoice.balanceDue, currency)}</td>
                </tr>
              ` : ''}
            </table>
          </div>
        </div>

        <div style="margin-top: 60px; text-align: center; border-top: 1px solid #F3F4F6; padding-top: 20px;">
          <p style="margin: 0; color: #9CA3AF; font-size: 11px;">Thank you for your business!</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getReceiptHtml(
  payment: PaymentData,
  invoice: InvoiceData,
  client: ClientData,
  business: BusinessProfile
): string {
  const currency = invoice.currency || 'USD';
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          margin: 0;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          background-color: #ffffff;
          padding: 40px;
          -webkit-print-color-adjust: exact;
        }
        * { box-sizing: border-box; }
      </style>
    </head>
    <body>
      <div style="border: 1px solid #E5E7EB; border-radius: 16px; padding: 30px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <!-- Header -->
        <div style="text-align: center; border-bottom: 1px solid #F3F4F6; padding-bottom: 20px; margin-bottom: 20px;">
          ${business.logoUrl ? `<div style="margin-bottom: 10px;">${getLogoHtml(business.logoUrl, 56)}</div>` : ''}
          <h1 style="margin: 0; color: #10B981; font-size: 24px; font-weight: 800;">PAYMENT RECEIPT</h1>
          <p style="margin: 5px 0 0 0; color: #4B5563; font-size: 14px; font-weight: 600;"># ${invoice.invoiceNumber}</p>
        </div>

        <!-- Details -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
          <tr>
            <td style="padding: 8px 0; font-size: 13px; color: #4B5563;">Received From</td>
            <td style="padding: 8px 0; font-size: 13px; color: #1F2937; text-align: right; font-weight: 700;">${client.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-size: 13px; color: #4B5563;">Paid To</td>
            <td style="padding: 8px 0; font-size: 13px; color: #1F2937; text-align: right; font-weight: 600;">${business.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-size: 13px; color: #4B5563;">Date of Payment</td>
            <td style="padding: 8px 0; font-size: 13px; color: #1F2937; text-align: right;">${formatDate(payment.date)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-size: 13px; color: #4B5563;">Payment Method</td>
            <td style="padding: 8px 0; font-size: 13px; color: #1F2937; text-align: right; text-transform: uppercase; font-weight: 500;">${payment.method}</td>
          </tr>
          ${payment.reference ? `
            <tr>
              <td style="padding: 8px 0; font-size: 13px; color: #4B5563;">Reference # / Note</td>
              <td style="padding: 8px 0; font-size: 13px; color: #1F2937; text-align: right;">${payment.reference}</td>
            </tr>
          ` : ''}
        </table>

        <!-- Amount -->
        <div style="background-color: #ECFDF5; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
          <p style="margin: 0; color: #065F46; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Amount Paid</p>
          <h2 style="margin: 5px 0 0 0; color: #059669; font-size: 32px; font-weight: 800;">${formatCurrency(payment.amount, currency)}</h2>
        </div>

        <!-- Footer -->
        <div style="text-align: center; font-size: 11px; color: #9CA3AF; margin-top: 30px;">
          <p style="margin: 0;">This is an official receipt of payment.</p>
          <p style="margin: 4px 0 0 0;">If you have any questions, please contact ${business.email || 'the sender'}.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function resolveLogoUrl(logoUrl?: string): Promise<string | undefined> {
  if (!logoUrl) return undefined;
  if (logoUrl.startsWith('data:')) return logoUrl;
  if (logoUrl.startsWith('file://') || logoUrl.startsWith('content://')) {
    try {
      const info = await FileSystem.getInfoAsync(logoUrl);
      if (!info.exists) {
        console.warn('Local logo file does not exist at path:', logoUrl);
        return undefined;
      }
      const base64 = await FileSystem.readAsStringAsync(logoUrl, { encoding: 'base64' });
      const ext = logoUrl.split('.').pop()?.toLowerCase();
      const mime = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
      return `data:${mime};base64,${base64}`;
    } catch (err) {
      console.warn('Failed to resolve local logo URL to base64:', err);
      return undefined;
    }
  }
  return logoUrl;
}

export async function generateInvoicePDF(
  invoice: InvoiceData,
  client: ClientData,
  business: BusinessProfile,
  templateId: 'classic' | 'modern' | 'minimal' = 'classic'
): Promise<string> {
  const resolvedLogo = await resolveLogoUrl(business.logoUrl);
  const businessWithLogo = { ...business, logoUrl: resolvedLogo };
  const html = getInvoiceHtml(invoice, client, businessWithLogo, templateId);
  try {
    const result = await Print.printToFileAsync({ html, base64: false });
    return result.uri;
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
}

export async function generateReceiptPDF(
  payment: PaymentData,
  invoice: InvoiceData,
  client: ClientData,
  business: BusinessProfile
): Promise<string> {
  const resolvedLogo = await resolveLogoUrl(business.logoUrl);
  const businessWithLogo = { ...business, logoUrl: resolvedLogo };
  const html = getReceiptHtml(payment, invoice, client, businessWithLogo);
  try {
    const result = await Print.printToFileAsync({ html, base64: false });
    return result.uri;
  } catch (error) {
    console.error('Error generating receipt PDF:', error);
    throw new Error('Failed to generate receipt PDF. Please try again.');
  }
}

export async function shareInvoicePDF(
  invoice: InvoiceData,
  client: ClientData,
  business: BusinessProfile,
  templateId: 'classic' | 'modern' | 'minimal' = 'classic'
): Promise<void> {
  const resolvedLogo = await resolveLogoUrl(business.logoUrl);
  const businessWithLogo = { ...business, logoUrl: resolvedLogo };
  const html = getInvoiceHtml(invoice, client, businessWithLogo, templateId);
  const prefix = `Invoice_${invoice.invoiceNumber}`;
  await executeShare(html, prefix);
}

export async function shareReceiptPDF(
  payment: PaymentData,
  invoice: InvoiceData,
  client: ClientData,
  business: BusinessProfile
): Promise<void> {
  const resolvedLogo = await resolveLogoUrl(business.logoUrl);
  const businessWithLogo = { ...business, logoUrl: resolvedLogo };
  const html = getReceiptHtml(payment, invoice, client, businessWithLogo);
  const prefix = `Receipt_${invoice.invoiceNumber}`;
  await executeShare(html, prefix);
}

async function executeShare(html: string, filenamePrefix: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      await Print.printAsync({ html });
      return;
    }

    // Tier 1: Try to generate PDF file locally without base64 to avoid memory strain
    let result;
    try {
      result = await Print.printToFileAsync({ html, base64: false });
    } catch (printError) {
      console.warn('printToFileAsync failed, falling back to print dialog:', printError);
      await Print.printAsync({ html });
      return;
    }

    // Tier 2: Try to copy it to a friendly filename in cacheDirectory
    const cleanPrefix = filenamePrefix.replace(/[^a-zA-Z0-9_]/g, '_');
    const safeFilename = `${cleanPrefix}_${Date.now()}.pdf`;
    const safeUri = `${FileSystem.cacheDirectory}${safeFilename}`;

    let shareUri = result.uri;
    try {
      await FileSystem.copyAsync({
        from: result.uri,
        to: safeUri,
      });
      shareUri = safeUri;
    } catch (copyError) {
      console.warn('Failed to copy to custom filename in cache, sharing original file:', copyError);
      shareUri = result.uri;
    }

    // Tier 3: Translate to content URI if Android to bypass security policies
    if (Platform.OS === 'android' && shareUri.startsWith('file://')) {
      try {
        shareUri = await FileSystem.getContentUriAsync(shareUri);
      } catch (contentUriError) {
        console.warn('Failed to convert to content URI, sharing file path directly:', contentUriError);
      }
    }

    // Tier 4: Share PDF using sharing library
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(shareUri, { mimeType: 'application/pdf', dialogTitle: 'Share Document' });
    } else {
      console.warn('Sharing library unavailable, falling back to print dialog.');
      await Print.printAsync({ html });
    }
  } catch (error: any) {
    console.error('Unified executeShare failed, attempting ultimate print dialog fallback:', error);
    // Tier 5: Ultimate Fallback - System Print spooler (lets user save to PDF natively or share from preview)
    try {
      await Print.printAsync({ html });
    } catch (finalError) {
      throw new Error(error?.message || 'Failed to print/share document.');
    }
  }
}

function getReportHtml(
  report: {
    totalInvoiced: number;
    totalPaid: number;
    totalOutstanding: number;
    totalOverdue: number;
    totalTax: number;
    collectionsEff: number;
    activeClients: number;
    clientEarnings: { name: string; amount: number }[];
    currency: string;
  },
  business: BusinessProfile
): string {
  const currency = report.currency || 'USD';
  const resolvedLogo = business.logoUrl ? getLogoHtml(business.logoUrl, 64) : '';
  const dateStr = formatDate(new Date().toISOString());

  // Build client ranking table rows
  const clientRows = report.clientEarnings.map((c, index) => {
    const percentage = report.totalPaid > 0 ? (c.amount / report.totalPaid) * 100 : 0;
    return `
      <tr style="border-bottom: 1px solid #E5E7EB;">
        <td style="padding: 10px; font-size: 13px; font-weight: 700; color: #1F2937; text-align: center; width: 40px;">#${index + 1}</td>
        <td style="padding: 10px; font-size: 13px; font-weight: 600; color: #1F2937;">${c.name}</td>
        <td style="padding: 10px; font-size: 13px; font-weight: 700; color: #111827; text-align: right;">${formatCurrency(c.amount, currency)}</td>
        <td style="padding: 10px; width: 150px; text-align: right;">
          <div style="background-color: #E5E7EB; width: 100px; height: 8px; border-radius: 4px; display: inline-block; overflow: hidden; vertical-align: middle;">
            <div style="background-color: #3B82F6; width: ${percentage.toFixed(0)}%; height: 100%; border-radius: 4px;"></div>
          </div>
          <span style="font-size: 11px; font-weight: 600; color: #4B5563; margin-left: 6px; display: inline-block; width: 30px; text-align: right;">${percentage.toFixed(0)}%</span>
        </td>
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Financial Report</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #1F2937;
      margin: 0;
      padding: 0;
      background-color: #FFFFFF;
    }
    .container {
      padding: 40px;
    }
    .header {
      border-bottom: 2px solid #E5E7EB;
      padding-bottom: 24px;
      margin-bottom: 30px;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
    }
    .company-details {
      vertical-align: top;
    }
    .report-meta {
      text-align: right;
      vertical-align: top;
    }
    .report-title {
      font-size: 26px;
      font-weight: 800;
      color: #1E3A8A;
      margin: 0 0 6px 0;
      letter-spacing: -0.5px;
    }
    .meta-item {
      font-size: 12px;
      color: #4B5563;
      margin-bottom: 4px;
    }
    .badge-confidential {
      background-color: #FEF3C7;
      color: #92400E;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 11px;
      display: inline-block;
      margin-top: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .kpi-grid {
      width: 100%;
      border-collapse: separate;
      border-spacing: 12px;
      margin-left: -12px;
      margin-right: -12px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background-color: #F9FAFB;
      border: 1px solid #F3F4F6;
      border-radius: 12px;
      padding: 16px;
      width: 25%;
      vertical-align: top;
    }
    .kpi-label {
      font-size: 11px;
      font-weight: 700;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }
    .kpi-value {
      font-size: 18px;
      font-weight: 800;
      color: #111827;
      margin-bottom: 4px;
    }
    .kpi-sub {
      font-size: 11px;
      color: #4B5563;
      font-weight: 500;
    }
    .kpi-overdue {
      border-left: 4px solid #EF4444;
    }
    .kpi-collected {
      border-left: 4px solid #10B981;
    }
    .section-title {
      font-size: 16px;
      font-weight: 800;
      color: #1E3A8A;
      border-bottom: 1px solid #E5E7EB;
      padding-bottom: 8px;
      margin-top: 30px;
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stats-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .stats-label {
      font-size: 13px;
      font-weight: 600;
      color: #4B5563;
      padding: 10px 0;
      width: 200px;
    }
    .stats-value {
      font-size: 13px;
      font-weight: 700;
      color: #111827;
      padding: 10px 0;
    }
    .progress-bar-container {
      background-color: #E5E7EB;
      width: 100%;
      height: 12px;
      border-radius: 6px;
      overflow: hidden;
      margin-top: 4px;
    }
    .progress-bar-fill {
      background-color: #10B981;
      height: 100%;
      border-radius: 6px;
    }
    .leaderboard-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .leaderboard-th {
      background-color: #F3F4F6;
      font-size: 11px;
      font-weight: 700;
      color: #4B5563;
      text-transform: uppercase;
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #E5E7EB;
    }
    .footer {
      border-top: 1px solid #E5E7EB;
      padding-top: 20px;
      margin-top: 60px;
      font-size: 11px;
      color: #9CA3AF;
      text-align: center;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <table class="header-table">
        <tr>
          <td class="company-details">
            ${resolvedLogo}
            <div style="font-size: 18px; font-weight: 800; color: #111827; margin-top: 8px;">${business.name}</div>
            ${business.email ? `<div class="meta-item" style="margin-top: 4px;">Email: ${business.email}</div>` : ''}
            ${business.phone ? `<div class="meta-item">Phone: ${business.phone}</div>` : ''}
            ${business.address ? `<div class="meta-item">Address: ${business.address}</div>` : ''}
            ${business.taxId ? `<div class="meta-item">Tax Registration: ${business.taxId}</div>` : ''}
          </td>
          <td class="report-meta">
            <h1 class="report-title">Financial Summary</h1>
            <div class="meta-item">Generated on: <strong>${dateStr}</strong></div>
            <div class="meta-item">Scope: <strong>Total Lifecycle</strong></div>
            <span class="badge-confidential">Internal Confidential</span>
          </td>
        </tr>
      </table>
    </div>

    <table class="kpi-grid">
      <tr>
        <td class="kpi-card" style="border-left: 4px solid #3B82F6;">
          <div class="kpi-label">Invoiced</div>
          <div class="kpi-value">${formatCurrency(report.totalInvoiced, currency)}</div>
          <div class="kpi-sub">Total billed value</div>
        </td>
        <td class="kpi-card kpi-collected">
          <div class="kpi-label">Revenue</div>
          <div class="kpi-value">${formatCurrency(report.totalPaid, currency)}</div>
          <div class="kpi-sub">Collected cashflow</div>
        </td>
        <td class="kpi-card" style="border-left: 4px solid #F59E0B;">
          <div class="kpi-label">Outstanding</div>
          <div class="kpi-value">${formatCurrency(report.totalOutstanding, currency)}</div>
          <div class="kpi-sub">Pending payments</div>
        </td>
        <td class="kpi-card kpi-overdue">
          <div class="kpi-label">Overdue</div>
          <div class="kpi-value" style="color: #EF4444;">${formatCurrency(report.totalOverdue, currency)}</div>
          <div class="kpi-sub">Breached due dates</div>
        </td>
      </tr>
    </table>

    <div class="section-title">Key Performance Indicators</div>
    <table class="stats-table">
      <tr>
        <td class="stats-label">Collection Rate</td>
        <td class="stats-value">
          <div style="font-weight: 800; font-size: 15px; color: #111827; margin-bottom: 2px;">${report.collectionsEff.toFixed(1)}%</div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${report.collectionsEff.toFixed(0)}%;"></div>
          </div>
        </td>
      </tr>
      <tr>
        <td class="stats-label">Active Billing Clients</td>
        <td class="stats-value" style="font-size: 14px;"><strong>${report.activeClients}</strong> registered clients</td>
      </tr>
      <tr>
        <td class="stats-label">Tax Liability / Collected</td>
        <td class="stats-value" style="font-size: 14px; color: #D97706;"><strong>${formatCurrency(report.totalTax, currency)}</strong></td>
      </tr>
    </table>

    <div class="section-title">Top Client Contributions</div>
    <table class="leaderboard-table">
      <thead>
        <tr>
          <th class="leaderboard-th" style="text-align: center; width: 40px;">Rank</th>
          <th class="leaderboard-th">Client Name</th>
          <th class="leaderboard-th" style="text-align: right;">Revenue Contributed</th>
          <th class="leaderboard-th" style="text-align: right; width: 150px;">Share</th>
        </tr>
      </thead>
      <tbody>
        ${clientRows || `<tr><td colspan="4" style="padding: 20px; text-align: center; color: #9CA3AF; font-size: 13px;">No client transactions found.</td></tr>`}
      </tbody>
    </table>

    <div class="footer">
      This report was generated securely on device via InvoNest mobile platform.<br/>
      &copy; ${new Date().getFullYear()} ${business.name}. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;
}

export async function shareReportPDF(
  report: {
    totalInvoiced: number;
    totalPaid: number;
    totalOutstanding: number;
    totalOverdue: number;
    totalTax: number;
    collectionsEff: number;
    activeClients: number;
    clientEarnings: { name: string; amount: number }[];
    currency: string;
  },
  business: BusinessProfile
): Promise<void> {
  const resolvedLogo = await resolveLogoUrl(business.logoUrl);
  const businessWithLogo = { ...business, logoUrl: resolvedLogo };
  const html = getReportHtml(report, businessWithLogo);
  const prefix = 'Financial_Report';
  await executeShare(html, prefix);
}