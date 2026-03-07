import { IsString, IsNumber, IsDate, IsOptional, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FulfillOrderItemDto {
  @ApiProperty()
  @IsNotEmpty()
  orderItemIndex: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  batchNumber: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  expiryDate: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  manufactureDate: Date;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  reorderLevel?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  rackNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  shelfNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class FulfillOrderDto {
  @ApiProperty({ description: 'Array of order items with inventory details' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FulfillOrderItemDto)
  items: FulfillOrderItemDto[];

  @ApiPropertyOptional({ description: 'Override default purchase prices if needed' })
  @IsNumber()
  @IsOptional()
  overridePurchasePrice?: number;

  @ApiPropertyOptional({ description: 'Override default selling prices if needed' })
  @IsNumber()
  @IsOptional()
  overrideSellingPrice?: number;

  @ApiPropertyOptional({ description: 'Notes for the fulfillment' })
  @IsString()
  @IsOptional()
  notes?: string;
}
