
import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateInventoryDto } from './create-inventory.dto';

export class UpdateInventoryDto extends PartialType(
  OmitType(CreateInventoryDto, ['medicineName'] as const)
) {}
