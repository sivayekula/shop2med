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
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MedicinesService } from './medicines.service';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { UpdateMedicineDto } from './dto/update-medicine.dto';
import { SearchMedicineDto } from './dto/search-medicine.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@ApiTags('Medicines')
@Controller('medicines')
@UseGuards(JwtAuthGuard)
export class MedicinesController {
  constructor(private readonly medicinesService: MedicinesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new medicine' })
  @ApiResponse({ status: 201, description: 'Medicine created successfully' })
  async create(@Body() createMedicineDto: CreateMedicineDto, @CurrentUser('id') userId: string) {
    return this.medicinesService.create(createMedicineDto, userId);
  }

  @Post('find-or-create')
  @ApiOperation({ summary: 'Find existing medicine or create new one (Smart Entry)' })
  async findOrCreate(@Body() createMedicineDto: CreateMedicineDto, @CurrentUser('id') userId: string) {
    return this.medicinesService.findOrCreate(createMedicineDto, userId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search medicines with filters' })
  async search(@Query() searchDto: SearchMedicineDto) {
    return this.medicinesService.search(searchDto);
  }

  @Get('autocomplete')
  @ApiOperation({ summary: 'Autocomplete for medicine name' })
  async autocomplete(@Query('q') query: string) {
    return this.medicinesService.autocomplete(query);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular medicines' })
  async getPopular(@Query('limit') limit?: number) {
    return this.medicinesService.getPopular(limit);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all medicine categories' })
  async getCategories() {
    return this.medicinesService.getCategories();
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get medicines by category' })
  async findByCategory(@Param('category') category: string) {
    return this.medicinesService.findByCategory(category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get medicine by ID' })
  async findOne(@Param('id') id: string) {
    return this.medicinesService.findOne(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all medicines' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.medicinesService.findAll(page, limit);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update medicine' })
  async update(
    @Param('id') id: string,
    @Body() updateMedicineDto: UpdateMedicineDto,
  ) {
    return this.medicinesService.update(id, updateMedicineDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete medicine (soft delete)' })
  async remove(@Param('id') id: string) {
    return this.medicinesService.remove(id);
  }

  @Post(':id/record-usage')
  @ApiOperation({ summary: 'Record medicine usage (when sold)' })
  async recordUsage(@Param('id') id: string) {
    await this.medicinesService.recordUsage(id);
    return { message: 'Usage recorded successfully' };
  }
}
