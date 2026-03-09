import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Tesseract from 'tesseract.js';
import * as sharp from 'sharp';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');

interface OCRResult {
  text: string;
  confidence: number;
  items: Array<{
    medicineName: string;
    quantity: number;
    unitPrice?: number;
    totalPrice?: number;
    mrp?: number;
    packing?: string;
    packSize?: number;
    cgst?: number;
    sgst?: number;
  }>;
  supplierInfo?: {
    name?: string;
    phone?: string;
    address?: string;
    invoiceNumber?: string;
    invoiceDate?: string;
  };
}

@Injectable()
export class OcrService {
  constructor(private configService: ConfigService) {}

  // ── Public: process image (JPEG/PNG/WebP) ─────────────────────────────────

  async processImage(imageBuffer: Buffer): Promise<OCRResult> {
    try {
      if (!imageBuffer || imageBuffer.length === 0) {
        throw new Error('Empty image buffer');
      }
      const text = await this.extractTextWithAutoRotation(imageBuffer);
      if (!text.trim()) return { text: '', confidence: 0, items: [], supplierInfo: {} };
      const parsed = this.parseIndianMedicalInvoice(text);
      return {
        text,
        confidence: parsed.items.length > 0 ? 75 : 30,
        items: parsed.items,
        supplierInfo: parsed.supplierInfo,
      };
    } catch (error) {
      console.error('Image OCR error:', error);
      return { text: '', confidence: 0, items: [], supplierInfo: {} };
    }
  }

  // ── Public: process PDF invoice ───────────────────────────────────────────

  async processPdf(pdfBuffer: Buffer): Promise<OCRResult> {
    try {
      if (!pdfBuffer || pdfBuffer.length === 0) throw new Error('Empty PDF buffer');

      // Try direct text extraction first (works for digital PDFs)
      let text = '';
      try {
        const pdfData = await pdfParse(pdfBuffer);
        text = pdfData.text || '';
      } catch (e) {
        console.warn('pdf-parse failed:', e.message);
      }

      // If no text, PDF is a scanned image — extract embedded JPEG and OCR it
      if (!text.trim()) {
        const jpeg = this.extractJpegFromPdf(pdfBuffer);
        if (jpeg) {
          text = await this.extractTextWithAutoRotation(jpeg);
        }
      }

      if (!text.trim()) return { text: '', confidence: 0, items: [], supplierInfo: {} };

      const parsed = this.parseIndianMedicalInvoice(text);
      return {
        text,
        confidence: 90,
        items: parsed.items,
        supplierInfo: parsed.supplierInfo,
      };
    } catch (error) {
      console.error('PDF processing error:', error);
      return { text: '', confidence: 0, items: [], supplierInfo: {} };
    }
  }

  // ── Auto-rotate: try 4 angles, return text with most med keywords ─────────

  private async extractTextWithAutoRotation(imageBuffer: Buffer): Promise<string> {
    const angles = [0, 90, 180, 270];
    let bestText = '';
    let bestScore = -1;

    for (const angle of angles) {
      try {
        const rotated = angle !== 0
          ? await sharp(imageBuffer).rotate(angle).toBuffer()
          : imageBuffer;
        const processed = await this.preprocessImage(rotated);
        const result = await Tesseract.recognize(processed, 'eng', { logger: () => {} });
        const text = result.data.text || '';
        const score = this.scoreMedText(text);
        if (score > bestScore) { bestScore = score; bestText = text; }
      } catch (err) {
        console.warn(`Rotation ${angle} failed:`, err.message);
      }
    }
    return bestText;
  }

  private scoreMedText(text: string): number {
    const t = text.toUpperCase();
    const kw = ['TAB','CAP','SYRUP','INJ','CREAM','VIAL','MG','ML','INVOICE','GSTIN','MRP','PHARMA','MEDICAL'];
    return kw.reduce((sum, k) => sum + (t.includes(k) ? 1 : 0), 0);
  }

  // ── Extract first embedded JPEG from a PDF buffer ─────────────────────────

  private extractJpegFromPdf(buffer: Buffer): Buffer | null {
    // JPEG: FF D8 FF ... FF D9
    let start = -1;
    for (let i = 0; i < buffer.length - 3; i++) {
      if (buffer[i] === 0xff && buffer[i + 1] === 0xd8 && buffer[i + 2] === 0xff) {
        start = i; break;
      }
    }
    if (start === -1) return null;
    let end = -1;
    for (let i = buffer.length - 2; i >= start; i--) {
      if (buffer[i] === 0xff && buffer[i + 1] === 0xd9) { end = i + 2; break; }
    }
    if (end === -1) return null;
    return buffer.slice(start, end);
  }

