import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMedicineDto {
  @ApiProperty({ example: 'Paracetamol' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Paracetamol' })
  @IsString()
  @IsOptional()
  genericName?: string;

  @ApiPropertyOptional({ 
    example: 'Tablet',
    enum: ['Tablet', 'Capsule', 'Injection', 'Syrup', 'Cream', 'Ointment', 
           'Drops', 'Gel', 'Lotion', 'Powder', 'Solution', 'Suppository', 
           'Inhaler', 'Spray', 'Unknown']
  })
  @IsEnum(['Tablet', 'Capsule', 'Injection', 'Syrup', 'Cream', 'Ointment', 
           'Drops', 'Gel', 'Lotion', 'Powder', 'Solution', 'Suppository', 
           'Inhaler', 'Spray', 'Unknown'])
  @IsOptional()
  dosageForm?: string;

  @ApiPropertyOptional({ example: '500MG' })
  @IsString()
  @IsOptional()
  strength?: string;

  @ApiPropertyOptional({ example: 'Paracetamol 500mg' })
  @IsString()
  @IsOptional()
  composition?: string;

  @ApiPropertyOptional({ example: '1 Tablet' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ example: '10 tablets' })
  @IsString()
  @IsOptional()
  packSize?: string;

  @ApiPropertyOptional({ example: 0.91 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  ceilingPrice?: number;

  @ApiProperty({ example: 2.0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  mrp?: number;

  @ApiPropertyOptional({ example: 1.5 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  purchasePrice?: number;

  @ApiPropertyOptional({ example: 'Analgesic' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: 'Cipla' })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiPropertyOptional({ example: '30049099' })
  @IsString()
  @IsOptional()
  hsnCode?: string;

  @ApiPropertyOptional({ example: 'IMPORT' })
  @IsString()
  @IsOptional()
  dataSource?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'Allopathy', enum: ['Allopathy', 'Homeopathy', 'Ayurveda', 'Unani', 'Generic', 'Other'] })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ example: ['Crocin', 'Dolo'] })
  @IsString({ each: true })
  @IsOptional()
  substitutes?: string[];

  @ApiPropertyOptional({ example: ['Nausea', 'Headache', 'Dizziness'] })
  @IsString({ each: true })
  @IsOptional()
  sideEffects?: string[];

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  requiresPrescription?: boolean;
}