import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { ShopSettings, ShopSettingsDocument } from './schemas/shop-settings.schema';
import { ActivityLog, ActivityLogDocument } from './schemas/activity-log.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateShopSettingsDto } from './dto/update-shop-settings.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(ShopSettings.name) private settingsModel: Model<ShopSettingsDocument>,
    @InjectModel(ActivityLog.name) private activityLogModel: Model<ActivityLogDocument>,
  ) {}

  // ==========================================
  // PROFILE MANAGEMENT
  // ==========================================

  async getProfile(userId: string): Promise<User> {
    const user = await this.userModel
      .findById(userId)
      .select('-password -refreshToken')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, updateDto: UpdateProfileDto): Promise<User> {
    // Check if email is being changed and if it's already taken
    if (updateDto['email']) {
      const existingUser = await this.userModel.findOne({
        email: updateDto['email'],
        _id: { $ne: userId },
      });

      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    const user = await this.userModel
      .findByIdAndUpdate(userId, updateDto, { new: true })
      .select('-password -refreshToken')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Log activity
    await this.logActivity(userId, 'profile_update', 'Profile updated', updateDto);

    return user;
  }

  async uploadProfileImage(userId: string, imageBuffer: Buffer): Promise<string> {
    // In production, upload to S3/Cloudinary
    // For now, return placeholder
    const imageUrl = `https://example.com/profiles/${userId}.jpg`;

    await this.userModel.findByIdAndUpdate(userId, {
      profileImage: imageUrl,
    });

    return imageUrl;
  }

  async deleteAccount(userId: string, password: string): Promise<void> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid password');
    }

    // Soft delete - deactivate account
    user.isActive = false;
    await user.save();

    // Log activity
    await this.logActivity(userId, 'account_delete', 'Account deleted');
  }

  // ==========================================
  // SHOP SETTINGS
  // ==========================================

  async getShopSettings(userId: string): Promise<ShopSettings> {
    let settings = await this.settingsModel.findOne({ user: userId }).exec();

    // Create default settings if not exists
    if (!settings) {
      settings = new this.settingsModel({ user: userId });
      await settings.save();
    }

    return settings;
  }

  async updateShopSettings(
    userId: string,
    updateDto: UpdateShopSettingsDto,
  ): Promise<ShopSettings> {
    let settings = await this.settingsModel.findOne({ user: userId });

    if (!settings) {
      settings = new this.settingsModel({
        user: userId,
        ...updateDto,
      });
    } else {
      Object.assign(settings, updateDto);
    }

    await settings.save();

    // Log activity
    await this.logActivity(userId, 'settings_update', 'Shop settings updated', updateDto);

    return settings;
  }

  async resetShopSettings(userId: string): Promise<ShopSettings> {
    await this.settingsModel.findOneAndDelete({ user: userId });

    const newSettings = new this.settingsModel({ user: userId });
    await newSettings.save();

    return newSettings;
  }

  // ==========================================
  // ACTIVITY LOGS
  // ==========================================

  async logActivity(
    userId: string,
    action: string,
    description: string,
    metadata?: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const log = new this.activityLogModel({
      user: userId,
      action,
      description,
      metadata,
      ipAddress,
      userAgent,
    });

    await log.save();
  }

  async getActivityLogs(userId: string, page: number = 1, limit: number = 50) {
    const safePage = page || 1;
    const safeLimit = limit || 50;
    const skip = Math.max(0, (safePage - 1) * safeLimit);

    const [logs, total] = await Promise.all([
      this.activityLogModel
        .find({ user: userId })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(safeLimit)
        .exec(),
      this.activityLogModel.countDocuments({ user: userId }),
    ]);

    return {
      data: logs,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async getActivityLogsByAction(
    userId: string,
    action: string,
    page: number = 1,
    limit: number = 50,
  ) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.activityLogModel
        .find({ user: userId, action })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.activityLogModel.countDocuments({ user: userId, action }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async clearActivityLogs(userId: string, daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    await this.activityLogModel.deleteMany({
      user: userId,
      timestamp: { $lt: cutoffDate },
    });
  }

  // ==========================================
  // USER STATISTICS
  // ==========================================

  async getUserStatistics(userId: string) {
    const [
      accountAge,
      totalSales,
      totalRevenue,
      inventoryValue,
      totalMedicines,
      activityCount,
    ] = await Promise.all([
      this.userModel.findById(userId).select('createdAt').exec(),
      this.calculateTotalSales(userId),
      this.calculateTotalRevenue(userId),
      this.calculateInventoryValue(userId),
      this.countTotalMedicines(userId),
      this.activityLogModel.countDocuments({ user: userId }),
    ]);

    const now = new Date();
    const created = new Date(accountAge?.createdAt);
    const daysSinceCreation = Math.floor(
      (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      accountAge: {
        days: daysSinceCreation,
        createdAt: created,
      },
      business: {
        totalSales,
        totalRevenue,
        inventoryValue,
        totalMedicines,
      },
      activity: {
        totalActions: activityCount,
        recentLogins: await this.getRecentLogins(userId),
      },
    };
  }

  // Helper methods for statistics
  private async calculateTotalSales(userId: string): Promise<number> {
    // This would query the Sales model
    // For now, return placeholder
    return 0;
  }

  private async calculateTotalRevenue(userId: string): Promise<number> {
    // This would query the Sales model
    // For now, return placeholder
    return 0;
  }

  private async calculateInventoryValue(userId: string): Promise<number> {
    // This would query the Inventory model
    // For now, return placeholder
    return 0;
  }

  private async countTotalMedicines(userId: string): Promise<number> {
    // This would query the Medicines model
    // For now, return placeholder
    return 0;
  }

  private async getRecentLogins(userId: string): Promise<Date[]> {
    const logs = await this.activityLogModel
      .find({ user: userId, action: 'login' })
      .sort({ timestamp: -1 })
      .limit(5)
      .select('timestamp')
      .exec();

    return logs.map(log => log.timestamp);
  }

  // ==========================================
  // SUBSCRIPTION MANAGEMENT
  // ==========================================

  async getSubscriptionInfo(userId: string) {
    const user = await this.userModel.findById(userId).select('subscriptionPlan subscriptionExpiresAt').exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const now = new Date();
    const isExpired = user.subscriptionExpiresAt
      ? user.subscriptionExpiresAt < now
      : false;

    const daysRemaining = user.subscriptionExpiresAt
      ? Math.ceil(
          (user.subscriptionExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
      : null;

    return {
      plan: user.subscriptionPlan,
      expiresAt: user.subscriptionExpiresAt,
      isExpired,
      daysRemaining,
      features: this.getSubscriptionFeatures(user.subscriptionPlan),
    };
  }

  private getSubscriptionFeatures(plan: string) {
    const features = {
      free: {
        maxSalesPerMonth: 100,
        maxInventoryItems: 500,
        maxUsers: 1,
        enableReports: false,
        enableOCR: false,
        enableBackup: false,
        support: 'email',
      },
      basic: {
        maxSalesPerMonth: 1000,
        maxInventoryItems: 5000,
        maxUsers: 3,
        enableReports: true,
        enableOCR: true,
        enableBackup: true,
        support: 'priority_email',
      },
      premium: {
        maxSalesPerMonth: -1, // Unlimited
        maxInventoryItems: -1, // Unlimited
        maxUsers: 10,
        enableReports: true,
        enableOCR: true,
        enableBackup: true,
        support: 'phone_24x7',
      },
    };

    return features[plan] || features.free;
  }

  async upgradeSubscription(
    userId: string,
    plan: 'basic' | 'premium',
    durationDays: number = 365,
  ) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const user = await this.userModel.findByIdAndUpdate(
      userId,
      {
        subscriptionPlan: plan,
        subscriptionExpiresAt: expiresAt,
      },
      { new: true }
    );

    // Log activity
    await this.logActivity(userId, 'subscription_upgrade', `Upgraded to ${plan} plan`);

    return {
      plan: user.subscriptionPlan,
      expiresAt: user.subscriptionExpiresAt,
    };
  }
}
