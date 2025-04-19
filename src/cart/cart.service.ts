import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";


@Injectable()
export class CartService {
  constructor(
    @InjectModel('Cart') private readonly cartModel
  ) {}

  findAll(): Promise<any> {
    return this.cartModel.find().exec();
  }
}