import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Tesseract from 'tesseract.js';
import * as sharp from 'sharp';

interface OCRResult {
  text: string;
  confidence: number;
  items: Array<{
    medicineName: string;
    quantity: number;
    unitPrice?: number;
    totalPrice?: number;
  }>;
  supplierInfo?: {
    name?: string;
    phone?: string;
    address?: string;
    invoiceNumber?: string;
  };
}

@Injectable()
export class OcrService {
  constructor(private configService: ConfigService) {}

  // Process image with OCR
  async processImage(imageBuffer: Buffer): Promise<OCRResult> {
    try {
      // Validate input
      if (!imageBuffer || imageBuffer.length === 0) {
        throw new Error('Invalid image buffer provided');
      }

      // Preprocess image for better OCR
      const processedImage = await this.preprocessImage(imageBuffer);

      // Perform OCR using Tesseract
      const result = await Tesseract.recognize(processedImage, 'eng', {
        logger: info => {
          // Only log important messages to avoid spam
          if (info.status === 'error' || info.status === 'completed') {
            console.log('Tesseract:', info);
          }
        },
      });

      const rawText = result.data.text;
      const confidence = result.data.confidence;

      // Check if OCR confidence is too low
      if (confidence < 30) {
        console.warn(`Low OCR confidence: ${confidence}%`);
      }

      // Parse the OCR text
      const parsedData = this.parseOrderText(rawText);

      // Validate parsed data
      if (!parsedData.items || parsedData.items.length === 0) {
        console.warn('No items found in OCR result');
      }

      return {
        text: rawText,
        confidence,
        items: parsedData.items || [],
        supplierInfo: parsedData.supplierInfo || {},
      };
    } catch (error) {
      console.error('OCR processing error:', error);
      
      // Return a fallback result instead of throwing
      return {
        text: '',
        confidence: 0,
        items: [],
        supplierInfo: {},
      };
    }
  }

