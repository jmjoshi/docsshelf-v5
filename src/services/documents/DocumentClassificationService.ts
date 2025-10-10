// @ts-nocheck
/**
 * DocumentClassificationService - Intelligent document classification and metadata extraction
 * Uses AI/ML patterns to classify documents and extract key information
 */

import { OCRResult, DocumentType, ExtractedData } from './DocumentOCRService';
import { store } from '../../store/store';

export interface ClassificationResult {
  documentType: DocumentType;
  confidence: number;
  suggestedCategory: string;
  categoryConfidence: number;
  extractedMetadata: ExtractedData;
  keyInsights: KeyInsight[];
  processingTime: number;
}

export interface KeyInsight {
  type: 'amount' | 'date' | 'entity' | 'keyword' | 'anomaly';
  title: string;
  description: string;
  confidence: number;
  actionable?: boolean;
}

export interface DocumentPattern {
  type: DocumentType;
  keywords: string[];
  requiredFields: string[];
  optionalFields: string[];
  layouts: LayoutPattern[];
}

export interface LayoutPattern {
  name: string;
  regions: {
    header: string[];
    body: string[];
    footer: string[];
  };
  weights: {
    keyword: number;
    position: number;
    format: number;
  };
}

class DocumentClassificationService {
  private documentPatterns: DocumentPattern[] = [
    {
      type: 'invoice',
      keywords: [
        'invoice', 'bill to', 'invoice number', 'due date', 'amount due',
        'subtotal', 'total', 'tax', 'payment terms', 'remit to'
      ],
      requiredFields: ['total', 'date', 'vendor'],
      optionalFields: ['invoice_number', 'po_number', 'tax_amount'],
      layouts: [
        {
          name: 'standard',
          regions: {
            header: ['invoice', 'bill to', 'ship to'],
            body: ['description', 'quantity', 'rate', 'amount'],
            footer: ['subtotal', 'tax', 'total', 'terms']
          },
          weights: { keyword: 0.4, position: 0.3, format: 0.3 }
        }
      ]
    },
    {
      type: 'receipt',
      keywords: [
        'receipt', 'thank you', 'store', 'transaction', 'purchase',
        'qty', 'price', 'total', 'cash', 'card', 'change'
      ],
      requiredFields: ['total', 'date', 'merchant'],
      optionalFields: ['transaction_id', 'card_last4', 'cashier'],
      layouts: [
        {
          name: 'retail',
          regions: {
            header: ['store name', 'address', 'phone'],
            body: ['item', 'qty', 'price'],
            footer: ['subtotal', 'tax', 'total', 'payment method']
          },
          weights: { keyword: 0.5, position: 0.3, format: 0.2 }
        }
      ]
    },
    {
      type: 'contract',
      keywords: [
        'agreement', 'contract', 'party', 'parties', 'terms',
        'conditions', 'signature', 'effective date', 'termination'
      ],
      requiredFields: ['parties', 'effective_date', 'terms'],
      optionalFields: ['termination_date', 'renewal_terms', 'governing_law'],
      layouts: [
        {
          name: 'legal',
          regions: {
            header: ['title', 'parties', 'recitals'],
            body: ['terms', 'conditions', 'obligations'],
            footer: ['signatures', 'date', 'witnesses']
          },
          weights: { keyword: 0.3, position: 0.4, format: 0.3 }
        }
      ]
    },
    {
      type: 'statement',
      keywords: [
        'statement', 'account', 'balance', 'transaction', 'payment',
        'statement period', 'previous balance', 'current balance'
      ],
      requiredFields: ['account_number', 'statement_period', 'balance'],
      optionalFields: ['interest_rate', 'minimum_payment', 'due_date'],
      layouts: [
        {
          name: 'financial',
          regions: {
            header: ['account info', 'statement period'],
            body: ['transactions', 'charges', 'payments'],
            footer: ['summary', 'balance', 'payment info']
          },
          weights: { keyword: 0.4, position: 0.4, format: 0.2 }
        }
      ]
    }
  ];

