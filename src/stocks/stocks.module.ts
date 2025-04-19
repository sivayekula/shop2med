import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { StocksController } from './stocks.controller';
import { StockSchema } from "./stocks.schema";
import { StocksService } from "./stocks.service";

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Stock', schema: StockSchema }])],
  controllers: [StocksController],
  providers: [StocksService],
  exports: [StocksService]
})
export class StocksModule {}