import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from "mongoose";

class ProductData {
  @Prop({type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product'})
  productId: mongoose.Schema.Types.ObjectId;

  @Prop({type: Number, required: true, default: 0})
  quantity: number;
}

@Schema({timestamps: true})
export class stock {

  @Prop({type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'})
  userId: mongoose.Schema.Types.ObjectId

  @Prop({type: [ProductData], required: true})
  products: ProductData[]
}

export const StockSchema = SchemaFactory.createForClass(stock);

