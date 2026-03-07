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
import {
  Inventory,
  InventoryDocument,
} from '../inventory/schemas/inventory.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { SearchOrderDto } from './dto/search-order.dto';
import { OcrService } from './services/ocr.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Medicine.name) private medicineModel: Model<MedicineDocument>,
    @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
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

  // Create order from PDF invoice
  async createFromPdf(
    pdfBuffer: Buffer,
    userId: string,
    supplierName?: string,
    notes?: string,
  ): Promise<Order> {
    const orderNumber = await this.generateOrderNumber(userId);

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

    // Process PDF asynchronously — same pipeline as image OCR but uses pdf-parse
    this.processPdfExtraction(order._id.toString(), pdfBuffer, userId).catch(
      (error) => console.error('PDF extraction failed:', error),
    );

    return order;
  }

  // Process PDF extraction (async) — mirrors processOCR but calls processPdf instead
  private async processPdfExtraction(
    orderId: string,
    pdfBuffer: Buffer,
    userId: string,
  ): Promise<void> {
    try {
      const pdfResult = await this.ocrService.processPdf(pdfBuffer);
      console.log('PDF extraction result:', {
        confidence: pdfResult.confidence,
        itemCount: pdfResult.items.length,
        supplierInfo: pdfResult.supplierInfo,
      });

      // Match each extracted medicine name against the medicines collection
      const matchedItems = await Promise.all(
        pdfResult.items.map(async (item) => {
          const sanitizedName = item.medicineName
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            .replace(/\s+/g, '\\s+')
            .trim();

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
              console.warn('Regex match failed for:', item.medicineName);
            }
          }

          return {
            medicine: medicine?._id,
            medicineName: item.medicineName,
            packing: item.packing,
            packSize: item.packSize,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            mrp: item.mrp,
            cgst: item.cgst,
            sgst: item.sgst,
            totalPrice: item.totalPrice,
            isVerified: false,
            isMatched: !!medicine,
          };
        }),
      );

      const subtotal = matchedItems.reduce(
        (sum, item) => sum + (item.totalPrice || (item.unitPrice || 0) * item.quantity || 0),
        0,
      );

      await this.orderModel.findByIdAndUpdate(orderId, {
        items: matchedItems,
        subtotal,
        totalAmount: subtotal,
        ocrStatus: 'completed',
        ocrRawData: pdfResult,
        ocrProcessedAt: new Date(),
        ...(pdfResult.supplierInfo?.name && { supplierName: pdfResult.supplierInfo.name }),
        ...(pdfResult.supplierInfo?.phone && { supplierPhone: pdfResult.supplierInfo.phone }),
        ...(pdfResult.supplierInfo?.invoiceNumber && {
          supplierInvoiceNumber: pdfResult.supplierInfo.invoiceNumber,
        }),
      });
    } catch (error) {
      console.error('PDF extraction failed for order:', orderId, error);
      await this.orderModel.findByIdAndUpdate(orderId, {
        ocrStatus: 'failed',
        ocrError: error.message || 'PDF extraction error',
        ocrProcessedAt: new Date(),
      });
    }
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
            packing: item.packing,
            packSize: item.packSize,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            mrp: item.mrp,
            cgst: item.cgst,
            sgst: item.sgst,
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

    // Update inventory when order is marked as received
    if (status === 'received') {
      await this.updateInventoryFromOrder(order, userId);
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

  // Update inventory when order is marked as received
  private async updateInventoryFromOrder(
    order: OrderDocument,
    userId: string,
  ): Promise<void> {
    try {
      const updates = [];

      for (const item of order.items) {
        // For unmatched items, we'll still create inventory but without medicine reference
        if (!item.medicine || !item.isMatched) {
          console.log(`Creating inventory for unmatched item: ${item.medicineName}`);
          
          // Create inventory without medicine reference
          const newInventory = {
            user: userId,
            medicineName: item.medicineName, // Store medicine name as string
            batchNumber: `BATCH-${order.orderNumber}-${Date.now()}`,
            quantity: item.quantity,
            purchasePrice: item.unitPrice || 0,
            sellingPrice: item.mrp || item.unitPrice || 0,
            mrp: item.mrp || 0,
            manufactureDate: new Date(),
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
            reorderLevel: 10,
            status: 'active',
            isActive: true,
            notes: `Auto-created from order ${order.orderNumber} (unmatched medicine)`,
          };

          updates.push(this.inventoryModel.create(newInventory));
          continue;
        }

        // For matched items, proceed with normal logic
        // Find existing inventory record for this medicine
        const existingInventory = await this.inventoryModel.findOne({
          medicine: item.medicine,
          user: userId,
          isActive: true,
        });

        if (existingInventory) {
          // Update existing inventory - add the received quantity
          updates.push(
            this.inventoryModel.updateOne(
              { _id: existingInventory._id },
              {
                $inc: { quantity: item.quantity },
                $set: { 
                  updatedAt: new Date(),
                  // Optionally update purchase price if provided
                  ...(item.unitPrice && { purchasePrice: item.unitPrice }),
                },
              },
            ),
          );
        } else {
          // Create new inventory record
          // Note: This requires batch info which might not be in the order
          // For now, create with placeholder batch info
          const newInventory = {
            medicine: item.medicine,
            user: userId,
            batchNumber: `BATCH-${order.orderNumber}-${Date.now()}`,
            quantity: item.quantity,
            purchasePrice: item.unitPrice || 0,
            sellingPrice: item.mrp || item.unitPrice || 0,
            mrp: item.mrp || 0,
            manufactureDate: new Date(),
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
            reorderLevel: 10,
            status: 'active',
            isActive: true,
          };

          updates.push(this.inventoryModel.create(newInventory));
        }
      }

      // Execute all updates
      if (updates.length > 0) {
        await Promise.all(updates);
        console.log(
          `Updated inventory for ${updates.length} items from order ${order.orderNumber}`,
        );
      }
    } catch (error) {
      console.error('Error updating inventory from order:', error);
      // Don't throw - we don't want to fail the order status update if inventory update fails
    }
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
