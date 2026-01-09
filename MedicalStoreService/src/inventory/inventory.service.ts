import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ConflictException 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Inventory, InventoryDocument } from './schemas/inventory.schema';
import { StockTransaction, StockTransactionDocument } from './schemas/stock-transaction.schema';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { SearchInventoryDto } from './dto/search-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
    @InjectModel(StockTransaction.name) 
    private transactionModel: Model<StockTransactionDocument>,
  ) {}

  // Create new inventory batch
  async create(createInventoryDto: CreateInventoryDto, userId: string): Promise<Inventory> {
    // Check if batch already exists for this medicine
    const existingBatch = await this.inventoryModel.findOne({
      medicine: createInventoryDto.medicine,
      batchNumber: createInventoryDto.batchNumber,
      user: userId,
    });

    if (existingBatch) {
      throw new ConflictException(
        'Batch number already exists for this medicine. Use update to add more stock.'
      );
    }

    // Validate dates
    if (createInventoryDto.expiryDate <= new Date()) {
      throw new BadRequestException('Expiry date must be in the future');
    }

    if (createInventoryDto.manufactureDate > new Date()) {
      throw new BadRequestException('Manufacture date cannot be in the future');
    }

    if (createInventoryDto.manufactureDate >= createInventoryDto.expiryDate) {
      throw new BadRequestException('Manufacture date must be before expiry date');
    }

    const inventory = new this.inventoryModel({
      ...createInventoryDto,
      user: userId,
    });

    await inventory.save();

    // Record transaction
    await this.recordTransaction({
      inventory: inventory._id,
      user: userId,
      type: 'purchase',
      quantity: createInventoryDto.quantity,
      previousQuantity: 0,
      newQuantity: createInventoryDto.quantity,
      reason: 'Initial stock purchase',
      referenceNumber: createInventoryDto.supplierInvoiceNumber,
    });

    return inventory.populate('medicine');
  }

  // Get all inventory for a user
  async findAll(userId: string, page: number = 1, limit: number = 50) {
    const safePage = page || 1;
    const safeLimit = limit || 50;
    const skip = Math.max(0, (safePage - 1) * safeLimit);
    const [inventory, total] = await Promise.all([
      this.inventoryModel
        .find({ user: userId, isActive: true })
        .populate('medicine')
        .sort({ expiryDate: 1, quantity: 1 })
        .skip(skip)
        .limit(safeLimit)
        .exec(),
      this.inventoryModel.countDocuments({ user: userId, isActive: true }),
    ]);

    return {
      data: inventory,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  // Search inventory with filters
  async search(userId: string, searchDto: SearchInventoryDto) {
    const { query, status, supplier, expiryFrom, expiryTo, page = 1, limit = 20 } = searchDto;
    
    const filter: any = { user: userId, isActive: true };

    if (status) {
      filter.status = status;
    }

    if (supplier) {
      filter.supplier = new RegExp(supplier, 'i');
    }

    if (expiryFrom || expiryTo) {
      filter.expiryDate = {};
      if (expiryFrom) filter.expiryDate.$gte = expiryFrom;
      if (expiryTo) filter.expiryDate.$lte = expiryTo;
    }

    const safePage = page || 1;
    const safeLimit = limit || 20;
    const skip = Math.max(0, (safePage - 1) * safeLimit);

    let inventoryQuery = this.inventoryModel.find(filter);

    // If text search query, populate medicine and filter
    if (query) {
      inventoryQuery = inventoryQuery.populate({
        path: 'medicine',
        match: { 
          $or: [
            { name: new RegExp(query, 'i') },
            { genericName: new RegExp(query, 'i') },
          ]
        }
      });
    } else {
      inventoryQuery = inventoryQuery.populate('medicine');
    }

    const [inventory, total] = await Promise.all([
      inventoryQuery
        .sort({ expiryDate: 1 })
        .skip(skip)
        .limit(safeLimit)
        .exec(),
      this.inventoryModel.countDocuments(filter),
    ]);

    // Filter out null medicines (from populate match)
    const filteredInventory = inventory.filter(item => item.medicine !== null);

    return {
      data: filteredInventory,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: query ? filteredInventory.length : total,
        totalPages: Math.ceil((query ? filteredInventory.length : total) / safeLimit),
      },
    };
  }

  // Get inventory by ID
  async findOne(id: string, userId: string): Promise<Inventory> {
    const inventory = await this.inventoryModel
      .findOne({ _id: id, user: userId })
      .populate('medicine')
      .exec();

    if (!inventory) {
      throw new NotFoundException('Inventory item not found');
    }

    return inventory;
  }

  // Get all batches for a specific medicine
  async findByMedicine(medicineId: string, userId: string): Promise<Inventory[]> {
    return this.inventoryModel
      .find({ 
        medicine: medicineId, 
        user: userId, 
        isActive: true 
      })
      .sort({ expiryDate: 1 })
      .exec();
  }

  // Update inventory
  async update(id: string, userId: string, updateDto: UpdateInventoryDto): Promise<Inventory> {
    const inventory = await this.inventoryModel
      .findOneAndUpdate(
        { _id: id, user: userId },
        updateDto,
        { new: true }
      )
      .populate('medicine')
      .exec();

    if (!inventory) {
      throw new NotFoundException('Inventory item not found');
    }

    return inventory;
  }

  // Adjust stock (add/remove quantity)
  async adjustStock(
    id: string, 
    userId: string, 
    adjustDto: AdjustStockDto
  ): Promise<Inventory> {
    const inventory = await this.inventoryModel.findOne({ _id: id, user: userId });

    if (!inventory) {
      throw new NotFoundException('Inventory item not found');
    }

    const previousQty = inventory.quantity;
    let newQty: number;

    switch (adjustDto.type) {
      case 'sale':
        if (inventory.soldQuantity + adjustDto.quantity > inventory.quantity) {
          throw new BadRequestException('Cannot sell more than available quantity');
        }
        inventory.soldQuantity += adjustDto.quantity;
        newQty = inventory.quantity;
        break;

      case 'damage':
        if (inventory.damagedQuantity + adjustDto.quantity > inventory.quantity) {
          throw new BadRequestException('Damaged quantity exceeds total quantity');
        }
        inventory.damagedQuantity += adjustDto.quantity;
        newQty = inventory.quantity;
        break;

      case 'return':
        inventory.soldQuantity -= adjustDto.quantity;
        if (inventory.soldQuantity < 0) inventory.soldQuantity = 0;
        newQty = inventory.quantity;
        break;

      case 'adjustment':
        inventory.quantity += adjustDto.quantity;
        newQty = inventory.quantity;
        if (newQty < 0) {
          throw new BadRequestException('Adjustment would result in negative quantity');
        }
        break;

      default:
        throw new BadRequestException('Invalid adjustment type');
    }

    await inventory.save();

    // Record transaction
    await this.recordTransaction({
      inventory: inventory._id,
      user: userId,
      type: adjustDto.type,
      quantity: adjustDto.quantity,
      previousQuantity: previousQty,
      newQuantity: newQty,
      reason: adjustDto.reason,
      referenceNumber: adjustDto.referenceNumber,
    });

    return inventory.populate('medicine');
  }

  // Delete inventory (soft delete)
  async remove(id: string, userId: string): Promise<void> {
    const result = await this.inventoryModel
      .findOneAndUpdate(
        { _id: id, user: userId },
        { isActive: false },
        { new: true }
      )
      .exec();

    if (!result) {
      throw new NotFoundException('Inventory item not found');
    }
  }

  // Get low stock alerts
  async getLowStockAlerts(userId: string): Promise<any[]> {
    const inventory = await this.inventoryModel
      .find({ 
        user: userId, 
        isActive: true,
        status: 'low_stock'
      })
      .populate('medicine')
      .sort({ quantity: 1 })
      .exec();

    return inventory.map(item => ({
      ...item.toObject(),
      availableQuantity: item.get('availableQuantity'),
      alertMessage: `Only ${item.get('availableQuantity')} units left (Reorder level: ${item.reorderLevel})`
    }));
  }

  // Get expiry alerts
  async getExpiryAlerts(userId: string, days: number = 60): Promise<any[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const inventory = await this.inventoryModel
      .find({ 
        user: userId, 
        isActive: true,
        expiryDate: { $lte: futureDate, $gt: new Date() }
      })
      .populate('medicine')
      .sort({ expiryDate: 1 })
      .exec();

    return inventory.map(item => ({
      ...item.toObject(),
      daysUntilExpiry: item.get('daysUntilExpiry'),
      alertMessage: `Expires in ${item.get('daysUntilExpiry')} days`
    }));
  }

  // Get expired items
  async getExpiredItems(userId: string): Promise<any[]> {
    const inventory = await this.inventoryModel
      .find({ 
        user: userId, 
        isActive: true,
        status: 'expired'
      })
      .populate('medicine')
      .sort({ expiryDate: 1 })
      .exec();

    return inventory;
  }

  // Get out of stock items
  async getOutOfStockItems(userId: string): Promise<any[]> {
    return this.inventoryModel
      .find({ 
        user: userId, 
        isActive: true,
        status: 'out_of_stock'
      })
      .populate('medicine')
      .exec();
  }

  // Get stock summary
  async getStockSummary(userId: string) {
    const [
      totalItems,
      lowStock,
      nearExpiry,
      expired,
      outOfStock,
      totalValue,
    ] = await Promise.all([
      this.inventoryModel.countDocuments({ user: userId, isActive: true }),
      this.inventoryModel.countDocuments({ user: userId, isActive: true, status: 'low_stock' }),
      this.inventoryModel.countDocuments({ user: userId, isActive: true, status: 'near_expiry' }),
      this.inventoryModel.countDocuments({ user: userId, isActive: true, status: 'expired' }),
      this.inventoryModel.countDocuments({ user: userId, isActive: true, status: 'out_of_stock' }),
      this.inventoryModel.aggregate([
        { $match: { user: userId, isActive: true } },
        { 
          $project: { 
            value: { 
              $multiply: ['$quantity', '$purchasePrice'] 
            } 
          } 
        },
        { $group: { _id: null, total: { $sum: '$value' } } }
      ])
    ]);

    return {
      totalItems,
      alerts: {
        lowStock,
        nearExpiry,
        expired,
        outOfStock,
      },
      totalInventoryValue: totalValue[0]?.total || 0,
    };
  }

  // Get transaction history
  async getTransactionHistory(
    inventoryId: string, 
    userId: string,
    page: number = 1,
    limit: number = 50
  ) {
    // Verify inventory belongs to user
    const inventory = await this.inventoryModel.findOne({ 
      _id: inventoryId, 
      user: userId 
    });

    if (!inventory) {
      throw new NotFoundException('Inventory item not found');
    }

    const safePage = page || 1;
    const safeLimit = limit || 50;
    const skip = Math.max(0, (safePage - 1) * safeLimit);

    const [transactions, total] = await Promise.all([
      this.transactionModel
        .find({ inventory: inventoryId })
        .sort({ transactionDate: -1 })
        .skip(skip)
        .limit(safeLimit)
        .exec(),
      this.transactionModel.countDocuments({ inventory: inventoryId }),
    ]);

    return {
      data: transactions,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  // Helper: Record stock transaction
  private async recordTransaction(transactionData: any) {
    const transaction = new this.transactionModel(transactionData);
    return transaction.save();
  }
}
