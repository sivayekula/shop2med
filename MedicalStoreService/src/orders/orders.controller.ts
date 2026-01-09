import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { SearchOrderDto } from './dto/search-order.dto';
import { UploadOrderImageDto } from './dto/upload-order-image.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}
  @Post()
  @ApiOperation({ summary: 'Create order manually' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.ordersService.create(createOrderDto, userId);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Create order from image (OCR)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadOrderImageDto,
    @CurrentUser('id') userId: string,
  ) {
    console.log('File:', file);
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    // Validate file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG, and WebP images are allowed',
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('Image size must be less than 10MB');
    }

    return this.ordersService.createFromImage(
      file.buffer,
      userId,
      uploadDto.supplierName,
      uploadDto.notes,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ordersService.findAll(userId, page, limit);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search orders with filters' })
  async search(
    @CurrentUser('id') userId: string,
    @Query() searchDto: SearchOrderDto,
  ) {
    return this.ordersService.search(userId, searchDto);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get orders summary' })
  async getSummary(@CurrentUser('id') userId: string) {
    return this.ordersService.getOrdersSummary(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  async findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.ordersService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update order' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.ordersService.update(id, userId, updateOrderDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('status') status: string,
  ) {
    return this.ordersService.updateStatus(id, userId, status);
  }

  @Patch(':id/items/:itemIndex/verify')
  @ApiOperation({ summary: 'Verify and update OCR item' })
  async verifyItem(
    @Param('id') id: string,
    @Param('itemIndex') itemIndex: number,
    @CurrentUser('id') userId: string,
    @Body() updates: any,
  ) {
    return this.ordersService.verifyItem(id, +itemIndex, userId, updates);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete order (soft delete)' })
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.ordersService.remove(id, userId);
  }
  
}
