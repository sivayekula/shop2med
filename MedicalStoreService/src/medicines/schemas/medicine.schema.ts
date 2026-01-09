import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MedicineDocument = Medicine & Document;

@Schema({ timestamps: true })
export class Medicine {
  @Prop({ required: true, trim: true, index: true })
  name: string;

  @Prop({ trim: true, index: true })
  genericName?: string;

  // Dosage Information
  @Prop({
    type: String,
    enum: ['Tablet', 'Capsule', 'Injection', 'Syrup', 'Cream', 'Ointment', 
           'Drops', 'Gel', 'Lotion', 'Powder', 'Solution', 'Suppository', 
           'Inhaler', 'Spray', 'Unknown'],
    default: 'Unknown'
  })
  dosageForm: string;

  @Prop({ trim: true })
  strength?: string;

  @Prop({ trim: true })
  composition?: string;

  // Packaging
  @Prop({ default: '1 unit' })
  unit: string;

  @Prop({ default: '1 unit' })
  packSize: string;

  // Pricing
  @Prop({ type: Number, min: 0 })
  ceilingPrice?: number;

  @Prop({ type: Number, min: 0 })
  mrp?: number;

  @Prop({ type: Number, min: 0 })
  purchasePrice?: number;

  // Classification
  @Prop({ default: 'General', index: true })
  category: string;

  @Prop({
    type: String,
    enum: ['Oral', 'Injectable', 'Topical', 'Ophthalmic', 'Inhalation', 'Other'],
    default: 'Oral'
  })
  route: string;

  // Optional Fields
  @Prop({ trim: true })
  manufacturer?: string;

  @Prop({ trim: true })
  schedule?: string;

  @Prop({ default: '30049099' })
  hsnCode: string;

  @Prop({ default: false })
  requiresPrescription: boolean;

  // Search Optimization
  @Prop({ type: [String], lowercase: true })
  searchTerms: string[];

  // Metadata
  @Prop({
    type: String,
    enum: ['NPPA', 'USER', 'IMPORT'],
    default: 'USER'
  })
  dataSource: string;

  @Prop({ default: false })
  nlemListed: boolean;

  @Prop({ default: true, index: true })
  isActive: boolean;

  // Shop-specific
  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  // Usage tracking
  @Prop({ default: 0 })
  usageCount: number;

  @Prop({ type: Date })
  lastUsed?: Date;
}

export const MedicineSchema = SchemaFactory.createForClass(Medicine);

// Create text index for search
MedicineSchema.index({
  name: 'text',
  genericName: 'text',
  searchTerms: 'text'
}, {
  weights: { name: 10, genericName: 5, searchTerms: 3 }
});

// Compound indexes
MedicineSchema.index({ category: 1, isActive: 1 });
MedicineSchema.index({ dosageForm: 1, isActive: 1 });
MedicineSchema.index({ usageCount: -1 });