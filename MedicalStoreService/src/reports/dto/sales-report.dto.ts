import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DateRangeDto } from './date-range.dto';

export class SalesReportDto extends DateRangeDto {
  @ApiPropertyOptional({ 
    example: 'daily',
    enum: ['daily', 'weekly', 'monthly', 'yearly']
  })
  @IsEnum(['daily', 'weekly', 'monthly', 'yearly'])
  @IsOptional()
  groupBy?: string = 'daily';

  @ApiPropertyOptional({ example: 'cash' })
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'completed' })
  @IsOptional()
  status?: string;
}