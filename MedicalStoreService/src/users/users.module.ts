import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ActivityLogController } from './activity-log.controller';
import { ActivityLogService } from './activity-log.service';
import { User, UserSchema } from './schemas/user.schema';
import { ShopSettings, ShopSettingsSchema } from './schemas/shop-settings.schema';
import { ActivityLog, ActivityLogSchema } from './schemas/activity-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: ShopSettings.name, schema: ShopSettingsSchema },
      { name: ActivityLog.name, schema: ActivityLogSchema },
    ]),
    MulterModule.register({
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  ],
  controllers: [UsersController, ActivityLogController],
  providers: [UsersService, ActivityLogService],
  exports: [UsersService, ActivityLogService],
})
export class UsersModule {}