import { IsOptional, IsString, IsEnum, IsNumber, IsDate, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchSaleDto {
  @ApiPropertyOptional({ example: 'BILL-001' })
  @IsString()
  @IsOptional()
  billNumber?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  customerName?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsString()
  @IsOptional()
  customerPhone?: string;

  @ApiPropertyOptional({ example: 'completed' })
  @IsEnum(['completed', 'cancelled', 'returned'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: 'completed' })
  @IsEnum(['completed', 'pending', 'partial', 'cancelled', 'refunded'])
  @IsOptional()
  paymentStatus?: string;

  @ApiPropertyOptional({ example: 'cash' })
  @IsEnum(['cash', 'card', 'upi', 'netbanking', 'cheque', 'mixed'])
  @IsOptional()
  paymentMethod?: string;

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
