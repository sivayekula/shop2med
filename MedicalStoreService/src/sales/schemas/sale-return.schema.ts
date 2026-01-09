
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SaleReturnDocument = SaleReturn & Document;

@Schema({ _id: false })
export class ReturnItem {
  @Prop({ type: Types.ObjectId, ref: 'Medicine', required: true })
  medicine: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Inventory', required: true })
  inventory: Types.ObjectId;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  unitPrice: number;

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ trim: true })
  reason?: string;
}

const ReturnItemSchema = SchemaFactory.createForClass(ReturnItem);

@Schema({ timestamps: true })
export class SaleReturn {
  @Prop({ required: true, unique: true })
  returnNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'Sale', required: true, index: true })
  originalSale: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ required: true, type: Date })
  returnDate: Date;

  @Prop({ type: [ReturnItemSchema], required: true })
  items: ReturnItem[];

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({ 
    type: String, 
    enum: ['full', 'partial'], 
    default: 'full' 
  })
  returnType: string;

  @Prop({ trim: true })
  reason?: string;

  @Prop({ 
    type: String, 
    enum: ['pending', 'completed', 'rejected'], 
    default: 'completed' 
  })
  status: string;

  @Prop({ trim: true })
  notes?: string;
}

export const SaleReturnSchema = SchemaFactory.createForClass(SaleReturn);

SaleReturnSchema.index({ returnNumber: 1, user: 1 });
SaleReturnSchema.index({ originalSale: 1 });