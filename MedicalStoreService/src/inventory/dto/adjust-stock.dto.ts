import { IsNumber, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdjustStockDto {
  @ApiProperty({ example: 10 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ 
    example: 'damage',
    enum: ['sale', 'damage', 'return', 'adjustment']
  })
  @IsEnum(['sale', 'damage', 'return', 'adjustment'])
  type: string;

  @ApiPropertyOptional({ example: 'Damaged during storage' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ example: 'BILL-001' })
  @IsString()
  @IsOptional()
  referenceNumber?: string;
}