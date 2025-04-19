import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";


@Injectable()
export class SalesService {
  constructor(
    @InjectModel('Sales') private readonly salesModel
  ) {}

  findAll(): Promise<any> {
    return this.salesModel.find().exec();
  }
}