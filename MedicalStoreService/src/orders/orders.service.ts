import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import {
  Medicine,
  MedicineDocument,
} from '../medicines/schemas/medicine.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { SearchOrderDto } from './dto/search-order.dto';
import { OcrService } from './services/ocr.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Medicine.name) private medicineModel: Model<MedicineDocument>,
    private ocrService: OcrService,
  ) {}

  // Create order manually
  async create(createOrderDto: CreateOrderDto, userId: string): Promise<Order> {
    const orderNumber = await this.generateOrderNumber(userId);

    // Calculate totals if not provided
    let subtotal = createOrderDto.subtotal;
    if (!subtotal && createOrderDto.items.length > 0) {
      subtotal = createOrderDto.items.reduce((sum, item) => {
        return sum + (item.unitPrice || 0) * item.quantity;
      }, 0);
    }

    const tax = createOrderDto.tax || 0;
    const discount = createOrderDto.discount || 0;
    const shippingCharges = createOrderDto.shippingCharges || 0;
    const totalAmount = (subtotal || 0) - discount + tax + shippingCharges;

    // Try to match medicines with database
    const processedItems = await Promise.all(
      createOrderDto.items.map(async (item) => {
        let medicine = null;
        let isMatched = false;

        if (item.medicine) {
          medicine = item.medicine;
          isMatched = true;
        } else {
          // Try to find medicine by name
          const foundMedicine = await this.medicineModel.findOne({
            name: new RegExp(item.medicineName, 'i'),
            isActive: true,
          });

          if (foundMedicine) {
            medicine = foundMedicine._id;
            isMatched = true;
          }
        }

        return {
          ...item,
          medicine,
          isMatched,
          isVerified: true, // Manual entry is pre-verified
          totalPrice: item.unitPrice
            ? item.unitPrice * item.quantity
            : undefined,
        };
      }),
    );

    const order = new this.orderModel({
      orderNumber,
      user: userId,
      orderDate: createOrderDto.orderDate || new Date(),
      supplierName: createOrderDto.supplierName,
      supplierPhone: createOrderDto.supplierPhone,
      supplierEmail: createOrderDto.supplierEmail,
      supplierAddress: createOrderDto.supplierAddress,
      supplierInvoiceNumber: createOrderDto.supplierInvoiceNumber,
      supplierInvoiceDate: createOrderDto.supplierInvoiceDate,
      items: processedItems,
      subtotal,
      tax,
      discount,
      shippingCharges,
      totalAmount,
      expectedDeliveryDate: createOrderDto.expectedDeliveryDate,
      notes: createOrderDto.notes,
      status: 'draft',
      ocrStatus: 'completed', // Manual entry, no OCR needed
    });

    await order.save();
    return order.populate('items.medicine');
  }

  // Create order from image (OCR)
  async createFromImage(
    imageBuffer: Buffer,
    userId: string,
    supplierName?: string,
    notes?: string,
  ): Promise<Order> {
    // Generate order number
    const orderNumber = await this.generateOrderNumber(userId);

    // Create initial order with pending OCR status
    const order = new this.orderModel({
      orderNumber,
      user: userId,
      orderDate: new Date(),
      supplierName,
      notes,
      items: [],
      status: 'draft',
      ocrStatus: 'processing',
    });

    await order.save();

    // Process OCR asynchronously
    this.processOCR(order._id.toString(), imageBuffer, userId).catch(
      (error) => {
        console.error('OCR processing failed:', error);
      },
    );

    return order;
  }

  // Process OCR (async)
  private async processOCR(
    orderId: string,
    imageBuffer: Buffer,
    userId: string,
  ): Promise<void> {
    try {
      // Process image with OCR
      const ocrResult = await this.ocrService.processImage(imageBuffer);
      console.log('OCR Result:', ocrResult);
      // Match medicines with database
      const matchedItems = await Promise.all(
        ocrResult.items.map(async (item) => {
          // Sanitize medicine name for regex matching
          const sanitizedName = item.medicineName
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
            .replace(/\s+/g, '\\s+') // Replace spaces with \s+ to match any whitespace
            .trim();

          // Only try to match if we have a valid name
          let medicine = null;
          if (sanitizedName && sanitizedName.length > 2) {
            try {
              medicine = await this.medicineModel.findOne({
                $or: [
                  { name: new RegExp(sanitizedName, 'i') },
                  { genericName: new RegExp(sanitizedName, 'i') },
                ],
                isActive: true,
              });
            } catch (regexError) {
              console.warn('Regex matching failed for medicine:', item.medicineName, regexError.message);
              // Continue without matching
            }
          }

          return {
            medicine: medicine?._id,
            medicineName: item.medicineName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            isVerified: false, // Requires manual verification
            isMatched: !!medicine,
          };
        }),
      );

      // Calculate totals
      const subtotal = matchedItems.reduce((sum, item) => {
        return sum + (item.totalPrice || item.unitPrice * item.quantity || 0);
      }, 0);

      // Update order with OCR results
      await this.orderModel.findByIdAndUpdate(orderId, {
        items: matchedItems,
        subtotal,
        totalAmount: subtotal,
        ocrStatus: 'completed',
        ocrRawData: ocrResult,
        ocrProcessedAt: new Date(),
        supplierName: ocrResult.supplierInfo?.name || undefined,
        supplierPhone: ocrResult.supplierInfo?.phone || undefined,
        supplierInvoiceNumber:
          ocrResult.supplierInfo?.invoiceNumber || undefined,
      });
    } catch (error) {
      console.error('OCR processing failed for order:', orderId, error);
      
      // Update order with error but don't fail completely
      await this.orderModel.findByIdAndUpdate(orderId, {
        ocrStatus: 'failed',
        ocrError: error.message || 'Unknown OCR processing error',
        ocrProcessedAt: new Date(),
      });
    }
  }

  // Get all orders
  async findAll(userId: string, page: number = 1, limit: number = 50) {
    const safePage = page || 1;
    const safeLimit = limit || 50;
    const skip = Math.max(0, (safePage - 1) * safeLimit);

    const [orders, total] = await Promise.all([
      this.orderModel
        .find({ user: userId, isActive: true })
        .populate('items.medicine')
        .sort({ orderDate: -1 })
        .skip(skip)
        .limit(safeLimit)
        .exec(),
      this.orderModel.countDocuments({ user: userId, isActive: true }),
    ]);

    return {
      data: orders,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  // Search orders
  async search(userId: string, searchDto: SearchOrderDto) {
    const {
      orderNumber,
      supplierName,
      status,
      ocrStatus,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
    } = searchDto;

    const filter: any = { user: userId, isActive: true };

    if (orderNumber) {
      filter.orderNumber = new RegExp(orderNumber, 'i');
    }

    if (supplierName) {
      filter.supplierName = new RegExp(supplierName, 'i');
    }

    if (status) {
      filter.status = status;
    }

    if (ocrStatus) {
      filter.ocrStatus = ocrStatus;
    }

    if (dateFrom || dateTo) {
      filter.orderDate = {};
      if (dateFrom) filter.orderDate.$gte = dateFrom;
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        filter.orderDate.$lte = endDate;
      }
    }

    const safePage = page || 1;
    const safeLimit = limit || 20;
    const skip = Math.max(0, (safePage - 1) * safeLimit);

    const [orders, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .populate('items.medicine')
        .sort({ orderDate: -1 })
        .skip(skip)
        .limit(safeLimit)
        .exec(),
      this.orderModel.countDocuments(filter),
    ]);

    return {
      data: orders,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  // Get order by ID
  async findOne(id: string, userId: string): Promise<Order> {
    const order = await this.orderModel
      .findOne({ _id: id, user: userId })
      .populate('items.medicine')
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  // Update order
  async update(
    id: string,
    userId: string,
    updateDto: UpdateOrderDto,
  ): Promise<Order> {
    const order = await this.orderModel
      .findOneAndUpdate({ _id: id, user: userId }, updateDto, { new: true })
      .populate('items.medicine')
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  // Update order status
  async updateStatus(
    id: string,
    userId: string,
    status: string,
  ): Promise<Order> {
    const validStatuses = [
      'draft',
      'pending',
      'confirmed',
      'partially_received',
      'received',
      'cancelled',
    ];

    if (!validStatuses.includes(status)) {
      throw new BadRequestException(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      );
    }

    const order = await this.orderModel
      .findOneAndUpdate(
        { _id: id, user: userId },
        {
          status,
          ...(status === 'received' && { receivedDate: new Date() }),
        },
        { new: true },
      )
      .populate('items.medicine')
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  // Verify OCR item
  async verifyItem(
    orderId: string,
    itemIndex: number,
    userId: string,
    updates: Partial<any>,
  ): Promise<Order> {
    const order = await this.orderModel.findOne({ _id: orderId, user: userId });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (itemIndex < 0 || itemIndex >= order.items.length) {
      throw new BadRequestException('Invalid item index');
    }

    // Update item
    Object.assign(order.items[itemIndex], {
      ...updates,
      isVerified: true,
    });

    await order.save();
    return order.populate('items.medicine');
  }

  // Delete order
  async remove(id: string, userId: string): Promise<void> {
    const result = await this.orderModel
      .findOneAndUpdate(
        { _id: id, user: userId },
        { isActive: false },
        { new: true },
      )
      .exec();

    if (!result) {
      throw new NotFoundException('Order not found');
    }
  }

  // Get orders summary
  async getOrdersSummary(userId: string) {
    const [
      totalOrders,
      draftOrders,
      pendingOrders,
      receivedOrders,
      pendingOCR,
    ] = await Promise.all([
      this.orderModel.countDocuments({ user: userId, isActive: true }),
      this.orderModel.countDocuments({
        user: userId,
        status: 'draft',
        isActive: true,
      }),
      this.orderModel.countDocuments({
        user: userId,
        status: 'pending',
        isActive: true,
      }),
      this.orderModel.countDocuments({
        user: userId,
        status: 'received',
        isActive: true,
      }),
      this.orderModel.countDocuments({
        user: userId,
        ocrStatus: 'processing',
        isActive: true,
      }),
    ]);

    return {
      totalOrders,
      byStatus: {
        draft: draftOrders,
        pending: pendingOrders,
        received: receivedOrders,
      },
      pendingOCR,
    };
  }

  private async generateOrderNumber(userId: string): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const lastOrder = await this.orderModel
      .findOne({
        user: userId,
        orderNumber: new RegExp(`^ORD-${year}${month}`),
      })
      .sort({ orderNumber: -1 })
      .exec();

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(
        lastOrder.orderNumber.split('-').pop() || '0',
      );
      sequence = lastSequence + 1;
    }

    return `ORD-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }
}
