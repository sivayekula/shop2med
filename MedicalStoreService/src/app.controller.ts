import { Controller, Get } from '@nestjs/common';
import { HealthCheckService } from "@nestjs/terminus";
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly health: HealthCheckService) {}
  @Public()
  @Get()
  getHealth() {
    return this.health.check([]);
  }
}
