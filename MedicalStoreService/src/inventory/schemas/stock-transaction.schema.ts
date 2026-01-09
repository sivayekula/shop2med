import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StockTransactionDocument = StockTransaction & Document;

@Schema({ timestamps: true })
export class StockTransaction {
  @Prop({ type: Types.ObjectId, ref: 'Inventory', required: true, index: true })
  inventory: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['purchase', 'sale', 'damage', 'return', 'adjustment'],
    required: true,
    index: true
  })
  type: string;

  @Prop({ required: true })
  quantity: number;

  @Prop()
  previousQuantity: number;

  @Prop()
  newQuantity: number;

  @Prop({ trim: true })
  reason?: string;

  @Prop({ trim: true })
  referenceNumber?: string; // Invoice/Bill number

  @Prop({ type: Types.ObjectId, ref: 'Sale' })
  saleReference?: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  transactionDate: Date;
}

export const StockTransactionSchema = SchemaFactory.createForClass(StockTransaction);

StockTransactionSchema.index({ inventory: 1, transactionDate: -1 });
StockTransactionSchema.index({ type: 1, user: 1 });