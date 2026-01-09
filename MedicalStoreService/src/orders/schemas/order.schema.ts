import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

// Order Item Sub-schema
@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Medicine' })
  medicine?: Types.ObjectId;

  @Prop({ trim: true })
  medicineName: string;

  @Prop({ trim: true })
  manufacturer?: string;

  @Prop({ trim: true })
  strength?: string;

  @Prop({ min: 1 })
  quantity: number;

  @Prop({ min: 0 })
  unitPrice?: number;

  @Prop({ min: 0 })
  totalPrice?: number;

  @Prop({ default: false })
  isVerified: boolean; // OCR verified by user

  @Prop({ default: false })
  isMatched: boolean; // Matched with medicine in DB
}

const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, unique: true, index: true })
  orderNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ required: true, type: Date, index: true })
  orderDate: Date;

  // Supplier Information
  @Prop({ trim: true, index: true })
  supplierName?: string;

  @Prop({ trim: true })
  supplierPhone?: string;

  @Prop({ trim: true })
  supplierEmail?: string;

  @Prop()
  supplierAddress?: string;

  @Prop({ trim: true })
  supplierInvoiceNumber?: string;

  @Prop({ type: Date })
  supplierInvoiceDate?: Date;

  // Order Items
  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  // OCR Processing
  @Prop()
  originalImageUrl?: string;

  @Prop()
  processedImageUrl?: string;

  @Prop({ type: Object })
  ocrRawData?: any; // Raw OCR response

  @Prop({ 
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  })
  ocrStatus: string;

  @Prop()
  ocrError?: string;

  @Prop({ type: Date })
  ocrProcessedAt?: Date;

  // Amounts
  @Prop({ min: 0 })
  subtotal?: number;

  @Prop({ min: 0, default: 0 })
  tax?: number;

  @Prop({ min: 0, default: 0 })
  discount?: number;

  @Prop({ min: 0, default: 0 })
  shippingCharges?: number;

  @Prop({ min: 0 })
  totalAmount?: number;

  // Order Status
  @Prop({
    type: String,
    enum: ['draft', 'pending', 'confirmed', 'partially_received', 'received', 'cancelled'],
    default: 'draft',
    index: true
  })
  status: string;

  @Prop({ type: Date })
  expectedDeliveryDate?: Date;

  @Prop({ type: Date })
  receivedDate?: Date;

  // Payment
  @Prop({
    type: String,
    enum: ['pending', 'paid', 'partial'],
    default: 'pending'
  })
  paymentStatus: string;

  @Prop({ min: 0, default: 0 })
  paidAmount: number;

  @Prop({ trim: true })
  paymentReference?: string;

  // Notes
  @Prop({ trim: true })
  notes?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Indexes
OrderSchema.index({ orderNumber: 1, user: 1 });
OrderSchema.index({ orderDate: -1, user: 1 });
OrderSchema.index({ status: 1, user: 1 });
OrderSchema.index({ supplierName: 1, user: 1 });
OrderSchema.index({ ocrStatus: 1 });

// Virtual: Items count
OrderSchema.virtual('itemsCount').get(function() {
  return this.items?.length || 0;
});

// Virtual: Verified items count
OrderSchema.virtual('verifiedItemsCount').get(function() {
  return this.items?.filter(item => item.isVerified).length || 0;
});

// Virtual: Matched items count
OrderSchema.virtual('matchedItemsCount').get(function() {
  return this.items?.filter(item => item.isMatched).length || 0;
});

OrderSchema.set('toJSON', { virtuals: true });
OrderSchema.set('toObject', { virtuals: true });