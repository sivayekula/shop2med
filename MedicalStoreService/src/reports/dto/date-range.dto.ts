import { IsDate, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DateRangeDto {
  @ApiProperty({ example: '2024-01-01' })
  @Type(() => Date)
  @IsDate()
  dateFrom: Date;

  @ApiProperty({ example: '2024-01-31' })
  @Type(() => Date)
  @IsDate()
  dateTo: Date;

  @ApiPropertyOptional({ 
    example: 'json',
    enum: ['json', 'excel', 'csv', 'pdf']
  })
  @IsEnum(['json', 'excel', 'csv', 'pdf'])
  @IsOptional()
  format?: string = 'json';
}