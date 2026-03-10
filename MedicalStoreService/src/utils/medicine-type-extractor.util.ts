/**
 * Utility to extract dosage form from medicine names and descriptions
 * Useful for OCR processing when dosage form is not explicitly captured
 */

export class MedicineTypeExtractor {
  
  // Common patterns for different dosage forms
  private static readonly DOSAGE_FORM_PATTERNS = {
    'Tablet': [
      /\b(tab|tablet|tabs)\b/i,
      /\b(\d+mg?\s*tab)/i,
      /\b(\d+mg?\s*tablet)/i,
    ],
    'Capsule': [
      /\b(cap|capsule|caps)\b/i,
      /\b(\d+mg?\s*cap)/i,
      /\b(\d+mg?\s*capsule)/i,
    ],
    'Injection': [
      /\b(inj|injection|inject)\b/i,
      /\b(\d+mg?\/ml\s*inj)/i,
      /\b(\d+mg?\/ml\s*injection)/i,
      /\b(vial|ampoule)\b/i,
    ],
    'Syrup': [
      /\b(syrup|syr)\b/i,
      /\b(\d+mg?\/5ml\s*syr)/i,
      /\b(\d+mg?\/5ml\s*syrup)/i,
      /\b(ml\s*bottle)/i,
    ],
    'Cream': [
      /\b(cream|crm)\b/i,
      /\b(\d+%?\s*cream)/i,
      /\b(\d+g?\s*cream)/i,
    ],
    'Ointment': [
      /\b(ointment|oint|oin)\b/i,
      /\b(\d+%?\s*ointment)/i,
      /\b(\d+g?\s*ointment)/i,
    ],
    'Drops': [
      /\b(drop|drops)\b/i,
      /\b(eye\s*drop)/i,
      /\b(ear\s*drop)/i,
      /\b(nose\s*drop)/i,
    ],
    'Gel': [
      /\b(gel)\b/i,
      /\b(\d+%?\s*gel)/i,
      /\b(\d+g?\s*gel)/i,
    ],
    'Lotion': [
      /\b(lotion)\b/i,
      /\b(\d+%?\s*lotion)/i,
      /\b(\d+ml?\s*lotion)/i,
    ],
    'Powder': [
      /\b(powder|pwd)\b/i,
      /\b(\d+g?\s*powder)/i,
      /\b(\d+mg?\s*powder)/i,
    ],
    'Solution': [
      /\b(solution|sol)\b/i,
      /\b(\d+mg?\/ml\s*sol)/i,
      /\b(\d+mg?\/ml\s*solution)/i,
    ],
    'Inhaler': [
      /\b(inhaler|inh)\b/i,
      /\b(\d+mcg?\s*inhaler)/i,
    ],
    'Spray': [
      /\b(spray)\b/i,
      /\b(\d+mcg?\s*spray)/i,
    ],
  };

  // Patterns to remove from medicine names (all variations)
  private static readonly NAME_CLEANUP_PATTERNS = [
    // Dosage form suffixes
    /\s+(tablet|tab|tabs)\s*$/i,
    /\s+(capsule|cap|caps)\s*$/i,
    /\s+(injection|inj|inject)\s*$/i,
    /\s+(syrup|syr)\s*$/i,
    /\s+(cream|crm)\s*$/i,
    /\s+(ointment|oint|oin)\s*$/i,
    /\s+(drop|drops)\s*$/i,
    /\s+(gel)\s*$/i,
    /\s+(lotion)\s*$/i,
    /\s+(powder|pwd)\s*$/i,
    /\s+(solution|sol)\s*$/i,
    /\s+(inhaler|inh)\s*$/i,
    /\s+(spray)\s*$/i,
    /\s+(suppository)\s*$/i,
    /\s+(liniment)\s*$/i,
    /\s+(paste)\s*$/i,
    /\s+(granules)\s*$/i,
    /\s+(lozenge)\s*$/i,
    /\s+(patch)\s*$/i,
    /\s+(implant)\s*$/i,
    // Remove common measurement patterns
    /\s+\d+mg\s*$/i,
    /\s+\d+mcg\s*$/i,
    /\s+\d+g\s*$/i,
    /\s+\d+ml\s*$/i,
    /\s+\d+%?\s*$/i,
    // Remove packaging patterns
    /\s+\d+\*\d+t\s*$/i,
    /\s+\d+\*\d+c\s*$/i,
    /\s+\d+via\s*$/i,
    /\s+\d+ml\s*bottle\s*$/i,
    // Remove trailing separators
    /\s*[-–—]\s*$/i,
    /\s*\.\s*$/i,
    /\s*,\s*$/i,
  ];