  // Preprocess image for better OCR accuracy
  private async preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
    return sharp(imageBuffer)
      .resize(2000, null, { // Increase resolution
        fit: 'inside',
        withoutEnlargement: false,
      })
      .greyscale() // Convert to grayscale
      .normalize() // Normalize contrast
      .sharpen() // Sharpen image
      .threshold(128) // Binary threshold
      .toBuffer();
  }

  // Parse OCR text to extract order information
  private parseOrderText(text: string): {
    items: Array<any>;
    supplierInfo: any;
  } {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    const items: Array<any> = [];
    const supplierInfo: any = {};

    // Try to extract supplier information from first few lines
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i].trim();
      
      // Extract phone numbers
      const phoneMatch = line.match(/(\+?91[-\s]?)?[6-9]\d{9}/);
      if (phoneMatch && !supplierInfo.phone) {
        supplierInfo.phone = phoneMatch[0];
      }

      // Extract invoice number
      const invoiceMatch = line.match(/(?:invoice|inv|bill)[\s#:]*([A-Z0-9\-\/]+)/i);
      if (invoiceMatch && !supplierInfo.invoiceNumber) {
        supplierInfo.invoiceNumber = invoiceMatch[1];
      }

      // First non-numeric line might be supplier name
      if (!supplierInfo.name && line.length > 5 && !/^\d+/.test(line)) {
        supplierInfo.name = line;
      }
    }

    // Parse medicine items
    // Common patterns found in Indian medical invoices:
    // "BECOSULES CAP 10X10 100 2400.00"
    // "DEXTROMETHORPHAN SYRUP 100ML 1 60.00 60.00"
    // "AZITHROMYCIN 500MG 3 150.00 450.00"
    // "DOLO 650MG TAB 10 25.00 250.00"
    // "1. Medicine Name 100 25.50 2550.00"
    // "Medicine Name Qty:100 Price:25.50"

    for (const line of lines) {
      // Skip header-like lines
      if (/^(sl|s\.no|item|medicine|product|name|qty|quantity|price|amount)/i.test(line)) {
        continue;
      }

      // Pattern 1: Medicine Name with strength/pack, Quantity, Unit Price, Total
      // Matches: "BECOSULES CAP 10X10 100 2400.00" or "AZITHROMYCIN 500MG 3 150.00 450.00"
      const pattern1 = /^(.+?\s+(?:TAB|CAP|SYRUP|INJ|SYP|CREAM|OINT|DROP|GEL|POWDER|SPRAY|PATCH)\s*[A-Z0-9\.\-X]*)?\s*(.+?)\s+(\d{1,4})\s+(\d+(?:\.\d{1,2})?)\s+(\d+(?:\.\d{1,2})?)$/;
      const match1 = line.match(pattern1);
      
      if (match1) {
        const medicineName = (match1[1] || '') + (match1[2] || '');
        items.push({
          medicineName: this.cleanMedicineName(medicineName),
          quantity: parseInt(match1[3]),
          unitPrice: parseFloat(match1[4]),
          totalPrice: parseFloat(match1[5]),
        });
        continue;
      }

      // Pattern 2: Medicine Name, Quantity, Price (no total)
      // Matches: "DOLO 650MG TAB 10 25.00" or "PARACETAMOL 500MG 5 45.50"
      const pattern2 = /^(.+?\s+(?:TAB|CAP|SYRUP|INJ|SYP|CREAM|OINT|DROP|GEL|POWDER|SPRAY|PATCH)\s*[A-Z0-9\.\-X]*)?\s*(.+?)\s+(\d{1,4})\s+(\d+(?:\.\d{1,2})?)$/;
      const match2 = line.match(pattern2);
      
      if (match2) {
        const medicineName = (match2[1] || '') + (match2[2] || '');
        const quantity = parseInt(match2[3]);
        const unitPrice = parseFloat(match2[4]);
        items.push({
          medicineName: this.cleanMedicineName(medicineName),
          quantity: quantity,
          unitPrice: unitPrice,
          totalPrice: quantity * unitPrice,
        });
        continue;
      }

      // Pattern 3: Medicine Name with strength, Quantity only
      // Matches: "BECOSULES CAP 10X10 100" or "DOLO 650MG TAB 10"
      const pattern3 = /^(.+?\s+(?:TAB|CAP|SYRUP|INJ|SYP|CREAM|OINT|DROP|GEL|POWDER|SPRAY|PATCH)\s*[A-Z0-9\.\-X]*)?\s*(.+?)\s+(\d{1,4})$/;
      const match3 = line.match(pattern3);
      
      if (match3) {
        const medicineName = (match3[1] || '') + (match3[2] || '');
        const quantity = parseInt(match3[3]);
        if (quantity > 0 && quantity < 10000) {
          items.push({
            medicineName: this.cleanMedicineName(medicineName),
            quantity: quantity,
          });
        }
        continue;
      }

      // Pattern 4: Medicine Name Qty:X Price:Y format
      const pattern4 = /^(.+?)\s+(?:qty|quantity)[:\s]+(\d+)(?:\s+(?:price|rate|@)[:\s]+(\d+(?:\.\d{1,2})?))?/i;
      const match4 = line.match(pattern4);
      
      if (match4) {
        items.push({
          medicineName: this.cleanMedicineName(match4[1]),
          quantity: parseInt(match4[2]),
          unitPrice: match4[3] ? parseFloat(match4[3]) : undefined,
        });
        continue;
      }

      // Pattern 5: Simple format - medicine name and quantity
      const pattern5 = /^(.+?)\s+(\d{1,4})(?:\s+(?:nos|pcs|units?|tabs?|caps?))?$/i;
      const match5 = line.match(pattern5);
      
      if (match5 && parseInt(match5[2]) > 0 && parseInt(match5[2]) < 10000) {
        const medicineName = this.cleanMedicineName(match5[1]);
        if (medicineName.length > 3) { // Avoid single chars
          items.push({
            medicineName,
            quantity: parseInt(match5[2]),
          });
        }
      }
    }

    // Filter out poor quality results
    const filteredItems = items.filter(item => {
      const name = item.medicineName.trim();
      
      // Remove items with very short or meaningless names
      if (name.length < 3) return false;
      
      // Remove items with only single characters repeated
      if (/^[a-zA-Z\s]+$/.test(name) && name.split(' ').filter(w => w.length > 1).length === 0) return false;
      
      // Remove items with too many special characters or random patterns
      const specialCharRatio = (name.match(/[^\w\s]/g) || []).length / name.length;
      if (specialCharRatio > 0.3) return false;
      
      // Remove items that are just random letters
      if (/^[a-zA-Z\s]+$/.test(name) && name.length < 10 && Math.random() > 0.5) {
        // Check if it looks like a real medicine name (has some consonants and vowels)
        const hasVowels = /[aeiouAEIOU]/.test(name);
        const hasConsonants = /[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/.test(name);
        if (!hasVowels || !hasConsonants) return false;
      }
      
      return true;
    });

    return { items: filteredItems, supplierInfo };
  }

  // Clean medicine name
  private cleanMedicineName(name: string): string {
    return name
      .replace(/^\d+\.?\s*/, '') // Remove leading numbers
      .replace(/\s+(?:TAB|CAP|SYRUP|INJ|SYP|CREAM|OINT|DROP|GEL|POWDER|SPRAY|PATCH)\s*[A-Z0-9\.\-X]*$/i, '') // Remove dosage form at end
      .replace(/[^\w\s\-()]/g, '') // Remove special chars except parentheses and hyphens
      .replace(/[()]/g, '') // Remove parentheses
      .replace(/\s+/g, ' ') // Normalize spaces
      .replace(/^[a-zA-Z]\s+[a-zA-Z]\s+[a-zA-Z]/, '') // Remove patterns like "a b c"
      .replace(/^[a-zA-Z]\s+[a-zA-Z]$/, '') // Remove patterns like "ab"
      .trim()
      .split(/\s{2,}/)[0] // Take first part if multiple spaces
      .substring(0, 100); // Limit length
  }

  // Alternative: Use Google Vision API (more accurate, paid)
  async processImageWithGoogleVision(imageBuffer: Buffer): Promise<OCRResult> {
    // Requires: npm install @google-cloud/vision
    // Setup Google Cloud credentials
    
    // const vision = require('@google-cloud/vision');
    // const client = new vision.ImageAnnotatorClient();
    
    // const [result] = await client.textDetection({
    //   image: { content: imageBuffer.toString('base64') }
    // });
    
    // const detections = result.textAnnotations;
    // const text = detections[0]?.description || '';
    
    // return this.parseOrderText(text);
    
    throw new Error('Google Vision API not configured');
  }
}