  // ── Image preprocessing ───────────────────────────────────────────────────

  private async preprocessImage(buf: Buffer): Promise<Buffer> {
    return sharp(buf)
      .resize(2400, null, { fit: 'inside', withoutEnlargement: false })
      .greyscale()
      .normalize()
      .sharpen({ sigma: 1.5 })
      .toBuffer();
  }

  // ── Main parser: Indian Profitmaker/Daxinsoft medical invoice ─────────────
  //
  // Line format after medicine name + packing:
  //   [HSN 8-digit] [BATCH alphanum] [EXP MM/YY] QTY FREE RATE DIS%(4.0) MRP OLD_MRP
  //   GST%(2.5) CGST_AMT GST%(2.5) SGST_AMT TOTAL
  //
  // Key invariants used for parsing:
  //   1. DIS% is always 4.0 and is followed by MRP which must be >= RATE
  //   2. TOTAL = qty * rate * (1 - DIS/100) * (1 + GST/100) = qty * rate * 0.96 * 1.05
  //   3. qty is derived from: round(TOTAL / (RATE * 0.96 * 1.05))

  private parseIndianMedicalInvoice(text: string): {
    items: OCRResult['items'];
    supplierInfo: OCRResult['supplierInfo'];
  } {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const items: OCRResult['items'] = [];
    const supplierInfo: OCRResult['supplierInfo'] = {};

    // ── Header extraction (first 10 lines) ──────────────────────────────────
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i];
      const invMatch = line.match(/inv(?:oice)?\s*no[:\s]+([A-Z0-9\-\/]+)/i);
      if (invMatch && !supplierInfo.invoiceNumber) supplierInfo.invoiceNumber = invMatch[1].trim();

