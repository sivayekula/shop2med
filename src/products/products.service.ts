import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";


@Injectable()
export class ProductsService {
  constructor(
    @InjectModel('Product') private readonly productModel
  ) {}

  findAll(): Promise<any> {
    return this.productModel.find().exec();
  }
}