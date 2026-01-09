
import { IsOptional, IsString, IsEnum, IsNumber, IsDate, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchOrderDto {
  @ApiPropertyOptional({ example: 'ORD-202401-0001' })
  @IsString()
  @IsOptional()
  orderNumber?: string;

  @ApiPropertyOptional({ example: 'ABC Pharmaceuticals' })
  @IsString()
  @IsOptional()
  supplierName?: string;

  @ApiPropertyOptional({ example: 'draft' })
  @IsEnum(['draft', 'pending', 'confirmed', 'partially_received', 'received', 'cancelled'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: 'pending' })
  @IsEnum(['pending', 'processing', 'completed', 'failed'])
  @IsOptional()
  ocrStatus?: string;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dateFrom?: Date;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dateTo?: Date;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 20;
}