      const dateMatch = line.match(/inv(?:oice)?\s*date[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
      if (dateMatch && !supplierInfo.invoiceDate) supplierInfo.invoiceDate = dateMatch[1];

      const phoneMatch = line.match(/(?:ph(?:one)?|mob(?:ile)?)[:\s#]*(?:\+?91[-\s]?)?([6-9]\d{9})/i);
      if (phoneMatch && !supplierInfo.phone) supplierInfo.phone = phoneMatch[1];

      if (!supplierInfo.name && line.length > 5 && !/^\d/.test(line)
        && !/^(gst|inv|d\.no|pan|gstin|dl no)/i.test(line)) {
        supplierInfo.name = line.replace(/\|.*$/, '').trim();
      }
    }

    // ── Line item parsing ────────────────────────────────────────────────────
    const SKIP = /^(sl|s\.no|product|name|qty|quantity|price|rate|amount|mfg|packing|hsn|batch|exp|total|note|software|cgst|sgst|subtotal|less|net pay|five|the\s|e\.\&|subject)/i;

    for (const line of lines) {
      if (SKIP.test(line)) continue;
      if (line.length < 15) continue;

      // Strip leading manufacturer prefix: "GEM |", "GSK |", "STEA|", "abot]", "US ", "RE ", "LIFE]", "AL "
      const stripped = line.replace(/^[A-Za-z]{1,5}[\s]*[|\]]\s*/i, '').trim();

      // Find packing token (e.g. 1*10S, 1*15S, 1*1VIA, 1*30ML, 1*100S, 1*10G)
      const packMatch = stripped.match(/^(.+?)\s+(1\*[\w]+)\s/i);
      if (!packMatch) continue;

      const medicineName = this.cleanName(packMatch[1]);
      const packing = packMatch[2];
      const after = stripped.slice(packMatch[0].length);

      if (!medicineName || medicineName.length < 3) continue;

      const parsed = this.parseAfterPacking(after);
      if (!parsed) continue;

      // Extract pack size from packing string (e.g., "1*10S" → 10, "1*15S" → 15)
      const packSizeMatch = packing.match(/1\*(\d+)/i);
      const packSize = packSizeMatch ? parseInt(packSizeMatch[1], 10) : undefined;

      items.push({
        medicineName,
        packing,
        packSize,
        quantity: parsed.quantity,
        unitPrice: parsed.unitPrice,
        mrp: parsed.mrp,
        cgst: parsed.cgst,
        sgst: parsed.sgst,
        totalPrice: parsed.totalPrice,
      });
    }

    return { items, supplierInfo };
  }

  // Parse the numeric columns after the packing token
  private parseAfterPacking(after: string): {
    quantity: number;
    unitPrice: number;
    mrp: number | undefined;
    totalPrice: number;
    cgst: number | undefined;
    sgst: number | undefined;
  } | null {
    // Fix common OCR noise
    let s = after;
    s = s.replace(/(\d)\.\s+(\d)/g, '$1.$2');   // "2. 89" → "2.89"
    s = s.replace(/~(\d)/g, '$1');               // "~5" → "5"
    s = s.replace(/"(\d)/g, '$1');               // '"4' → '4'
    s = s.replace(/(\d),\s*(\d)/g, '$1.$2');     // "3, 9" → "3.9"
    s = s.replace(/NET/g, ' 0.0 ');              // "NET" free → 0.0
    
    // CRITICAL FIX: OCR often reads decimal points as hyphens
    // Convert patterns like "217-61" → "217.61" (but only for likely decimals, not batch codes)
    // Match: digit(s)-digit(s) where second part is 1-3 digits at word boundaries
    s = s.replace(/(\d+)-(\d{1,3})(?=\s|$|\)|\]|\||,)/g, '$1.$2');

    const raw = s.match(/\d+(?:\.\d+)?/g) || [];
    const nums = raw.map(n => parseFloat(n)).filter(n => n < 9_999_999);

    if (nums.length < 5) return null;

    const total = nums[nums.length - 1];

    // DIS% is 4.0. Valid DIS% candidate must:
    //   - be ~4.0
    //   - have nums[di-1] as rate: 3 < rate < 5000
    //   - have nums[di+1] as MRP: MRP >= rate (always true in Indian invoices)
    //   - math check: total / (rate * 0.96 * 1.05) rounds to integer 1..500

    const FACTOR = 0.96 * 1.05; // 4% discount, 5% GST (standard for this invoice)

    // Try from rightmost 4.0 candidate (closer to the correct columns)
    const disCandidates = nums
      .map((n, i) => ({ n, i }))
      .filter(({ n }) => Math.abs(n - 4.0) < 0.06)
      .reverse();

    for (const { i: di } of disCandidates) {
      if (di < 1 || di + 1 >= nums.length) continue;

      const rate = nums[di - 1];
      
      // MRP can be at di+1 or di+2 (calculated price vs actual printed MRP)
      // Pick the larger value >= rate
      let mrp = nums[di + 1];
      if (di + 2 < nums.length && nums[di + 2] > mrp && nums[di + 2] >= rate) {
        mrp = nums[di + 2];
      }

      if (rate < 3 || rate >= 5000) continue;
      if (mrp < rate) continue;  // MRP must be >= rate

      const qtyExact = total / (rate * FACTOR);
      let qty = Math.round(qtyExact);

      // Handle half-pack-free case (e.g. OXIPOD: effective 4.5 packs billed)
      if (Math.abs(qtyExact - qty) > 0.25) {
        const floor = Math.floor(qtyExact);
        if (Math.abs(qtyExact - floor - 0.5) < 0.12) {
          qty = floor; // e.g. 4.50 → qty=4 (4 ordered, 0.5 free)
        } else {
          continue;
        }
      }

      if (qty < 1 || qty > 500) continue;

      // Calculate CGST and SGST from the math instead of relying on column positions
      // (OCR noise makes positional extraction unreliable)
      // Formula: total = (qty × rate × (1 - disc%)) + CGST + SGST
      // Where: base = qty × rate × 0.96, and CGST = SGST = (total - base) / 2
      const baseAmount = qty * rate * (1 - 0.04); // After 4% discount
      const totalGst = total - baseAmount;
      const cgst = totalGst / 2;
      const sgst = totalGst / 2;

      return { quantity: qty, unitPrice: rate, mrp, totalPrice: total, cgst, sgst };
    }

    return null;
  }

  private cleanName(raw: string): string {
    return raw
      .replace(/[|)\]]/g, ' ')
      .replace(/[^A-Za-z0-9 \-\/\.]/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .substring(0, 80);
  }
}