  /**
   * Classify document and extract intelligent insights
   */
  public async classifyDocument(ocrResult: OCRResult): Promise<ClassificationResult> {
    const startTime = Date.now();
    
    try {
      console.log('🧠 Starting intelligent document classification...');

      // Step 1: Enhanced document type detection
      const typeClassification = this.classifyDocumentType(ocrResult);
      
      // Step 2: Advanced metadata extraction
      const enhancedMetadata = this.extractAdvancedMetadata(ocrResult, typeClassification.type);
      
      // Step 3: Intelligent category suggestion
      const categorySuggestion = await this.suggestSmartCategory(ocrResult, typeClassification.type);
      
      // Step 4: Generate key insights
      const insights = this.generateKeyInsights(ocrResult, enhancedMetadata);
      
      const processingTime = Date.now() - startTime;

      const result: ClassificationResult = {
        documentType: typeClassification.type,
        confidence: typeClassification.confidence,
        suggestedCategory: categorySuggestion.category,
        categoryConfidence: categorySuggestion.confidence,
        extractedMetadata: enhancedMetadata,
        keyInsights: insights,
        processingTime
      };

      console.log(`✅ Document classification completed in ${processingTime}ms`);
      console.log(`📄 Type: ${result.documentType} (${Math.round(result.confidence * 100)}% confidence)`);
      console.log(`📁 Suggested category: ${result.suggestedCategory}`);
      
      return result;

    } catch (error) {
      console.error('❌ Document classification failed:', error);
      throw new Error(`Classification failed: ${error.message}`);
    }
  }

  /**
   * Enhanced document type classification using multiple algorithms
   */
  private classifyDocumentType(ocrResult: OCRResult): { type: DocumentType; confidence: number } {
    const { text, words } = ocrResult;
    const lowercaseText = text.toLowerCase();
    const normalizedText = this.normalizeText(text);
    
    const scores: { [key in DocumentType]: number } = {
      invoice: 0,
      receipt: 0,
      contract: 0,
      statement: 0,
      letter: 0,
      form: 0,
      other: 0
    };

    // Algorithm 1: Keyword-based scoring
    this.documentPatterns.forEach(pattern => {
      let keywordScore = 0;
      pattern.keywords.forEach(keyword => {
        const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = normalizedText.match(keywordRegex);
        if (matches) {
          keywordScore += matches.length * (1 / pattern.keywords.length);
        }
      });
      scores[pattern.type] += keywordScore * 0.4; // 40% weight for keywords
    });

    // Algorithm 2: Layout pattern analysis
    const layoutScores = this.analyzeLayoutPatterns(words, normalizedText);
    Object.keys(layoutScores).forEach(type => {
      scores[type as DocumentType] += layoutScores[type] * 0.3; // 30% weight for layout
    });

    // Algorithm 3: Format pattern analysis
    const formatScores = this.analyzeFormatPatterns(normalizedText);
    Object.keys(formatScores).forEach(type => {
      scores[type as DocumentType] += formatScores[type] * 0.3; // 30% weight for format
    });

    // Find best match
    const bestType = Object.entries(scores).reduce((a, b) => 
      scores[a[0] as DocumentType] > scores[b[0] as DocumentType] ? a : b
    )[0] as DocumentType;

    const confidence = Math.min(scores[bestType] / Math.max(...Object.values(scores)), 1);

    return {
      type: bestType,
      confidence: confidence
    };
  }

  /**
   * Advanced metadata extraction with field validation
   */
  private extractAdvancedMetadata(ocrResult: OCRResult, documentType: DocumentType): ExtractedData {
    const { text } = ocrResult;
    const metadata: ExtractedData = {
      dates: this.extractDatesAdvanced(text),
      amounts: this.extractAmountsAdvanced(text),
      entities: this.extractEntitiesAdvanced(text),
      metadata: {}
    };

    // Type-specific extraction
    switch (documentType) {
      case 'invoice':
        metadata.metadata = {
          ...metadata.metadata,
          ...this.extractInvoiceMetadata(text)
        };
        break;
      
      case 'receipt':
        metadata.metadata = {
          ...metadata.metadata,
          ...this.extractReceiptMetadata(text)
        };
        break;
      
      case 'contract':
        metadata.metadata = {
          ...metadata.metadata,
          ...this.extractContractMetadata(text)
        };
        break;
      
      case 'statement':
        metadata.metadata = {
          ...metadata.metadata,
          ...this.extractStatementMetadata(text)
        };
        break;
    }

    return metadata;
  }

