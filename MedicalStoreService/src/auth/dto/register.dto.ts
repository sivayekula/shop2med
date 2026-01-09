import { IsString, IsEmail, MinLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password@123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain uppercase, lowercase, number/special character',
  })
  password: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'MediCare Pharmacy' })
  @IsString()
  shopName: string;

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