import { Controller, Get } from '@nestjs/common';
import { HealthCheckService } from "@nestjs/terminus";

@Controller()
export class AppController {
  constructor(private readonly health: HealthCheckService) {}
  @Get('health')
  getHealth() {
    return this.health.check([]);
  }
}
