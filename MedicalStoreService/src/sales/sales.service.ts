import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sale, SaleDocument } from './schemas/sale.schema';
import { SaleReturn, SaleReturnDocument } from './schemas/sale-return.schema';
import { Inventory, InventoryDocument } from '../inventory/schemas/inventory.schema';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SearchSaleDto } from './dto/search-sale.dto';
import { CreateSaleReturnDto } from './dto/create-sale-return.dto';

@Injectable()
export class SalesService {
  constructor(
    @InjectModel(Sale.name) private saleModel: Model<SaleDocument>,
    @InjectModel(SaleReturn.name) private saleReturnModel: Model<SaleReturnDocument>,
    @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
  ) {}

  // Create new sale
  async create(createSaleDto: CreateSaleDto, userId: string): Promise<Sale> {
    // Generate bill number
    const billNumber = await this.generateBillNumber(userId);

    // Validate and calculate amounts for each item
    const processedItems = [];
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    for (const item of createSaleDto.items) {
      // Verify inventory exists and has sufficient quantity
      const inventory = await this.inventoryModel.findOne({
        _id: item.inventory,
        user: userId,
        isActive: true,
      }).populate('medicine');

      if (!inventory) {
        throw new NotFoundException(`Inventory item ${item.inventory} not found`);
      }

      const availableQty = inventory.quantity - inventory.soldQuantity - inventory.damagedQuantity;
      
      if (availableQty < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${inventory.medicine['name']}. Available: ${availableQty}`
        );
      }

      // Check if expired
      if (inventory.get('isExpired')) {
        throw new BadRequestException(
          `Cannot sell expired medicine: ${inventory.medicine['name']}`
        );
      }

      // Calculate amounts
      const itemSubtotal = item.unitPrice * item.quantity;
      const discountPercent = item.discountPercent || 0;
      const discountAmount = (itemSubtotal * discountPercent) / 100;
      const amountAfterDiscount = itemSubtotal - discountAmount;
      const taxPercent = item.taxPercent || 0;
      const taxAmount = (amountAfterDiscount * taxPercent) / 100;
      const itemTotal = amountAfterDiscount + taxAmount;

      processedItems.push({
        medicine: item.medicine,
        inventory: item.inventory,
        medicineName: inventory.medicine['name'],
        batchNumber: inventory.batchNumber,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        mrp: inventory.mrp,
        discountPercent,
        discountAmount,
        taxPercent,
        taxAmount,
        totalAmount: itemTotal,
      });

      subtotal += itemSubtotal;
      totalDiscount += discountAmount;
      totalTax += taxAmount;

      // Update inventory sold quantity
      inventory.soldQuantity += item.quantity;
      await inventory.save();
    }

    // Calculate total
    const shippingCharges = createSaleDto.shippingCharges || 0;
    const otherCharges = createSaleDto.otherCharges || 0;
    const totalAmount = subtotal - totalDiscount + totalTax + shippingCharges + otherCharges;
    const balanceDue = totalAmount - createSaleDto.amountPaid;

    // Determine payment status
    let paymentStatus = 'completed';
    if (balanceDue > 0) {
      paymentStatus = createSaleDto.amountPaid > 0 ? 'partial' : 'pending';
    }

    // Create sale
    const sale = new this.saleModel({
      billNumber,
      user: userId,
      saleDate: createSaleDto.saleDate || new Date(),
      customerName: createSaleDto.customerName,
      customerPhone: createSaleDto.customerPhone,
      customerEmail: createSaleDto.customerEmail,
      customerAddress: createSaleDto.customerAddress,
      doctorName: createSaleDto.doctorName,
      prescriptionNumber: createSaleDto.prescriptionNumber,
      items: processedItems,
      subtotal,
      totalDiscount,
      totalTax,
      shippingCharges,
      otherCharges,
      totalAmount,
      amountPaid: createSaleDto.amountPaid,
      balanceDue,
      paymentMethod: createSaleDto.paymentMethod,
      paymentStatus,
      transactionId: createSaleDto.transactionId,
      notes: createSaleDto.notes,
      status: 'completed',
    });

    await sale.save();
    return sale.populate('items.medicine');
  }

  // Get all sales
  async findAll(userId: string, page: number = 1, limit: number = 50) {
    const safePage = page || 1;
    const safeLimit = limit || 50;
    const skip = Math.max(0, (safePage - 1) * safeLimit);

    const [sales, total] = await Promise.all([
      this.saleModel
        .find({ user: userId, isActive: true })
        .populate('items.medicine')
        .sort({ saleDate: -1 })
        .skip(skip)
        .limit(safeLimit)
        .exec(),
      this.saleModel.countDocuments({ user: userId, isActive: true }),
    ]);

    return {
      data: sales,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  // Search sales
  async search(userId: string, searchDto: SearchSaleDto) {
    const {
      billNumber,
      customerName,
      customerPhone,
      status,
      paymentStatus,
      paymentMethod,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
    } = searchDto;

    const filter: any = { user: userId, isActive: true };

    if (billNumber) {
      filter.billNumber = new RegExp(billNumber, 'i');
    }

    if (customerName) {
      filter.customerName = new RegExp(customerName, 'i');
    }

    if (customerPhone) {
      filter.customerPhone = new RegExp(customerPhone, 'i');
    }

    if (status) {
      filter.status = status;
    }

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }

    if (dateFrom || dateTo) {
      filter.saleDate = {};
      if (dateFrom) filter.saleDate.$gte = dateFrom;
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        filter.saleDate.$lte = endDate;
      }
    }

    const safePage = page || 1;
    const safeLimit = limit || 20;
    const skip = Math.max(0, (safePage - 1) * safeLimit);

    const [sales, total] = await Promise.all([
      this.saleModel
        .find(filter)
        .populate('items.medicine')
        .sort({ saleDate: -1 })
        .skip(skip)
        .limit(safeLimit)
        .exec(),
      this.saleModel.countDocuments(filter),
    ]);

    return {
      data: sales,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  // Get sale by ID
  async findOne(id: string, userId: string): Promise<Sale> {
    const sale = await this.saleModel
      .findOne({ _id: id, user: userId })
      .populate('items.medicine')
      .exec();

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    return sale;
  }

  // Get sale by bill number
  async findByBillNumber(billNumber: string, userId: string): Promise<Sale> {
    const sale = await this.saleModel
      .findOne({ billNumber, user: userId })
      .populate('items.medicine')
      .exec();

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    return sale;
  }

  // Cancel sale
  async cancelSale(id: string, userId: string, reason: string): Promise<Sale> {
    const sale = await this.saleModel.findOne({ _id: id, user: userId });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    if (sale.status === 'cancelled') {
      throw new BadRequestException('Sale is already cancelled');
    }

    // Restore inventory quantities
    for (const item of sale.items) {
      await this.inventoryModel.findByIdAndUpdate(item.inventory, {
        $inc: { soldQuantity: -item.quantity },
      });
    }

    sale.status = 'cancelled';
    sale.paymentStatus = 'cancelled';
    sale.cancellationReason = reason;
    sale.cancelledAt = new Date();

    await sale.save();
    return sale.populate('items.medicine');
  }

  // Create sale return
  async createReturn(
    createReturnDto: CreateSaleReturnDto,
    userId: string,
  ): Promise<SaleReturn> {
    // Verify original sale exists
    const originalSale = await this.saleModel.findOne({
      _id: createReturnDto.originalSale,
      user: userId,
    });

    if (!originalSale) {
      throw new NotFoundException('Original sale not found');
    }

    if (originalSale.status === 'cancelled') {
      throw new BadRequestException('Cannot return items from cancelled sale');
    }

    // Generate return number
    const returnNumber = await this.generateReturnNumber(userId);

    // Process return items
    const processedItems = [];
    let totalAmount = 0;

    for (const item of createReturnDto.items) {
      // Find original sale item
      const saleItem = originalSale.items.find(
        si => si.medicine.toString() === item.medicine && 
             si.inventory.toString() === item.inventory
      );

      if (!saleItem) {
        throw new BadRequestException(`Item not found in original sale`);
      }

      if (item.quantity > saleItem.quantity) {
        throw new BadRequestException(
          `Return quantity exceeds sold quantity for medicine`
        );
      }

      // Restore inventory
      const inventory = await this.inventoryModel.findById(item.inventory);
      if (inventory) {
        inventory.soldQuantity -= item.quantity;
        await inventory.save();
      }

      const itemTotal = saleItem.unitPrice * item.quantity;

      processedItems.push({
        medicine: item.medicine,
        inventory: item.inventory,
        quantity: item.quantity,
        unitPrice: saleItem.unitPrice,
        totalAmount: itemTotal,
        reason: item.reason,
      });

      totalAmount += itemTotal;
    }

    // Determine return type
    const returnType = processedItems.length === originalSale.items.length ? 'full' : 'partial';

    // Create return
    const saleReturn = new this.saleReturnModel({
      returnNumber,
      originalSale: createReturnDto.originalSale,
      user: userId,
      returnDate: new Date(),
      items: processedItems,
      totalAmount,
      returnType,
      reason: createReturnDto.reason,
      notes: createReturnDto.notes,
      status: 'completed',
    });

    await saleReturn.save();

    // Update original sale status
    if (returnType === 'full') {
      originalSale.status = 'returned';
      originalSale.paymentStatus = 'refunded';
    }
    await originalSale.save();

    return saleReturn.populate('items.medicine');
  }

  // Get sales analytics
  async getSalesAnalytics(userId: string, dateFrom: Date, dateTo: Date) {
    const filter: any = {
      user: userId,
      isActive: true,
      status: 'completed',
      saleDate: { $gte: dateFrom, $lte: dateTo },
    };

    const [
      totalSales,
      totalRevenue,
      paymentMethods,
      topMedicines,
      dailySales,
    ] = await Promise.all([
      this.saleModel.countDocuments(filter),
      this.saleModel.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      this.saleModel.aggregate([
        { $match: filter },
        { $group: { _id: '$paymentMethod', count: { $sum: 1 }, amount: { $sum: '$totalAmount' } } },
      ]),
      this.saleModel.aggregate([
        { $match: filter },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.medicineName',
            quantity: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.totalAmount' },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: 10 },
      ]),
      this.saleModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } },
            sales: { $sum: 1 },
            revenue: { $sum: '$totalAmount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return {
      summary: {
        totalSales,
        totalRevenue: totalRevenue[0]?.total || 0,
        averageSaleValue: totalSales > 0 ? (totalRevenue[0]?.total || 0) / totalSales : 0,
      },
      paymentMethods,
      topMedicines,
      dailySales,
    };
  }

  // Get sales summary
  async getSalesSummary(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisYear = new Date(today.getFullYear(), 0, 1);

    const [todaySales, monthSales, yearSales, pendingPayments] = await Promise.all([
      this.saleModel.aggregate([
        {
          $match: {
            user: userId,
            isActive: true,
            status: 'completed',
            saleDate: { $gte: today },
          },
        },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$totalAmount' } } },
      ]),
      this.saleModel.aggregate([
        {
          $match: {
            user: userId,
            isActive: true,
            status: 'completed',
            saleDate: { $gte: thisMonth },
          },
        },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$totalAmount' } } },
      ]),
      this.saleModel.aggregate([
        {
          $match: {
            user: userId,
            isActive: true,
            status: 'completed',
            saleDate: { $gte: thisYear },
          },
        },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$totalAmount' } } },
      ]),
      this.saleModel.aggregate([
        {
          $match: {
            user: userId,
            isActive: true,
            paymentStatus: { $in: ['pending', 'partial'] },
          },
        },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$balanceDue' } } },
      ]),
    ]);

    return {
      today: {
        sales: todaySales[0]?.count || 0,
        revenue: todaySales[0]?.total || 0,
      },
      thisMonth: {
        sales: monthSales[0]?.count || 0,
        revenue: monthSales[0]?.total || 0,
      },
      thisYear: {
        sales: yearSales[0]?.count || 0,
        revenue: yearSales[0]?.total || 0,
      },
      pendingPayments: {
        count: pendingPayments[0]?.count || 0,
        amount: pendingPayments[0]?.total || 0,
      },
    };
  }

  // Helper: Generate bill number
  private async generateBillNumber(userId: string): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');

    // Find last bill of the month
    const lastSale = await this.saleModel
      .findOne({
        user: userId,
        billNumber: new RegExp(`^BILL-${year}${month}`),
      })
      .sort({ billNumber: -1 })
      .exec();

    let sequence = 1;
    if (lastSale) {
      const lastSequence = parseInt(lastSale.billNumber.split('-').pop() || '0');
      sequence = lastSequence + 1;
    }

    return `BILL-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }

  // Helper: Generate return number
  private async generateReturnNumber(userId: string): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');

    const lastReturn = await this.saleReturnModel
      .findOne({
        user: userId,
        returnNumber: new RegExp(`^RET-${year}${month}`),
      })
      .sort({ returnNumber: -1 })
      .exec();

    let sequence = 1;
    if (lastReturn) {
      const lastSequence = parseInt(lastReturn.returnNumber.split('-').pop() || '0');
      sequence = lastSequence + 1;
    }

    return `RET-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }
}