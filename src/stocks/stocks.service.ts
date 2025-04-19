import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";


@Injectable()
export class StocksService {
  constructor(
    @InjectModel('Stock') private readonly stockModel
  ) {}

  findAll(): Promise<any> {
    return this.stockModel.find().exec();
  }

}