import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { Inventory, InventorySchema } from './schemas/inventory.schema';
import { StockTransaction, StockTransactionSchema } from './schemas/stock-transaction.schema';
@Module({
imports: [
MongooseModule.forFeature([
{ name: Inventory.name, schema: InventorySchema },
{ name: StockTransaction.name, schema: StockTransactionSchema },
]),
],
controllers: [InventoryController],
providers: [InventoryService],
exports: [InventoryService],
})
export class InventoryModule {}