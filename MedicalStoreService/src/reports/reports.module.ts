import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { ExportService } from './services/export.service';
import { Sale, SaleSchema } from '../sales/schemas/sale.schema';
import { Inventory, InventorySchema } from '../inventory/schemas/inventory.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { Medicine, MedicineSchema } from '../medicines/schemas/medicine.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Sale.name, schema: SaleSchema },
      { name: Inventory.name, schema: InventorySchema },
      { name: Order.name, schema: OrderSchema },
      { name: Medicine.name, schema: MedicineSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ExportService],
  exports: [ReportsService],
})
export class ReportsModule {}