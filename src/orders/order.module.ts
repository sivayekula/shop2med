import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { OrderSchema } from "./order.schema";
import { OrderController } from "./order.contoller";
import { OrderService } from "./order.service";


@Module({
  imports: [MongooseModule.forFeature([{name: 'Order', schema: OrderSchema}])],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService]
})

export class OrderModule {}