import { IsOptional, IsString, IsEnum, IsNumber, IsDate, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchInventoryDto {
  @ApiPropertyOptional({ example: 'para' })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiPropertyOptional({ example: 'active' })
  @IsEnum(['active', 'low_stock', 'expired', 'near_expiry', 'out_of_stock'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: 'ABC Pharmaceuticals' })
  @IsString()
  @IsOptional()
  supplier?: string;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  expiryFrom?: Date;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  expiryTo?: Date;

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
