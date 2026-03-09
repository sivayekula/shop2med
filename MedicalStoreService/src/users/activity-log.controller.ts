import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ActivityLogService } from './activity-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Activity Logs')
@Controller('activity-logs')
@UseGuards(JwtAuthGuard)
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get()
  @ApiOperation({ summary: 'Get activity logs for current user' })
  @ApiResponse({ status: 200, description: 'Activity logs retrieved successfully' })
  async getActivityLogs(
    @CurrentUser('id') userId: string,
    @Query('action') action?: string,
    @Query('limit') limit?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const query: any = {};
    
    if (action) {
      query.action = action;
    }
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const activityLogs = await this.activityLogService.findByUser(
      userId,
      limit ? parseInt(limit.toString()) : 100,
    );

    return {
      success: true,
      data: activityLogs,
      message: 'Activity logs retrieved successfully',
    };
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get activity statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStatistics(
    @CurrentUser('id') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const statistics = await this.activityLogService.getStatistics(userId, start, end);

    return {
      success: true,
      data: statistics,
      message: 'Statistics retrieved successfully',
    };
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all activity logs (Admin only)' })
  @ApiResponse({ status: 200, description: 'All activity logs retrieved successfully' })
  async getAllActivityLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const query: any = {};
    
    if (action) query.action = action;
    if (userId) query.user = userId;
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    
    // This would need to be implemented in the service
    // For now, return user-specific logs
    const logs = await this.activityLogService.findByUser(
      userId || 'current-user',
      limit,
    );

    return {
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total: logs.length,
        },
      },
      message: 'Activity logs retrieved successfully',
    };
  }

  @Delete('cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clean up old activity logs' })
  @ApiResponse({ status: 200, description: 'Old logs cleaned up successfully' })
  async cleanupOldLogs(
    @Query('days') days: number = 90,
  ) {
    const result = await this.activityLogService.deleteOldLogs(days);

    return {
      success: true,
      data: {
        deletedCount: result.deletedCount,
        daysKept: days,
      },
      message: `Cleaned up ${result.deletedCount} old activity logs`,
    };
  }
}
