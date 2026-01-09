import { IsString, IsOptional, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateShopSettingsDto {
  // Business Hours
  @ApiPropertyOptional({ example: '09:00 AM' })
  @IsString()
  @IsOptional()
  openingTime?: string;

  @ApiPropertyOptional({ example: '09:00 PM' })
  @IsString()
  @IsOptional()
  closingTime?: string;

  @ApiPropertyOptional({ example: 'Mon-Sat' })
  @IsString()
  @IsOptional()
  workingDays?: string;

  // Invoice Settings
  @ApiPropertyOptional({ example: 'BILL' })
  @IsString()
  @IsOptional()
  invoicePrefix?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  autoInvoiceNumber?: boolean;

  @ApiPropertyOptional({ example: 'Thank you for your business!' })
  @IsString()
  @IsOptional()
  invoiceFooter?: string;

  // Tax Settings
  @ApiPropertyOptional({ example: 12 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  defaultTaxRate?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  enableGST?: boolean;

  // Stock Alerts
  @ApiPropertyOptional({ example: 10 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  defaultReorderLevel?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  expiryAlertDays?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  enableLowStockAlerts?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  enableExpiryAlerts?: boolean;

  // Notification Settings
  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  enableEmailNotifications?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  enableSMSNotifications?: boolean;

  // Display Settings
  @ApiPropertyOptional({ example: 'INR' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ example: 'en-IN' })
  @IsString()
  @IsOptional()
  locale?: string;

  @ApiPropertyOptional({ example: 'Asia/Kolkata' })
  @IsString()
  @IsOptional()
  timezone?: string;
}