import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Medicine, MedicineDocument } from './schemas/medicine.schema';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { UpdateMedicineDto } from './dto/update-medicine.dto';
import { SearchMedicineDto } from './dto/search-medicine.dto';

@Injectable()
export class MedicinesService {
  constructor(
    @InjectModel(Medicine.name) private medicineModel: Model<MedicineDocument>,
  ) {}

  // Create new medicine
  async create(createMedicineDto: CreateMedicineDto, userId?: string): Promise<Medicine> {
    try {
      // Generate search terms
      const searchTerms = this.generateSearchTerms(createMedicineDto);

      const medicine = new this.medicineModel({
        ...createMedicineDto,
        searchTerms,
        createdBy: userId,
        dataSource: 'USER',
      });

      return await medicine.save();
    } catch (error) {
      throw new BadRequestException('Failed to create medicine: ' + error.message);
    }
  }

  // Find or create medicine (smart entry)
  async findOrCreate(
    createMedicineDto: CreateMedicineDto,
    userId?: string,
  ): Promise<{ medicine: Medicine; created: boolean }> {
    // Check if medicine exists
    const existing = await this.medicineModel.findOne({
      name: createMedicineDto.name,
      strength: createMedicineDto.strength,
      dosageForm: createMedicineDto.dosageForm,
      isActive: true,
    });

    if (existing) {
      // Update shop-specific data
      if (createMedicineDto.mrp) existing.mrp = createMedicineDto.mrp;
      if (createMedicineDto.purchasePrice) existing.purchasePrice = createMedicineDto.purchasePrice;
      if (createMedicineDto.manufacturer) existing.manufacturer = createMedicineDto.manufacturer;
      
      await existing.save();
      return { medicine: existing, created: false };
    }

    // Create new
    const medicine = await this.create(createMedicineDto, userId);
    return { medicine, created: true };
  }

  // Search medicines with filters
  async search(searchDto: SearchMedicineDto) {
    const { query, category, dosageForm, manufacturer, page = 1, limit = 20 } = searchDto;
    
    const filter: any = { isActive: true };

    // Text search
    if (query) {
      filter.$text = { $search: query };
    }

    // Filters
    if (category) filter.category = category;
    if (dosageForm) filter.dosageForm = dosageForm;
    if (manufacturer) filter.manufacturer = new RegExp(manufacturer, 'i');

    const safePage = page || 1;
    const safeLimit = limit || 20;
    const skip = Math.max(0, (safePage - 1) * safeLimit);

    const [medicines, total] = await Promise.all([
      this.medicineModel
        .find(filter)
        .sort(query ? { score: { $meta: 'textScore' }, usageCount: -1 } : { usageCount: -1 })
        .skip(skip)
        .limit(safeLimit)
        .exec(),
      this.medicineModel.countDocuments(filter),
    ]);

    return {
      data: medicines,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  // Autocomplete for medicine entry
  async autocomplete(query: string, limit: number = 10): Promise<Medicine[]> {
    if (!query || query.length < 2) return [];

    return this.medicineModel
      .find({
        $text: { $search: query },
        isActive: true,
      })
      .sort({ score: { $meta: 'textScore' }, usageCount: -1 })
      .limit(limit)
      .select('name genericName dosageForm strength manufacturer mrp category')
      .exec();
  }

  // Get medicine by ID
  async findOne(id: string): Promise<Medicine> {
    const medicine = await this.medicineModel.findById(id).exec();
    if (!medicine) {
      throw new NotFoundException(`Medicine with ID ${id} not found`);
    }
    return medicine;
  }

  // Get all medicines with pagination
  async findAll(page: number = 1, limit: number = 50) {
    const safePage = page || 1;
    const safeLimit = limit || 50;
    const skip = Math.max(0, (safePage - 1) * safeLimit);

    const [medicines, total] = await Promise.all([
      this.medicineModel
        .find({ isActive: true })
        .sort({ usageCount: -1, name: 1 })
        .skip(skip)
        .limit(safeLimit)
        .exec(),
      this.medicineModel.countDocuments({ isActive: true }),
    ]);

    return {
      data: medicines,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  // Update medicine
  async update(id: string, updateMedicineDto: UpdateMedicineDto): Promise<Medicine> {
    // Regenerate search terms if name changed
    if (updateMedicineDto.name || updateMedicineDto.genericName) {
      updateMedicineDto['searchTerms'] = this.generateSearchTerms(updateMedicineDto as any);
    }

    const medicine = await this.medicineModel
      .findByIdAndUpdate(id, updateMedicineDto, { new: true })
      .exec();

    if (!medicine) {
      throw new NotFoundException(`Medicine with ID ${id} not found`);
    }

    return medicine;
  }

  // Soft delete
  async remove(id: string): Promise<void> {
    const result = await this.medicineModel
      .findByIdAndUpdate(id, { isActive: false })
      .exec();

    if (!result) {
      throw new NotFoundException(`Medicine with ID ${id} not found`);
    }
  }

  // Record medicine usage (when sold)
  async recordUsage(id: string): Promise<void> {
    await this.medicineModel
      .findByIdAndUpdate(id, {
        $inc: { usageCount: 1 },
        lastUsed: new Date(),
      })
      .exec();
  }

  // Get popular medicines
  async getPopular(limit: number = 50): Promise<Medicine[]> {
    return this.medicineModel
      .find({ isActive: true })
      .sort({ usageCount: -1 })
      .limit(limit)
      .exec();
  }

  // Get medicines by category
  async findByCategory(category: string, limit: number = 50): Promise<Medicine[]> {
    return this.medicineModel
      .find({ category, isActive: true })
      .sort({ usageCount: -1 })
      .limit(limit)
      .exec();
  }

  // Get all categories
  async getCategories(): Promise<{ category: string; count: number }[]> {
    return this.medicineModel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { category: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]);
  }

  // Get low stock alerts (if inventory tracking added)
  async getLowStock(threshold: number = 10): Promise<any[]> {
    // This would integrate with inventory collection
    // For now, placeholder
    return [];
  }

  // Helper: Generate search terms
  private generateSearchTerms(dto: CreateMedicineDto | UpdateMedicineDto): string[] {
    const terms = new Set<string>();

    if (dto.name) {
      terms.add(dto.name.toLowerCase());
      // Add individual words
      dto.name.toLowerCase().split(/\s+/).forEach(word => terms.add(word));
    }

    if (dto.genericName) {
      terms.add(dto.genericName.toLowerCase());
      dto.genericName.toLowerCase().split(/\s+/).forEach(word => terms.add(word));
    }

    if (dto.manufacturer) {
      terms.add(dto.manufacturer.toLowerCase());
    }

    return Array.from(terms);
  }
}