import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SearchSaleDto } from './dto/search-sale.dto';
import { CreateSaleReturnDto } from './dto/create-sale-return.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Sales')
@Controller('sales')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @ApiOperation({ summary: 'Create new sale' })
  @ApiResponse({ status: 201, description: 'Sale created successfully' })
  async create(
    @Body() createSaleDto: CreateSaleDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.salesService.create(createSaleDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sales' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.salesService.findAll(userId, page, limit);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search sales with filters' })
  async search(
    @CurrentUser('id') userId: string,
    @Query() searchDto: SearchSaleDto,
  ) {
    return this.salesService.search(userId, searchDto);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get sales summary' })
  async getSummary(@CurrentUser('id') userId: string) {
    return this.salesService.getSalesSummary(userId);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get sales analytics' })
  async getAnalytics(
    @CurrentUser('id') userId: string,
    @Query('dateFrom') dateFrom: Date,
    @Query('dateTo') dateTo: Date,
  ) {
    return this.salesService.getSalesAnalytics(userId, dateFrom, dateTo);
  }

  @Get('bill/:billNumber')
  @ApiOperation({ summary: 'Get sale by bill number' })
  async findByBillNumber(
    @Param('billNumber') billNumber: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.salesService.findByBillNumber(billNumber, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sale by ID' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.salesService.findOne(id, userId);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel sale' })
  async cancelSale(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('reason') reason: string,
  ) {
    return this.salesService.cancelSale(id, userId, reason);
  }

  @Post('returns')
  @ApiOperation({ summary: 'Create sale return' })
  async createReturn(
    @Body() createReturnDto: CreateSaleReturnDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.salesService.createReturn(createReturnDto, userId);
  }
}