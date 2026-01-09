
import { IsString, IsNumber, IsArray, ValidateNested, IsOptional, IsMongoId, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReturnItemDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  medicine: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  @IsMongoId()
  inventory: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: 'Damaged product' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class CreateSaleReturnDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439013' })
  @IsMongoId()
  originalSale: string;

  @ApiProperty({ type: [ReturnItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  items: ReturnItemDto[];

  @ApiPropertyOptional({ example: 'Product defect' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ example: 'Refunded via UPI' })
  @IsString()
  @IsOptional()
  notes?: string;
}