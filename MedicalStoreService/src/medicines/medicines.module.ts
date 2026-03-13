import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { MedicinesService } from './medicines.service';
import { MedicinesController } from './medicines.controller';
import { Medicine, MedicineSchema } from './schemas/medicine.schema';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: Medicine.name, schema: MedicineSchema }
    ]),
  ],
  controllers: [MedicinesController],
  providers: [MedicinesService],
  exports: [MedicinesService, MedicinesModule], // Export MedicineModel for use in other modules
})
export class MedicinesModule {}