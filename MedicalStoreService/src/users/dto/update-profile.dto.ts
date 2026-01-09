import { IsString, IsOptional, IsEmail, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'MediCare Pharmacy' })
  @IsString()
  @IsOptional()
  shopName?: string;

  @ApiPropertyOptional({ example: '123 Main Street, City - 123456' })
  @IsString()
  @IsOptional()
  shopAddress?: string;

  @ApiPropertyOptional({ example: '22AAAAA0000A1Z5' })
  @IsString()
  @IsOptional()
  gstNumber?: string;

  @ApiPropertyOptional({ example: 'DL-12345-67890' })
  @IsString()
  @IsOptional()
  drugLicenseNumber?: string;
}