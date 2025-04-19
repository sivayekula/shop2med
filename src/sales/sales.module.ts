import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { SalesSchema } from "./sales.schema";
import { SalesController } from "./sales.controller";
import { SalesService } from "./sales.service";


@Module({
  imports: [MongooseModule.forFeature([{name: 'Sales', schema: SalesSchema}])],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService]
})

export class SalesModule {}