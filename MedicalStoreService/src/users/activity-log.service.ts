import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { ActivityLog, ActivityLogDocument } from './schemas/activity-log.schema';
import { Request } from 'express';

export interface CreateActivityLogDto {
  user: string;
  action: string;
  description: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectModel(ActivityLog.name) private activityLogModel: Model<ActivityLogDocument>,
  ) {}

  async create(createDto: CreateActivityLogDto, request?: Request): Promise<ActivityLog> {
    const activityLog = new this.activityLogModel({
      ...createDto,
      ipAddress: request?.ip,
      userAgent: request?.get('User-Agent'),
    });

    return await activityLog.save();
  }

  async findByUser(userId: string, limit = 100): Promise<ActivityLog[]> {
    return await this.activityLogModel
      .find({ user: userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('user', 'name email')
      .exec();
  }

  async findByAction(action: string, limit = 100): Promise<ActivityLog[]> {
    return await this.activityLogModel
      .find({ action })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('user', 'name email')
      .exec();
  }

  async findByUserAndAction(userId: string, action: string, limit = 50): Promise<ActivityLog[]> {
    return await this.activityLogModel
      .find({ user: userId, action })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('user', 'name email')
      .exec();
  }

  async findByDateRange(startDate: Date, endDate: Date, limit = 200): Promise<ActivityLog[]> {
    return await this.activityLogModel
      .find({
        timestamp: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('user', 'name email')
      .exec();
  }

  async getStatistics(userId?: string, startDate?: Date, endDate?: Date): Promise<any> {
    const matchQuery: any = {};
    
    if (userId) {
      matchQuery.user = userId;
    }
    
    if (startDate || endDate) {
      matchQuery.timestamp = {};
      if (startDate) matchQuery.timestamp.$gte = startDate;
      if (endDate) matchQuery.timestamp.$lte = endDate;
    }

    const stats = await this.activityLogModel.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          lastOccurrence: { $max: '$timestamp' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return stats;
  }

  async deleteOldLogs(daysToKeep = 90): Promise<{ deletedCount: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.activityLogModel.deleteMany({
      timestamp: { $lt: cutoffDate },
    });

    return { deletedCount: result.deletedCount || 0 };
  }

  // Helper method to log common activities
  async logActivity(
    userId: string,
    action: string,
    description: string,
    metadata?: any,
    request?: Request,
  ): Promise<ActivityLog> {
    return this.create({
      user: userId,
      action,
      description,
      metadata,
      ipAddress: request?.ip,
      userAgent: request?.get('User-Agent'),
    }, request);
  }
}
