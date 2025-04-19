import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ProductSchema } from "./products.schema";
import { ProductsController } from "./products.contoller";
import { ProductsService } from "./products.service";


@Module({
  imports:[MongooseModule.forFeature([{name:'Product', schema:ProductSchema}])],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService]
})

export class ProductsModule {}