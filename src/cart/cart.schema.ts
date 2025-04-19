import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from "mongoose";


@Schema({timestamps: true})
export class Cart {
  @Prop({type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'})
  userId: mongoose.Schema.Types.ObjectId
 
  @Prop({type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product'})
  productId: mongoose.Schema.Types.ObjectId

  @Prop({type: Number, required: true, default: 0})
  quantity: number
}

export const CartSchema = SchemaFactory.createForClass(Cart);