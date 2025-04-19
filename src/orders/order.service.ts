import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";


@Injectable()
export class OrderService {
  constructor(
    @InjectModel('Order') private readonly orderModel
  ) {}

  findAll(): Promise<any> {
    return this.orderModel.find().exec();
  }
}