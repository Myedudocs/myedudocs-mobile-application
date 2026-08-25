import { Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { logoBase64 } from './logoAsset';

export interface InvoiceData {
  studentName: string;
  email: string;
  courseTitle: string;
  amount: string;          // e.g. "₹4,999" or "4999"
  orderId: string;
  date: string;
  transactionId: string;
  paymentMethod: string;
  upiRef: string;
  status: string;          // "SUCCESS" or "FAILED"
  subtotal: string;
  discount: string;
  tax: string;
}

// --------------------------------------------------------
// BASE64 DECODER & ENCODER HELPERS (Hermes compatible)
// --------------------------------------------------------
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function uint8ToBase64(uint8: Uint8Array): string {
  let result = '';
  const len = uint8.length;
  for (let i = 0; i < len; i += 3) {
    const b1 = uint8[i];
    const b2 = i + 1 < len ? uint8[i + 1] : NaN;
    const b3 = i + 2 < len ? uint8[i + 2] : NaN;
    
    const enc1 = b1 >> 2;
    const enc2 = ((b1 & 3) << 4) | (isNaN(b2) ? 0 : b2 >> 4);
    const enc3 = isNaN(b2) ? 64 : ((b2 & 15) << 2) | (isNaN(b3) ? 0 : b3 >> 6);
    const enc4 = isNaN(b3) ? 64 : b3 & 63;
    
    result += CHARS.charAt(enc1) + CHARS.charAt(enc2) +
              (enc3 === 64 ? '=' : CHARS.charAt(enc3)) +
              (enc4 === 64 ? '=' : CHARS.charAt(enc4));
  }
  return result;
}

function base64ToUint8Array(b64: string): Uint8Array {
  const lookup = new Uint8Array(256);
  for (let i = 0; i < CHARS.length; i++) {
    lookup[CHARS.charCodeAt(i)] = i;
  }
  
  const cleanB64 = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const len = cleanB64.length;
  const bytesLen = Math.floor((len * 3) / 4);
  const arr = new Uint8Array(bytesLen);
  
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const w1 = lookup[cleanB64.charCodeAt(i)];
    const w2 = lookup[cleanB64.charCodeAt(i + 1)];
    const w3 = i + 2 < len ? lookup[cleanB64.charCodeAt(i + 2)] : 0;
    const w4 = i + 3 < len ? lookup[cleanB64.charCodeAt(i + 3)] : 0;
    
    arr[p++] = (w1 << 2) | (w2 >> 4);
    if (p < bytesLen) arr[p++] = ((w2 & 15) << 4) | (w3 >> 2);
    if (p < bytesLen) arr[p++] = ((w3 & 3) << 6) | w4;
  }
  return arr;
}

// --------------------------------------------------------
// BYTE STREAM BUILDER
// Helper class to compile a mixture of ASCII and binary blocks
// --------------------------------------------------------
class ByteArrayBuilder {
  private chunks: Uint8Array[] = [];
  private totalLength = 0;
  
  appendString(str: string) {
    const arr = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      arr[i] = str.charCodeAt(i) & 0xff;
    }
    this.chunks.push(arr);
    this.totalLength += arr.length;
  }
  
  appendBytes(bytes: Uint8Array) {
    this.chunks.push(bytes);
    this.totalLength += bytes.length;
  }
  
  getOffset(): number {
    return this.totalLength;
  }
  
  build(): Uint8Array {
    const result = new Uint8Array(this.totalLength);
    let offset = 0;
    for (const chunk of this.chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }
}

