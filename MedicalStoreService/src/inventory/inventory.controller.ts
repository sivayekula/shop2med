import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { SearchInventoryDto } from './dto/search-inventory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @ApiOperation({ summary: 'Add new inventory batch' })
  @ApiResponse({ status: 201, description: 'Inventory created successfully' })
  async create(
    @Body() createInventoryDto: CreateInventoryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.inventoryService.create(createInventoryDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all inventory items' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.inventoryService.findAll(userId, page, limit);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search inventory with filters' })
  async search(
    @CurrentUser('id') userId: string,
    @Query() searchDto: SearchInventoryDto,
  ) {
    return this.inventoryService.search(userId, searchDto);
  }

  @Get('alerts/low-stock')
  @ApiOperation({ summary: 'Get low stock alerts' })
  async getLowStockAlerts(@CurrentUser('id') userId: string) {
    return this.inventoryService.getLowStockAlerts(userId);
  }

  @Get('alerts/expiry')
  @ApiOperation({ summary: 'Get expiry alerts' })
  async getExpiryAlerts(
    @CurrentUser('id') userId: string,
    @Query('days') days?: number,
  ) {
    return this.inventoryService.getExpiryAlerts(userId, days);
  }

  @Get('alerts/expired')
  @ApiOperation({ summary: 'Get expired items' })
  async getExpiredItems(@CurrentUser('id') userId: string) {
    return this.inventoryService.getExpiredItems(userId);
  }

  @Get('alerts/out-of-stock')
  @ApiOperation({ summary: 'Get out of stock items' })
  async getOutOfStockItems(@CurrentUser('id') userId: string) {
    return this.inventoryService.getOutOfStockItems(userId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get stock summary' })
  async getStockSummary(@CurrentUser('id') userId: string) {
    return this.inventoryService.getStockSummary(userId);
  }

  @Get('medicine/:medicineId')
  @ApiOperation({ summary: 'Get all batches for a medicine' })
  async findByMedicine(
    @Param('medicineId') medicineId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.inventoryService.findByMedicine(medicineId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inventory by ID' })
  async findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.inventoryService.findOne(id, userId);
  }

  @Get(':id/transactions')
  @ApiOperation({ summary: 'Get transaction history for inventory item' })
  async getTransactionHistory(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.inventoryService.getTransactionHistory(id, userId, page, limit);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update inventory item' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
  ) {
    return this.inventoryService.update(id, userId, updateInventoryDto);
  }

  @Patch(':id/adjust')
  @ApiOperation({ summary: 'Adjust stock quantity' })
  async adjustStock(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() adjustStockDto: AdjustStockDto,
  ) {
    return this.inventoryService.adjustStock(id, userId, adjustStockDto);
  }
  
  @Delete(':id')
  @ApiOperation({ summary: 'Delete inventory item (soft delete)' })
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.inventoryService.remove(id, userId);
  }

}
