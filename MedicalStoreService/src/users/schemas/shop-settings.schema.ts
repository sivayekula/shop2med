import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ShopSettingsDocument = ShopSettings & Document;

@Schema({ timestamps: true })
export class ShopSettings {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  user: Types.ObjectId;

  // Business Hours
  @Prop({ default: '09:00 AM' })
  openingTime: string;

  @Prop({ default: '09:00 PM' })
  closingTime: string;

  @Prop({ default: 'Mon-Sat' })
  workingDays: string;

  // Invoice Settings
  @Prop({ default: 'BILL' })
  invoicePrefix: string;

  @Prop({ default: true })
  autoInvoiceNumber: boolean;

  @Prop({ default: 'Thank you for your business!' })
  invoiceFooter: string;

  @Prop({ default: true })
  printLogo: boolean;

  @Prop({ default: true })
  printShopDetails: boolean;

  // Tax Settings
  @Prop({ default: 12, min: 0, max: 100 })
  defaultTaxRate: number;

  @Prop({ default: true })
  enableGST: boolean;

  @Prop({ default: true })
  includeGSTInPrice: boolean;

  // Stock Alerts
  @Prop({ default: 10, min: 0 })
  defaultReorderLevel: number;

  @Prop({ default: 30, min: 1 })
  expiryAlertDays: number;

  @Prop({ default: true })
  enableLowStockAlerts: boolean;

  @Prop({ default: true })
  enableExpiryAlerts: boolean;

  @Prop({ default: true })
  enableOutOfStockAlerts: boolean;

  // Notification Settings
  @Prop({ default: true })
  enableEmailNotifications: boolean;

  @Prop({ default: false })
  enableSMSNotifications: boolean;

  @Prop({ default: false })
  enableWhatsAppNotifications: boolean;

  @Prop()
  notificationEmail?: string;

  @Prop()
  notificationPhone?: string;

  // Display Settings
  @Prop({ default: 'INR' })
  currency: string;

  @Prop({ default: 'en-IN' })
  locale: string;

  @Prop({ default: 'Asia/Kolkata' })
  timezone: string;

  @Prop({ default: 'DD/MM/YYYY' })
  dateFormat: string;

  // Backup Settings
  @Prop({ default: false })
  autoBackup: boolean;

  @Prop({ default: 7 })
  backupFrequencyDays: number;

  @Prop({ type: Date })
  lastBackupDate?: Date;

  // Feature Flags
  @Prop({ default: true })
  enableBarcode: boolean;

  @Prop({ default: true })
  enableOCR: boolean;

  @Prop({ default: true })
  enableReports: boolean;

  @Prop({ default: false })
  enableMultiUser: boolean;
}

export const ShopSettingsSchema = SchemaFactory.createForClass(ShopSettings);