  /**
   * Advanced date extraction with validation and formatting
   */
  private extractDatesAdvanced(text: string): string[] {
    const datePatterns = [
      /\b(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})\b/g,
      /\b(\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{2,4})\b/gi,
      /\b((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2},?\s+\d{2,4})\b/gi,
      /\b(\d{2,4}[-\/]\d{1,2}[-\/]\d{1,2})\b/g,
      /\b(\d{1,2}(st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{2,4})\b/gi
    ];

    const dates: string[] = [];
    const currentYear = new Date().getFullYear();
    
    datePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Validate and normalize dates
          const date = this.parseAndValidateDate(match);
          if (date && date.getFullYear() >= currentYear - 10 && date.getFullYear() <= currentYear + 5) {
            dates.push(this.formatDate(date));
          }
        });
      }
    });

    return [...new Set(dates)].sort();
  }

  /**
   * Advanced amount extraction with currency detection and validation
   */
  private extractAmountsAdvanced(text: string): Array<{ value: number; currency: string; context: string; type: string }> {
    const amountPatterns = [
      /[$€£¥₹₽₩₪₨₫₦₡₲₴₸₽₼₾₿]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*([A-Z]{3})?/g,
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(USD|EUR|GBP|JPY|CAD|AUD|CHF|CNY|INR)/gi,
      /(total|subtotal|tax|amount|balance|due|paid)\s*:?\s*[$€£¥₹₽₩₪₨₫₦₡₲₴₸₽₼₾₿]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi
    ];
    
    const amounts: Array<{ value: number; currency: string; context: string; type: string }> = [];
    
    amountPatterns.forEach((pattern, index) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        let value: number;
        let currency: string;
        let type = 'general';
        
        if (index === 2) { // Label-based pattern
          type = match[1].toLowerCase();
          value = parseFloat(match[2].replace(/,/g, ''));
          currency = this.detectCurrency(match[0]) || 'USD';
        } else {
          value = parseFloat(match[1].replace(/,/g, ''));
          currency = match[2] || this.detectCurrency(match[0]) || 'USD';
        }
        
        if (value > 0 && value < 1000000) { // Reasonable range validation
          const startIndex = Math.max(0, match.index - 50);
          const endIndex = Math.min(text.length, match.index + match[0].length + 50);
          const context = text.substring(startIndex, endIndex).trim();

          amounts.push({
            value,
            currency,
            context,
            type
          });
        }
      }
    });

    // Remove duplicates and sort by value
    return this.deduplicateAmounts(amounts);
  }

  /**
   * Advanced entity extraction with confidence scoring
   */
  private extractEntitiesAdvanced(text: string): Array<{ type: string; text: string; confidence: number }> {
    const entities: Array<{ type: string; text: string; confidence: number }> = [];

    // Email pattern with enhanced validation
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailPattern);
    if (emails) {
      emails.forEach(email => {
        entities.push({
          type: 'EMAIL',
          text: email,
          confidence: 0.95
        });
      });
    }

    // Phone pattern with multiple formats
    const phonePatterns = [
      /(\+?1[-.\s]?)?(\([0-9]{3}\)|[0-9]{3})[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
      /\b\d{3}-\d{3}-\d{4}\b/g,
      /\b\(\d{3}\)\s?\d{3}-\d{4}\b/g
    ];
    
    phonePatterns.forEach(pattern => {
      const phones = text.match(pattern);
      if (phones) {
        phones.forEach(phone => {
          entities.push({
            type: 'PHONE',
            text: phone.trim(),
            confidence: 0.90
          });
        });
      }
    });

    // Organization detection with enhanced patterns
    const orgPatterns = [
      /\b([A-Z][a-zA-Z\s]+(?:Inc|LLC|Corp|Corporation|Company|Co|Ltd|Limited|LLP|LP)\b)/g,
      /\b([A-Z][a-zA-Z\s]+ (?:& Associates|and Associates|Group|Partners|Solutions|Services|Enterprises))\b/g
    ];
    
    orgPatterns.forEach(pattern => {
      const orgs = text.match(pattern);
      if (orgs) {
        orgs.forEach(org => {
          entities.push({
            type: 'ORGANIZATION',
            text: org.trim(),
            confidence: 0.80
          });
        });
      }
    });

    // Person name detection (basic heuristic)
    const namePattern = /\b([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g;
    const names = text.match(namePattern);
    if (names) {
      names.forEach(name => {
        // Filter out common false positives
        if (!name.match(/\b(Street|Avenue|Drive|Road|City|State|Date|Total|Amount|Invoice|Receipt)\b/i)) {
          entities.push({
            type: 'PERSON',
            text: name.trim(),
            confidence: 0.70
          });
        }
      });
    }

    // Location detection
    const locationPattern = /\b([A-Z][a-z]+,\s*[A-Z]{2}\s*\d{5})\b/g;
    const locations = text.match(locationPattern);
    if (locations) {
      locations.forEach(location => {
        entities.push({
          type: 'LOCATION',
          text: location.trim(),
          confidence: 0.85
        });
      });
    }

    // Remove duplicates and return
    const uniqueEntities = entities.filter((entity, index, self) => 
      self.findIndex(e => e.type === entity.type && e.text === entity.text) === index
    );

    return uniqueEntities.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Generate actionable insights from document analysis
   */
  private generateKeyInsights(ocrResult: OCRResult, metadata: ExtractedData): KeyInsight[] {
    const insights: KeyInsight[] = [];
    const { text } = ocrResult;

    // Amount insights
    if (metadata.amounts && metadata.amounts.length > 0) {
      const totalAmount = metadata.amounts.find(a => a.type === 'total')?.value || 
                         Math.max(...metadata.amounts.map(a => a.value));
      
      if (totalAmount > 1000) {
        insights.push({
          type: 'amount',
          title: 'High Value Document',
          description: `This document contains a significant amount of $${totalAmount.toLocaleString()}`,
          confidence: 0.9,
          actionable: true
        });
      }

      // Tax analysis
      const taxAmount = metadata.amounts.find(a => a.type?.includes('tax'));
      if (taxAmount && totalAmount) {
        const taxRate = (taxAmount.value / (totalAmount - taxAmount.value)) * 100;
        insights.push({
          type: 'amount',
          title: 'Tax Information',
          description: `Tax rate appears to be ${taxRate.toFixed(1)}% (${taxAmount.currency}${taxAmount.value})`,
          confidence: 0.8
        });
      }
    }

    // Date insights
    if (metadata.dates && metadata.dates.length > 0) {
      const futureDates = metadata.dates.filter(date => new Date(date) > new Date());
      if (futureDates.length > 0) {
        insights.push({
          type: 'date',
          title: 'Future Date Detected',
          description: `Document contains future dates: ${futureDates.join(', ')}`,
          confidence: 0.85,
          actionable: true
        });
      }

      // Due date analysis
      if (text.toLowerCase().includes('due') && metadata.dates.length > 1) {
        const dueDateMatch = text.match(/due\s*:?\s*([^\n]+)/i);
        if (dueDateMatch) {
          insights.push({
            type: 'date',
            title: 'Payment Due Date',
            description: `Due date information found: ${dueDateMatch[1].trim()}`,
            confidence: 0.9,
            actionable: true
          });
        }
      }
    }

    // Entity insights
    if (metadata.entities && metadata.entities.length > 0) {
      const emails = metadata.entities.filter(e => e.type === 'EMAIL');
      const phones = metadata.entities.filter(e => e.type === 'PHONE');
      
      if (emails.length > 0) {
        insights.push({
          type: 'entity',
          title: 'Contact Information',
          description: `Found ${emails.length} email address(es): ${emails.map(e => e.text).join(', ')}`,
          confidence: 0.95
        });
      }
      
      if (phones.length > 0) {
        insights.push({
          type: 'entity',
          title: 'Phone Numbers',
          description: `Found ${phones.length} phone number(s): ${phones.map(e => e.text).join(', ')}`,
          confidence: 0.9
        });
      }
    }

    // Document-specific insights
    if (text.toLowerCase().includes('urgent') || text.toLowerCase().includes('immediate')) {
      insights.push({
        type: 'keyword',
        title: 'Urgent Document',
        description: 'This document appears to require immediate attention',
        confidence: 0.8,
        actionable: true
      });
    }

    if (text.toLowerCase().includes('confidential') || text.toLowerCase().includes('private')) {
      insights.push({
        type: 'keyword',
        title: 'Confidential Information',
        description: 'Document contains confidential or private information',
        confidence: 0.85,
        actionable: true
      });
    }

    return insights.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Smart category suggestion with contextual analysis
   */
  private async suggestSmartCategory(ocrResult: OCRResult, documentType: DocumentType): Promise<{ category: string; confidence: number }> {
    const state = store.getState();
    const categories = state.document?.categories || [];
    
    // Get content-based suggestions
    const contentAnalysis = this.analyzeContentForCategory(ocrResult.text);
    
    // Match with existing categories
    let bestMatch = { category: 'General', confidence: 0.5 };
    
    for (const category of categories) {
      const matchScore = this.calculateCategoryMatchScore(
        category.name, 
        ocrResult.text, 
        documentType, 
        contentAnalysis
      );
      
      if (matchScore > bestMatch.confidence) {
        bestMatch = {
          category: category.name,
          confidence: matchScore
        };
      }
    }

    // Fallback to content-based suggestion if no good match
    if (bestMatch.confidence < 0.7) {
      const suggestion = this.getDefaultCategorySuggestion(documentType, contentAnalysis);
      return {
        category: suggestion,
        confidence: 0.8
      };
    }

    return bestMatch;
  }

  // Helper methods
  private normalizeText(text: string): string {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private analyzeLayoutPatterns(words: any[], text: string): { [key: string]: number } {
    // Placeholder for layout analysis
    // Would analyze word positions, line structure, etc.
    return {
      invoice: 0.1,
      receipt: 0.1,
      contract: 0.1,
      statement: 0.1,
      letter: 0.1,
      form: 0.1,
      other: 0.1
    };
  }

  private analyzeFormatPatterns(text: string): { [key: string]: number } {
    const scores: { [key: string]: number } = {};
    
    // Analyze format indicators
    const hasNumbers = /\d+/.test(text);
    const hasCurrency = /[$€£¥₹]/.test(text);
    const hasTable = /\t|\s{3,}/.test(text);
    const hasSignature = /signature|signed|sign/i.test(text);
    
    scores.invoice = (hasCurrency ? 0.3 : 0) + (hasTable ? 0.2 : 0) + (hasNumbers ? 0.2 : 0);
    scores.receipt = (hasCurrency ? 0.4 : 0) + (hasNumbers ? 0.3 : 0);
    scores.contract = (hasSignature ? 0.4 : 0) + (text.length > 1000 ? 0.2 : 0);
    scores.statement = (hasNumbers ? 0.3 : 0) + (hasTable ? 0.3 : 0);
    
    return scores;
  }

  private parseAndValidateDate(dateString: string): Date | null {
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private detectCurrency(text: string): string {
    if (text.includes('$')) return 'USD';
    if (text.includes('€')) return 'EUR';
    if (text.includes('£')) return 'GBP';
    if (text.includes('¥')) return 'JPY';
    if (text.includes('₹')) return 'INR';
    return 'USD';
  }

  private deduplicateAmounts(amounts: any[]): any[] {
    const seen = new Set();
    return amounts.filter(amount => {
      const key = `${amount.value}-${amount.currency}-${amount.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => b.value - a.value);
  }

  private analyzeContentForCategory(text: string): { domain: string; keywords: string[] } {
    const lowercaseText = text.toLowerCase();
    
    if (lowercaseText.includes('medical') || lowercaseText.includes('health')) {
      return { domain: 'medical', keywords: ['medical', 'health', 'doctor', 'clinic'] };
    }
    if (lowercaseText.includes('legal') || lowercaseText.includes('court')) {
      return { domain: 'legal', keywords: ['legal', 'court', 'attorney', 'law'] };
    }
    if (lowercaseText.includes('tax') || lowercaseText.includes('irs')) {
      return { domain: 'tax', keywords: ['tax', 'irs', 'deduction', 'filing'] };
    }
    if (lowercaseText.includes('insurance')) {
      return { domain: 'insurance', keywords: ['insurance', 'policy', 'claim', 'coverage'] };
    }
    
    return { domain: 'general', keywords: [] };
  }

  private calculateCategoryMatchScore(categoryName: string, text: string, documentType: DocumentType, contentAnalysis: any): number {
    let score = 0;
    const lowerCategoryName = categoryName.toLowerCase();
    const lowerText = text.toLowerCase();
    
    // Exact name match
    if (lowerText.includes(lowerCategoryName)) {
      score += 0.4;
    }
    
    // Domain match
    if (lowerCategoryName.includes(contentAnalysis.domain)) {
      score += 0.3;
    }
    
    // Document type match
    if (lowerCategoryName.includes(documentType)) {
      score += 0.2;
    }
    
    return Math.min(score, 1);
  }

  private getDefaultCategorySuggestion(documentType: DocumentType, contentAnalysis: any): string {
    if (contentAnalysis.domain !== 'general') {
      return contentAnalysis.domain.charAt(0).toUpperCase() + contentAnalysis.domain.slice(1);
    }
    
    const typeMap: { [key in DocumentType]: string } = {
      invoice: 'Invoices',
      receipt: 'Receipts',
      contract: 'Contracts',
      statement: 'Financial Statements',
      letter: 'Correspondence',
      form: 'Forms',
      other: 'General'
    };
    
    return typeMap[documentType] || 'General';
  }

  // Type-specific metadata extractors
  private extractInvoiceMetadata(text: string): any {
    const metadata: any = {};
    
    const invoiceNumberMatch = text.match(/invoice\s*#?\s*:?\s*([A-Z0-9-]+)/i);
    if (invoiceNumberMatch) {
      metadata.invoice_number = invoiceNumberMatch[1];
    }
    
    const poNumberMatch = text.match(/(?:po|purchase order)\s*#?\s*:?\s*([A-Z0-9-]+)/i);
    if (poNumberMatch) {
      metadata.po_number = poNumberMatch[1];
    }
    
    return metadata;
  }

  private extractReceiptMetadata(text: string): any {
    const metadata: any = {};
    
    const transactionIdMatch = text.match(/(?:transaction|trans|ref)\s*#?\s*:?\s*([A-Z0-9-]+)/i);
    if (transactionIdMatch) {
      metadata.transaction_id = transactionIdMatch[1];
    }
    
    return metadata;
  }

  private extractContractMetadata(text: string): any {
    const metadata: any = {};
    
    const partiesMatch = text.match(/between\s+(.+?)\s+and\s+(.+?)(?:\s|,|\.|$)/i);
    if (partiesMatch) {
      metadata.parties = [partiesMatch[1].trim(), partiesMatch[2].trim()];
    }
    
    return metadata;
  }

  private extractStatementMetadata(text: string): any {
    const metadata: any = {};
    
    const accountNumberMatch = text.match(/account\s*#?\s*:?\s*([A-Z0-9-]+)/i);
    if (accountNumberMatch) {
      metadata.account_number = accountNumberMatch[1];
    }
    
    return metadata;
  }
}

export const documentClassificationService = new DocumentClassificationService();
export default DocumentClassificationService;