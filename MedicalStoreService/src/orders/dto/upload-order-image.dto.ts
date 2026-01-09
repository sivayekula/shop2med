
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UploadOrderImageDto {
  @ApiPropertyOptional({ example: 'ABC Pharmaceuticals' })
  @IsString()
  @IsOptional()
  supplierName?: string;

  @ApiPropertyOptional({ example: 'Priority order' })
  @IsString()
  @IsOptional()
  notes?: string;
}