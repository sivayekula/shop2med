
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SaleDocument = Sale & Document;

// Sale Item Sub-schema
@Schema({ _id: false })
export class SaleItem {
  @Prop({ type: Types.ObjectId, ref: 'Medicine', required: true })
  medicine: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Inventory', required: true })
  inventory: Types.ObjectId;

  @Prop({ required: true, trim: true })
  medicineName: string;

  @Prop({ trim: true })
  batchNumber?: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  unitPrice: number;

  @Prop({ min: 0 })
  mrp?: number;

  @Prop({ min: 0, max: 100, default: 0 })
  discountPercent: number;

  @Prop({ min: 0, default: 0 })
  discountAmount: number;

  @Prop({ min: 0, default: 0 })
  taxPercent: number;

  @Prop({ min: 0, default: 0 })
  taxAmount: number;

  @Prop({ required: true, min: 0 })
  totalAmount: number;
}

const SaleItemSchema = SchemaFactory.createForClass(SaleItem);

@Schema({ timestamps: true })
export class Sale {
  @Prop({ required: true, unique: true, index: true })
  billNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ required: true, type: Date, index: true })
  saleDate: Date;

  // Customer Information (Optional)
  @Prop({ trim: true })
  customerName?: string;

  @Prop({ trim: true })
  customerPhone?: string;

  @Prop({ trim: true })
  customerEmail?: string;

  @Prop()
  customerAddress?: string;

  @Prop({ trim: true })
  doctorName?: string;

  @Prop({ trim: true })
  prescriptionNumber?: string;

  // Sale Items
  @Prop({ type: [SaleItemSchema], required: true })
  items: SaleItem[];

  // Amounts
  @Prop({ required: true, min: 0 })
  subtotal: number;

  @Prop({ min: 0, default: 0 })
  totalDiscount: number;

  @Prop({ min: 0, default: 0 })
  totalTax: number;

  @Prop({ min: 0, default: 0 })
  shippingCharges: number;

  @Prop({ min: 0, default: 0 })
  otherCharges: number;

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({ required: true, min: 0 })
  amountPaid: number;

  @Prop({ min: 0, default: 0 })
  balanceDue: number;

  // Payment Information
  @Prop({
    type: String,
    enum: ['cash', 'card', 'upi', 'netbanking', 'cheque', 'mixed'],
    default: 'cash',
  })
  paymentMethod: string;

  @Prop({
    type: String,
    enum: ['completed', 'pending', 'partial', 'cancelled', 'refunded'],
    default: 'completed',
    index: true,
  })
  paymentStatus: string;

  @Prop({ trim: true })
  transactionId?: string;

  // Status
  @Prop({
    type: String,
    enum: ['completed', 'cancelled', 'returned'],
    default: 'completed',
    index: true,
  })
  status: string;

  @Prop({ default: true })
  isActive: boolean;

  // Notes
  @Prop({ trim: true })
  notes?: string;

  @Prop({ trim: true })
  cancellationReason?: string;

  @Prop({ type: Date })
  cancelledAt?: Date;
}

export const SaleSchema = SchemaFactory.createForClass(Sale);

// Indexes
SaleSchema.index({ billNumber: 1, user: 1 });
SaleSchema.index({ saleDate: -1, user: 1 });
SaleSchema.index({ customerPhone: 1, user: 1 });
SaleSchema.index({ status: 1, paymentStatus: 1 });

// Virtual: Total items count
SaleSchema.virtual('itemsCount').get(function() {
  return this.items?.length || 0;
});

// Virtual: Total quantity
SaleSchema.virtual('totalQuantity').get(function() {
  return this.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
});

// Virtual: Profit
SaleSchema.virtual('profit').get(function() {
  // This would require purchase price from inventory
  // Calculated in service layer
  return 0;
});

SaleSchema.set('toJSON', { virtuals: true });
SaleSchema.set('toObject', { virtuals: true });