  /**
   * Clean medicine name by removing dosage form suffixes and other patterns
   */
  static cleanMedicineName(medicineName: string): string {
    if (!medicineName) return medicineName;

    for (const pattern of this.NAME_CLEANUP_PATTERNS) {
      medicineName = medicineName.replace(pattern, '');
    }

    return medicineName.trim();
  }

  /**
   * Extract dosage form and clean medicine name together
   * Returns both cleaned name and dosage form
   */
  static extractAndClean(medicineName: string, packing?: string): { 
    cleanedName: string; 
    dosageForm: string; 
    confidence: number;
  } {
    if (!medicineName) return { 
      cleanedName: medicineName, 
      dosageForm: 'Unknown', 
      confidence: 0 
    };

    // First extract dosage form from original name
    const dosageFormResult = this.extractDosageFormWithConfidence(medicineName);
    
    // If confidence is low, try packing
    let finalDosageForm = dosageFormResult.dosageForm;
    let finalConfidence = dosageFormResult.confidence;

    if (dosageFormResult.confidence < 0.8 && packing) {
      const packingResult = this.extractFromPacking(packing);
      if (packingResult !== 'Unknown') {
        finalDosageForm = packingResult;
        finalConfidence = 0.8;
      }
    }

    // Clean the medicine name
    const cleanedName = this.cleanMedicineName(medicineName);

    return {
      cleanedName,
      dosageForm: finalDosageForm,
      confidence: finalConfidence
    };
  }

  /**
   * Extract dosage form from medicine name
   */
  static extractDosageForm(medicineName: string): string {
    medicineName = this.cleanMedicineName(medicineName);
    if (!medicineName) return 'Unknown';

    // Check each dosage form pattern
    for (const [dosageForm, patterns] of Object.entries(this.DOSAGE_FORM_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(medicineName)) {
          return dosageForm;
        }
      }
    }

    return 'Unknown';
  }

  /**
   * Extract dosage form with confidence score
   */
  static extractDosageFormWithConfidence(medicineName: string): { dosageForm: string; confidence: number } {
    if (!medicineName) return { dosageForm: 'Unknown', confidence: 0 };

    let bestMatch = { dosageForm: 'Unknown', confidence: 0 };

    for (const [dosageForm, patterns] of Object.entries(this.DOSAGE_FORM_PATTERNS)) {
      for (const pattern of patterns) {
        const match = medicineName.match(pattern);
        if (match) {
          // Higher confidence for explicit mentions
          const confidence = match[0].toLowerCase().includes(dosageForm.toLowerCase()) ? 0.9 : 0.7;
          if (confidence > bestMatch.confidence) {
            bestMatch = { dosageForm, confidence };
          }
        }
      }
    }

    return bestMatch;
  }

  /**
   * Extract dosage form from packing information
   */
  static extractFromPacking(packing: string): string {
    if (!packing) return 'Unknown';

    // Common packing patterns
    const packingPatterns = {
      'Tablet': /\b(\d+\*\d+T|\d+T)\b/i,
      'Capsule': /\b(\d+\*\d+C|\d+C)\b/i,
      'Injection': /\b(\d+\*VIA|\d+VIA)\b/i,
      'Syrup': /\b(\d+ML|\d+ML\s*BOTTLE)\b/i,
    };

    for (const [dosageForm, pattern] of Object.entries(packingPatterns)) {
      if (pattern.test(packing)) {
        return dosageForm;
      }
    }

    return 'Unknown';
  }

  /**
   * Combine extraction from multiple sources
   */
  static extractFromMultipleSources(medicineName: string, packing?: string): string {
    const nameResult = this.extractDosageFormWithConfidence(medicineName);
    
    if (nameResult.confidence > 0.8) {
      return nameResult.dosageForm;
    }

    // Try packing if name confidence is low
    if (packing) {
      const packingResult = this.extractFromPacking(packing);
      if (packingResult !== 'Unknown') {
        return packingResult;
      }
    }

    return nameResult.dosageForm;
  }

  /**
   * Validate if a dosage form is valid
   */
  static isValidDosageForm(dosageForm: string): boolean {
    return Object.keys(this.DOSAGE_FORM_PATTERNS).includes(dosageForm) || dosageForm === 'Unknown';
  }

  /**
   * Get all available dosage forms
   */
  static getAllDosageForms(): string[] {
    return [...Object.keys(this.DOSAGE_FORM_PATTERNS), 'Unknown'];
  }
}
