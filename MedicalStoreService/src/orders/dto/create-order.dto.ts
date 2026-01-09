import { 
  IsString, 
  IsNumber, 
  IsDate, 
  IsArray, 
  ValidateNested, 
  IsOptional, 
  Min,
  ArrayMinSize,
  IsMongoId,
  IsEnum
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderItemDto {
  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  @IsOptional()
  medicine?: string;

  @ApiProperty({ example: 'Paracetamol' })
  @IsString()
  medicineName: string;

  @ApiPropertyOptional({ example: 'Cipla' })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiPropertyOptional({ example: '500 mg' })
  @IsString()
  @IsOptional()
  strength?: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: 25.50 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  unitPrice?: number;
}

export class CreateOrderDto {
  @ApiPropertyOptional({ example: '2024-01-15' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  orderDate?: Date;

  @ApiPropertyOptional({ example: 'ABC Pharmaceuticals' })
  @IsString()
  @IsOptional()
  supplierName?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsString()
  @IsOptional()
  supplierPhone?: string;

  @ApiPropertyOptional({ example: 'supplier@example.com' })
  @IsString()
  @IsOptional()
  supplierEmail?: string;

  @ApiPropertyOptional({ example: '123 Supplier St, City' })
  @IsString()
  @IsOptional()
  supplierAddress?: string;

  @ApiPropertyOptional({ example: 'INV-2024-001' })
  @IsString()
  @IsOptional()
  supplierInvoiceNumber?: string;

  @ApiPropertyOptional({ example: '2024-01-10' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  supplierInvoiceDate?: Date;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiPropertyOptional({ example: 2500.00 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  subtotal?: number;

  @ApiPropertyOptional({ example: 300.00 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  tax?: number;

  @ApiPropertyOptional({ example: 100.00 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional({ example: 50.00 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  shippingCharges?: number;

  @ApiPropertyOptional({ example: '2024-01-20' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  expectedDeliveryDate?: Date;

  @ApiPropertyOptional({ example: 'Urgent order' })
  @IsString()
  @IsOptional()
  notes?: string;
}