
import { 
  IsString, 
  IsNumber, 
  IsDate, 
  IsArray, 
  ValidateNested, 
  IsOptional, 
  IsEnum,
  Min,
  ArrayMinSize,
  IsMongoId
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSaleItemDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  medicine: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  @IsMongoId()
  inventory: string;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 32.00 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ example: 5 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discountPercent?: number;

  @ApiPropertyOptional({ example: 12 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  taxPercent?: number;
}

export class CreateSaleDto {
  @ApiPropertyOptional({ example: '2024-01-15' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  saleDate?: Date;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  customerName?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsString()
  @IsOptional()
  customerPhone?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsString()
  @IsOptional()
  customerEmail?: string;

  @ApiPropertyOptional({ example: '123 Main St, City' })
  @IsString()
  @IsOptional()
  customerAddress?: string;

  @ApiPropertyOptional({ example: 'Dr. Smith' })
  @IsString()
  @IsOptional()
  doctorName?: string;

  @ApiPropertyOptional({ example: 'RX-123456' })
  @IsString()
  @IsOptional()
  prescriptionNumber?: string;

  @ApiProperty({ type: [CreateSaleItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];

  @ApiPropertyOptional({ example: 10 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  shippingCharges?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  otherCharges?: number;

  @ApiProperty({ example: 160.00 })
  @IsNumber()
  @Min(0)
  amountPaid: number;

  @ApiProperty({ 
    example: 'cash',
    enum: ['cash', 'card', 'upi', 'netbanking', 'cheque', 'mixed']
  })
  @IsEnum(['cash', 'card', 'upi', 'netbanking', 'cheque', 'mixed'])
  paymentMethod: string;

  @ApiPropertyOptional({ example: 'TXN123456' })
  @IsString()
  @IsOptional()
  transactionId?: string;

  @ApiPropertyOptional({ example: 'Customer requested discount' })
  @IsString()
  @IsOptional()
  notes?: string;
}