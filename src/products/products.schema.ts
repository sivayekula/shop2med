import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({timestamps: true})
export class Product {
  @Prop({type: String, required: true, unique: true})
  name: string;

  @Prop({type: String, required: false})
  description: string;

  @Prop({type: Number, required: true})
  price: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);