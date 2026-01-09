import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OcrService } from './services/ocr.service';
import { Order, OrderSchema } from './schemas/order.schema';
import { Medicine, MedicineSchema } from '../medicines/schemas/medicine.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Medicine.name, schema: MedicineSchema },
    ]),
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OcrService],
  exports: [OrdersService],
})
export class OrdersModule {}
