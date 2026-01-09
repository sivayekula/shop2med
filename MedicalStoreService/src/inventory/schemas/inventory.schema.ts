import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InventoryDocument = Inventory & Document;

@Schema({ timestamps: true })
export class Inventory {
  @Prop({ type: Types.ObjectId, ref: 'Medicine', required: true, index: true })
  medicine: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  // Batch Information
  @Prop({ required: true, trim: true, index: true })
  batchNumber: string;

  @Prop({ required: true, type: Date, index: true })
  expiryDate: Date;

  @Prop({ required: true, type: Date })
  manufactureDate: Date;

  // Stock Information
  @Prop({ required: true, min: 0 })
  quantity: number;

  @Prop({ min: 0, default: 0 })
  soldQuantity: number;

  @Prop({ min: 0, default: 0 })
  damagedQuantity: number;

  // Pricing
  @Prop({ required: true, min: 0 })
  purchasePrice: number;

  @Prop({ required: true, min: 0 })
  sellingPrice: number;

  @Prop({ min: 0 })
  mrp?: number;

  // Supplier Information
  @Prop({ trim: true })
  supplier?: string;

  @Prop({ trim: true })
  supplierInvoiceNumber?: string;

  @Prop({ type: Date })
  purchaseDate?: Date;

  // Storage Location
  @Prop({ trim: true })
  rackNumber?: string;

  @Prop({ trim: true })
  shelfNumber?: string;

  // Alert Thresholds
  @Prop({ min: 0, default: 10 })
  reorderLevel: number;

  @Prop({ default: 30 })
  expiryAlertDays: number; // Alert when X days before expiry

  // Status
  @Prop({ 
    type: String, 
    enum: ['active', 'low_stock', 'expired', 'near_expiry', 'out_of_stock'], 
    default: 'active',
    index: true
  })
  status: string;

  @Prop({ default: true })
  isActive: boolean;

  // Notes
  @Prop({ trim: true })
  notes?: string;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);

// Compound indexes for efficient queries
InventorySchema.index({ medicine: 1, batchNumber: 1, user: 1 }, { unique: true });
InventorySchema.index({ expiryDate: 1, isActive: 1 });
InventorySchema.index({ status: 1, user: 1 });
InventorySchema.index({ quantity: 1, reorderLevel: 1 });

// Virtual: Available quantity
InventorySchema.virtual('availableQuantity').get(function() {
  return this.quantity - this.soldQuantity - this.damagedQuantity;
});

// Virtual: Days until expiry
InventorySchema.virtual('daysUntilExpiry').get(function() {
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual: Is expired
InventorySchema.virtual('isExpired').get(function() {
  return new Date() > new Date(this.expiryDate);
});

// Virtual: Is near expiry
InventorySchema.virtual('isNearExpiry').get(function() {
  const daysUntilExpiry = this.get('daysUntilExpiry');
  return daysUntilExpiry > 0 && daysUntilExpiry <= this.expiryAlertDays;
});

// Virtual: Profit margin
InventorySchema.virtual('profitMargin').get(function() {
  return this.sellingPrice - this.purchasePrice;
});

// Virtual: Profit percentage
InventorySchema.virtual('profitPercentage').get(function() {
  if (this.purchasePrice === 0) return 0;
  return ((this.sellingPrice - this.purchasePrice) / this.purchasePrice) * 100;
});

// Update status before save
InventorySchema.pre('save', function(next) {
  const inventory = this;
  const availableQty = inventory.quantity - inventory.soldQuantity - inventory.damagedQuantity;
  
  if (availableQty <= 0) {
    inventory.status = 'out_of_stock';
  } else if (new Date() > inventory.expiryDate) {
    inventory.status = 'expired';
  } else if (inventory.get('isNearExpiry')) {
    inventory.status = 'near_expiry';
  } else if (availableQty <= inventory.reorderLevel) {
    inventory.status = 'low_stock';
  } else {
    inventory.status = 'active';
  }
  
  next();
});

// Enable virtuals in JSON
InventorySchema.set('toJSON', { virtuals: true });
InventorySchema.set('toObject', { virtuals: true });
