import { PartialType } from '@nestjs/swagger';
import { CreateOrderDto } from './create-order.dto';

export class UpdateOrderWithItemsDto extends PartialType(CreateOrderDto) {}
