import { Controller, Get } from "@nestjs/common";
import { SalesService } from "./sales.service";


@Controller('sales')
export class SalesController {
  constructor(
    private readonly salesService: SalesService
  ) {}
  
  @Get()
  findAll(): Promise<any> {
    return this.salesService.findAll();
  }
}