import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateShopSettingsDto } from './dto/update-shop-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Request } from 'express';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ==========================================
  // PROFILE
  // ==========================================

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() updateDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, updateDto);
  }

  @Post('profile/image')
  @ApiOperation({ summary: 'Upload profile image' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  async uploadProfileImage(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const imageUrl = await this.usersService.uploadProfileImage(userId, file.buffer);
    return { imageUrl };
  }

  @Delete('account')
  @ApiOperation({ summary: 'Delete account' })
  async deleteAccount(
    @CurrentUser('id') userId: string,
    @Body('password') password: string,
  ) {
    await this.usersService.deleteAccount(userId, password);
    return { message: 'Account deleted successfully' };
  }

  // ==========================================
  // SHOP SETTINGS
  // ==========================================

  @Get('settings')
  @ApiOperation({ summary: 'Get shop settings' })
  async getShopSettings(@CurrentUser('id') userId: string) {
    return this.usersService.getShopSettings(userId);
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update shop settings' })
  async updateShopSettings(
    @CurrentUser('id') userId: string,
    @Body() updateDto: UpdateShopSettingsDto,
  ) {
    return this.usersService.updateShopSettings(userId, updateDto);
  }

  @Post('settings/reset')
  @ApiOperation({ summary: 'Reset shop settings to default' })
  async resetShopSettings(@CurrentUser('id') userId: string) {
    return this.usersService.resetShopSettings(userId);
  }

  // ==========================================
  // ACTIVITY LOGS
  // ==========================================

  @Get('activity')
  @ApiOperation({ summary: 'Get activity logs' })
  async getActivityLogs(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.usersService.getActivityLogs(userId, page, limit);
  }

  @Get('activity/:action')
  @ApiOperation({ summary: 'Get activity logs by action' })
  async getActivityLogsByAction(
    @CurrentUser('id') userId: string,
    @Query('action') action: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.usersService.getActivityLogsByAction(userId, action, page, limit);
  }

  @Delete('activity')
  @ApiOperation({ summary: 'Clear old activity logs' })
  async clearActivityLogs(
    @CurrentUser('id') userId: string,
    @Query('daysToKeep') daysToKeep?: number,
  ) {
    await this.usersService.clearActivityLogs(userId, daysToKeep || 30);
    return { message: 'Activity logs cleared' };
  }

  // ==========================================
  // STATISTICS
  // ==========================================

  @Get('statistics')
  @ApiOperation({ summary: 'Get user statistics' })
  async getUserStatistics(@CurrentUser('id') userId: string) {
    return this.usersService.getUserStatistics(userId);
  }

  // ==========================================
  // SUBSCRIPTION
  // ==========================================

  @Get('subscription')
  @ApiOperation({ summary: 'Get subscription info' })
  async getSubscriptionInfo(@CurrentUser('id') userId: string) {
    return this.usersService.getSubscriptionInfo(userId);
  }

  @Post('subscription/upgrade')
  @ApiOperation({ summary: 'Upgrade subscription' })
  async upgradeSubscription(
    @CurrentUser('id') userId: string,
    @Body('plan') plan: 'basic' | 'premium',
    @Body('durationDays') durationDays?: number,
  ) {
    return this.usersService.upgradeSubscription(userId, plan, durationDays);
  }
}