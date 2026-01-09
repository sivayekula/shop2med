import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Medicine } from '../medicines/schemas/medicine.schema';

/**
 * Seed database with sample data for testing
 * Run: npm run seed
 */
async function seedDatabase() {
  console.log('🌱 Seeding database...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const medicineModel = app.get<Model<Medicine>>(getModelToken(Medicine.name));

  try {
    // Clear existing data (optional - comment out in production)
    // await medicineModel.deleteMany({});
    // console.log('🗑️  Cleared existing medicines\n');

    // Sample medicines for testing
    const sampleMedicines = [
      {
        name: 'Paracetamol',
        genericName: 'Paracetamol',
        dosageForm: 'Tablet',
        strength: '500 mg',
        composition: 'Paracetamol 500mg',
        unit: '1 Tablet',
        packSize: '10 tablets',
        ceilingPrice: 0.91,
        mrp: 2.0,
        purchasePrice: 1.5,
        category: 'Analgesic',
        route: 'Oral',
        manufacturer: 'Cipla',
        hsnCode: '30049099',
        requiresPrescription: false,
        dataSource: 'USER',
        nlemListed: true,
        isActive: true,
        usageCount: 150,
        searchTerms: ['paracetamol', 'para', 'fever', 'pain'],
      },
      {
        name: 'Amoxicillin',
        genericName: 'Amoxicillin',
        dosageForm: 'Capsule',
        strength: '500 mg',
        composition: 'Amoxicillin 500mg',
        unit: '1 Capsule',
        packSize: '10 capsules',
        ceilingPrice: 6.44,
        mrp: 10.0,
        purchasePrice: 8.0,
        category: 'Antibiotic',
        route: 'Oral',
        manufacturer: 'Ranbaxy',
        hsnCode: '30049099',
        requiresPrescription: true,
        dataSource: 'USER',
        nlemListed: true,
        isActive: true,
        usageCount: 85,
        searchTerms: ['amoxicillin', 'amox', 'antibiotic'],
      },
      {
        name: 'Cetirizine',
        genericName: 'Cetirizine',
        dosageForm: 'Tablet',
        strength: '10 mg',
        composition: 'Cetirizine 10mg',
        unit: '1 Tablet',
        packSize: '10 tablets',
        ceilingPrice: 1.65,
        mrp: 3.5,
        purchasePrice: 2.5,
        category: 'Antihistamine',
        route: 'Oral',
        manufacturer: 'Sun Pharma',
        hsnCode: '30049099',
        requiresPrescription: false,
        dataSource: 'USER',
        nlemListed: true,
        isActive: true,
        usageCount: 120,
        searchTerms: ['cetirizine', 'allergy', 'antihistamine'],
      },
    ];

    await medicineModel.insertMany(sampleMedicines);
    
    console.log('✅ Seeded sample medicines\n');
    
    const count = await medicineModel.countDocuments();
    console.log(`📊 Total medicines in database: ${count}\n`);

  } catch (error) {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  } finally {
    await app.close();
    console.log('✨ Seeding completed!\n');
    process.exit(0);
  }
}

seedDatabase();
