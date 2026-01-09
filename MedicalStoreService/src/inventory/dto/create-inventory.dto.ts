import { IsString, IsNumber, IsDate, IsOptional, Min, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInventoryDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  medicine: string;

  @ApiProperty({ example: 'BATCH-2024-001' })
  @IsString()
  batchNumber: string;

  @ApiProperty({ example: '2025-12-31' })
  @Type(() => Date)
  @IsDate()
  expiryDate: Date;

  @ApiProperty({ example: '2024-01-15' })
  @Type(() => Date)
  @IsDate()
  manufactureDate: Date;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ example: 25.50 })
  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @ApiProperty({ example: 32.00 })
  @IsNumber()
  @Min(0)
  sellingPrice: number;

  @ApiPropertyOptional({ example: 35.00 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  mrp?: number;

  @ApiPropertyOptional({ example: 'ABC Pharmaceuticals' })
  @IsString()
  @IsOptional()
  supplier?: string;

  @ApiPropertyOptional({ example: 'INV-2024-001' })
  @IsString()
  @IsOptional()
  supplierInvoiceNumber?: string;

  @ApiPropertyOptional({ example: '2024-01-10' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  purchaseDate?: Date;

  @ApiPropertyOptional({ example: 'A1' })
  @IsString()
  @IsOptional()
  rackNumber?: string;

  @ApiPropertyOptional({ example: 'S3' })
  @IsString()
  @IsOptional()
  shelfNumber?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  reorderLevel?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  expiryAlertDays?: number;

  @ApiPropertyOptional({ example: 'Keep in cool place' })
  @IsString()
  @IsOptional()
  notes?: string;
}