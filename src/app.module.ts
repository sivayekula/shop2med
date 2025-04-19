import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UserModule } from './user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth/auth.service';
import { AuthModule } from './auth/auth.module';
import { TerminusModule } from '@nestjs/terminus';
import { ProductsModule } from './products/products.module';
import { StocksModule } from './stocks/stocks.module';
import { OrderModule } from './orders/order.module';
import { Sales } from './sales/sales.schema';
import { SalesModule } from './sales/sales.module';
import { CartModule } from './cart/cart.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/shop2med'),
    UserModule,
    AuthModule,
    TerminusModule,
    ProductsModule,
    StocksModule,
    OrderModule,
    SalesModule,
    CartModule
  ],
  controllers: [AppController],
  providers: []
})
export class AppModule {}