// --------------------------------------------------------
// INVOICE PDF GENERATOR
// Writes a byte-perfect PDF 1.4 document from scratch
// --------------------------------------------------------
export const generateInvoicePDFBytes = (data: InvoiceData): Uint8Array => {
  // Normalize currencies to use 'INR' instead of '₹'
  const cleanVal = (val: string) => {
    if (!val) return 'INR 0';
    const clean = val.replace(/[₹\s,]/g, '');
    const num = parseFloat(clean);
    if (isNaN(num)) return val.replace('₹', 'INR ');
    return `INR ${num.toLocaleString('en-IN')}`;
  };

  const amountClean = cleanVal(data.amount);
  const subtotalClean = cleanVal(data.subtotal);
  const discountClean = data.discount && data.discount !== '₹0' ? cleanVal(data.discount) : null;
  const taxClean = cleanVal(data.tax);
  
  const studentName = data.studentName || 'Student';
  const email = data.email || '';
  const courseTitle = data.courseTitle || 'Purchased Course/Item';
  const orderId = data.orderId || 'N/A';
  const dateStr = data.date || new Date().toLocaleDateString();
  const transactionId = data.transactionId || 'N/A';
  const paymentMethod = data.paymentMethod || 'Online';
  const upiRef = data.upiRef || 'N/A';
  const isSuccess = data.status === 'SUCCESS';

  // --- DRAWING COMMANDS STREAM ---
  let stream = '';

  // Helpers to structure drawing commands
  const drawText = (text: string, x: number, y: number, size: number, isBold = false, r = 0.059, g = 0.09, b = 0.165) => {
    const font = isBold ? '/F2' : '/F1';
    const escaped = text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    return `BT\n  ${font} ${size} Tf\n  ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg\n  ${x} ${y} Td\n  (${escaped}) Tj\nET\n`;
  };

  const drawLine = (x1: number, y1: number, x2: number, y2: number, width = 1, r = 0.886, g = 0.91, b = 0.941) => {
    return `q\n  ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG\n  ${width} w\n  ${x1} ${y1} m\n  ${x2} ${y2} l\n  S\nQ\n`;
  };

  const drawRect = (x: number, y: number, w: number, h: number, r = 0.973, g = 0.980, b = 0.988, isStroke = false) => {
    const op = isStroke ? 'S' : 'f';
    const colorOp = isStroke ? 'RG' : 'rg';
    return `q\n  ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} ${colorOp}\n  ${x} ${y} ${w} ${h} re\n  ${op}\nQ\n`;
  };

  // --- 1. HEADER ACCENT STRIP ---
  stream += drawRect(0, 812, 595, 30, 0.388, 0.400, 0.965);

  // --- 2. LOGO IMAGE & BRANDING ---
  // Draw the real logo image (points to resource /I1, scaled to 45x45 at x=50, y=740)
  stream += `q\n  45 0 0 45 50 740 cm\n  /I1 Do\nQ\n`;
  
  // Brand Text
  stream += drawText('MyEduDocs', 105, 765, 18, true, 0.059, 0.090, 0.165);
  stream += drawText('ACADEMY', 105, 750, 9, true, 0.388, 0.400, 0.965);
  stream += drawText('A unit of MyEdudocs LLP', 105, 738, 8, false, 0.392, 0.455, 0.545);
  stream += drawText('GSTIN: 07AAHCM1234A1Z1', 105, 726, 8, false, 0.392, 0.455, 0.545);

  // --- 3. INVOICE TITLE & METADATA (Right-aligned layout) ---
  stream += drawText('TAX INVOICE', 360, 765, 22, true, 0.059, 0.090, 0.165);
  stream += drawText(`Invoice No: INV-${orderId.slice(-6).toUpperCase()}`, 360, 748, 9, false, 0.392, 0.455, 0.545);
  stream += drawText(`Date: ${dateStr}`, 360, 734, 9, false, 0.392, 0.455, 0.545);

  // Separator below header
  stream += drawLine(50, 705, 545, 705, 0.75, 0.886, 0.91, 0.941);

  // --- 4. BILL TO vs PAYMENT DETAILS ---
  // Bill To (Left Column)
  stream += drawText('BILL TO', 50, 675, 9, true, 0.392, 0.455, 0.545);
  stream += drawText(studentName, 50, 658, 11, true, 0.059, 0.090, 0.165);
  if (email) {
    stream += drawText(email, 50, 642, 9, false, 0.392, 0.455, 0.545);
  }

  // Payment details (Right Column)
  stream += drawText('PAYMENT DETAILS', 320, 675, 9, true, 0.392, 0.455, 0.545);
  stream += drawText(`Transaction ID: ${transactionId}`, 320, 658, 9, false, 0.059, 0.090, 0.165);
  stream += drawText(`Method: ${paymentMethod}`, 320, 644, 9, false, 0.059, 0.090, 0.165);
  stream += drawText(`UPI Ref: ${upiRef}`, 320, 630, 9, false, 0.059, 0.090, 0.165);

  // Status Badge
  if (isSuccess) {
    // Light Green Badge
    stream += drawRect(320, 605, 55, 15, 0.863, 0.980, 0.902);
    stream += drawText('PAID', 334, 609, 8, true, 0.063, 0.725, 0.506);
  } else {
    // Light Red Badge
    stream += drawRect(320, 605, 55, 15, 0.992, 0.878, 0.878);
    stream += drawText('FAILED', 329, 609, 8, true, 0.863, 0.149, 0.149);
  }

  // --- 5. ITEMS TABLE ---
  // Table Header Background
  stream += drawRect(50, 540, 495, 24, 0.941, 0.957, 0.973);
  stream += drawText('DESCRIPTION', 60, 548, 9, true, 0.392, 0.455, 0.545);
  stream += drawText('QTY', 380, 548, 9, true, 0.392, 0.455, 0.545);
  stream += drawText('TOTAL', 480, 548, 9, true, 0.392, 0.455, 0.545);

  // Table Row
  stream += drawText(courseTitle, 60, 510, 10, true, 0.059, 0.090, 0.165);
  stream += drawText('1', 385, 510, 10, false, 0.059, 0.090, 0.165);
  stream += drawText(subtotalClean, 480, 510, 10, true, 0.059, 0.090, 0.165);

  // Row Divider Line
  stream += drawLine(50, 495, 545, 495, 0.5, 0.886, 0.91, 0.941);

  // --- 6. CALCULATIONS SUMMARY BLOCK ---
  // Subtotal
  stream += drawText('Subtotal', 320, 460, 10, false, 0.392, 0.455, 0.545);
  stream += drawText(subtotalClean, 480, 460, 10, false, 0.059, 0.090, 0.165);

  let currentY = 440;

  // Discount (only if it exists and is not zero)
  if (discountClean && discountClean !== 'INR 0' && discountClean !== 'INR 0.00') {
    stream += drawText('Discount', 320, currentY, 10, false, 0.392, 0.455, 0.545);
    stream += drawText(discountClean, 480, currentY, 10, false, 0.063, 0.725, 0.506);
    currentY -= 20;
  }

  // Tax
  stream += drawText('Tax (GST 18%)', 320, currentY, 10, false, 0.392, 0.455, 0.545);
  stream += drawText(taxClean, 480, currentY, 10, false, 0.059, 0.090, 0.165);
  currentY -= 50;

  // Grand Total Banner Box
  stream += drawRect(320, currentY, 225, 34, 0.388, 0.400, 0.965);
  stream += drawText('GRAND TOTAL', 335, currentY + 12, 10, true, 1.0, 1.0, 1.0);
  stream += drawText(amountClean, 460, currentY + 12, 12, true, 1.0, 1.0, 1.0);

  // --- 7. FOOTER SECTION ---
  // Footer Line
  stream += drawLine(50, 160, 545, 160, 0.5, 0.886, 0.91, 0.941);
  // Info text (centered roughly)
  stream += drawText('This is a computer-generated invoice and does not require a physical signature.', 110, 135, 8, false, 0.392, 0.455, 0.545);
  stream += drawText('Thank you for choosing MyEduDocs Academy!', 185, 115, 10, true, 0.388, 0.400, 0.965);

  // Decode the logo JPEG bytes from base64
  const logoBytes = base64ToUint8Array(logoBase64);

  // --- BUILD THE PDF DIRECT STRUCTURE USING BYTEARRAYBUILDER ---
  const builder = new ByteArrayBuilder();
  
  builder.appendString('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  const offsets: number[] = [];
  
  // Object 1: Catalog
  offsets.push(builder.getOffset());
  builder.appendString('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  
  // Object 2: Pages list
  offsets.push(builder.getOffset());
  builder.appendString('2 0 obj\n<< /Type /Pages /Kids [ 3 0 R ] /Count 1 >>\nendobj\n');
  
  // Object 3: Page resource links (includes Font F1/F2 and XObject image I1)
  offsets.push(builder.getOffset());
  builder.appendString('3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R /F2 5 0 R >> /XObject << /I1 7 0 R >> >> /MediaBox [ 0 0 595 842 ] /Contents 6 0 R >>\nendobj\n');
  
  // Object 4: Regular Helvetica Font
  offsets.push(builder.getOffset());
  builder.appendString('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');
  
  // Object 5: Bold Helvetica Font
  offsets.push(builder.getOffset());
  builder.appendString('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n');
  
  // Object 6: Stream Contents
  offsets.push(builder.getOffset());
  builder.appendString(`6 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`);
  
  // Object 7: Image resource
  offsets.push(builder.getOffset());
  builder.appendString(`7 0 obj\n<< /Type /XObject /Subtype /Image /Width 150 /Height 150 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logoBytes.length} >>\nstream\n`);
  builder.appendBytes(logoBytes);
  builder.appendString('\nendstream\nendobj\n');
  
  // Cross-Reference Table
  const startXref = builder.getOffset();
  builder.appendString(`xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`);
  for (let i = 0; i < offsets.length; i++) {
    const offsetStr = String(offsets[i]).padStart(10, '0');
    builder.appendString(`${offsetStr} 00000 n \n`);
  }
  
  // Trailer & EOF
  builder.appendString(`trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`);
  
  return builder.build();
};

export const generateAndOpenInvoice = async (data: InvoiceData): Promise<string> => {
  try {
    const pdfBytes = generateInvoicePDFBytes(data);
    const base64Pdf = uint8ToBase64(pdfBytes);
    
    // Save to Cache Directory
    const fileName = `receipt_${data.orderId || Date.now()}.pdf`;
    const path = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${fileName}`;
    
    await ReactNativeBlobUtil.fs.writeFile(path, base64Pdf, 'base64');
    
    // Open the PDF using system viewer
    if (Platform.OS === 'android') {
      await ReactNativeBlobUtil.android.actionViewIntent(path, 'application/pdf');
    } else {
      await ReactNativeBlobUtil.ios.previewDocument(path);
    }
    
    return path;
  } catch (error) {
    console.error('Failed to generate/open invoice:', error);
    throw error;
  }
};
