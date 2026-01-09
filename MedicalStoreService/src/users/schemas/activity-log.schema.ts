import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ActivityLogDocument = ActivityLog & Document;

@Schema({ timestamps: true })
export class ActivityLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({
    type: String,
    enum: [
      'login',
      'logout',
      'profile_update',
      'settings_update',
      'medicine_add',
      'medicine_update',
      'medicine_delete',
      'inventory_add',
      'inventory_update',
      'sale_create',
      'sale_cancel',
      'order_create',
      'order_update',
      'report_generate',
    ],
    required: true,
    index: true,
  })
  action: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Object })
  metadata?: any;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  @Prop({ type: Date, default: Date.now, index: true })
  timestamp: Date;
}

export const ActivityLogSchema = SchemaFactory.createForClass(ActivityLog);

ActivityLogSchema.index({ user: 1, timestamp: -1 });
ActivityLogSchema.index({ action: 1, timestamp: -1 });