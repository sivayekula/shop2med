import {
  Controller,
  Get,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ExportService } from './services/export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DateRangeDto } from './dto/date-range.dto';
import { SalesReportDto } from './dto/sales-report.dto';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly exportService: ExportService,
  ) {}

  // ==========================================
  // DASHBOARD
  // ==========================================

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard analytics' })
  async getDashboard(@CurrentUser('id') userId: string) {
    return this.reportsService.getDashboardAnalytics(userId);
  }

  // ==========================================
  // SALES REPORTS
  // ==========================================

  @Get('sales')
  @ApiOperation({ summary: 'Get comprehensive sales report' })
  async getSalesReport(
    @CurrentUser('id') userId: string,
    @Query() reportDto: SalesReportDto,
    @Res() res?: Response,
  ) {
    const report = await this.reportsService.getSalesReport(userId, reportDto);

    // Export based on format
    if (reportDto.format === 'excel') {
      const flatData = this.flattenSalesReport(report);
      return this.exportService.exportToExcel(flatData, 'sales-report', res);
    } else if (reportDto.format === 'csv') {
      const flatData = this.flattenSalesReport(report);
      return this.exportService.exportToCSV(flatData, 'sales-report', res);
    }

    return res.json(report);
  }

  @Get('sales/daily')
  @ApiOperation({ summary: 'Get daily sales report' })
  async getDailySalesReport(
    @CurrentUser('id') userId: string,
    @Query() dateRangeDto: DateRangeDto,
  ) {
    return this.reportsService.getDailySalesReport(userId, dateRangeDto);
  }

  @Get('sales/monthly')
  @ApiOperation({ summary: 'Get monthly sales report' })
  async getMonthlySalesReport(
    @CurrentUser('id') userId: string,
    @Query('year') year: number,
  ) {
    return this.reportsService.getMonthlySalesReport(userId, year || new Date().getFullYear());
  }

  @Get('sales/yearly')
  @ApiOperation({ summary: 'Get yearly sales report' })
  async getYearlySalesReport(@CurrentUser('id') userId: string) {
    return this.reportsService.getYearlySalesReport(userId);
  }

  // ==========================================
  // INVENTORY REPORTS
  // ==========================================

  @Get('inventory')
  @ApiOperation({ summary: 'Get comprehensive inventory report' })
  async getInventoryReport(
    @CurrentUser('id') userId: string,
    @Query('format') format?: string,
    @Res() res?: Response,
  ) {
    const report = await this.reportsService.getInventoryReport(userId);

    if (format === 'excel') {
      const flatData = this.flattenInventoryReport(report);
      return this.exportService.exportToExcel(flatData, 'inventory-report', res);
    } else if (format === 'csv') {
      const flatData = this.flattenInventoryReport(report);
      return this.exportService.exportToCSV(flatData, 'inventory-report', res);
    }

    return res.json(report);
  }

  @Get('inventory/stock-movement')
  @ApiOperation({ summary: 'Get stock movement report' })
  async getStockMovementReport(
    @CurrentUser('id') userId: string,
    @Query() dateRangeDto: DateRangeDto,
  ) {
    return this.reportsService.getStockMovementReport(userId, dateRangeDto);
  }

  // ==========================================
  // PURCHASE/ORDER REPORTS
  // ==========================================

  @Get('purchases')
  @ApiOperation({ summary: 'Get purchase report' })
  async getPurchaseReport(
    @CurrentUser('id') userId: string,
    @Query() dateRangeDto: DateRangeDto,
    @Res() res?: Response,
  ) {
    const report = await this.reportsService.getPurchaseReport(userId, dateRangeDto);

    if (dateRangeDto.format === 'excel') {
      const flatData = this.flattenPurchaseReport(report);
      return this.exportService.exportToExcel(flatData, 'purchase-report', res);
    } else if (dateRangeDto.format === 'csv') {
      const flatData = this.flattenPurchaseReport(report);
      return this.exportService.exportToCSV(flatData, 'purchase-report', res);
    }

    return res.json(report);
  }

  // ==========================================
  // PROFIT & LOSS REPORTS
  // ==========================================

  @Get('profit-loss')
  @ApiOperation({ summary: 'Get profit & loss report' })
  async getProfitLossReport(
    @CurrentUser('id') userId: string,
    @Query() dateRangeDto: DateRangeDto,
    @Res() res?: Response,
  ) {
    const report = await this.reportsService.getProfitLossReport(userId, dateRangeDto);

    if (dateRangeDto.format === 'excel') {
      return this.exportService.exportToExcel(
        report.detailedSales,
        'profit-loss-report',
        res
      );
    } else if (dateRangeDto.format === 'csv') {
      return this.exportService.exportToCSV(
        report.detailedSales,
        'profit-loss-report',
        res
      );
    }

    return res.json(report);
  }

  // ==========================================
  // CUSTOMER REPORTS
  // ==========================================

  @Get('customers')
  @ApiOperation({ summary: 'Get customer report' })
  async getCustomerReport(
    @CurrentUser('id') userId: string,
    @Query() dateRangeDto: DateRangeDto,
    @Res() res?: Response,
  ) {
    const report = await this.reportsService.getCustomerReport(userId, dateRangeDto);

    if (dateRangeDto.format === 'excel') {
      return this.exportService.exportToExcel(
        report.topCustomers,
        'customer-report',
        res
      );
    } else if (dateRangeDto.format === 'csv') {
      return this.exportService.exportToCSV(
        report.topCustomers,
        'customer-report',
        res
      );
    }

    return res.json(report);
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  private flattenSalesReport(report: any): any[] {
    return report.salesByPeriod.map((item: any) => ({
      Period: item._id,
      Sales: item.sales,
      Revenue: item.revenue,
      Quantity: item.quantity,
      'Average Sale Value': item.avgSaleValue?.toFixed(2) || 0,
    }));
  }

  private flattenInventoryReport(report: any): any[] {
    return report.categoryBreakdown.map((item: any) => ({
      Category: item._id,
      'Item Count': item.itemCount,
      'Total Quantity': item.totalQuantity,
      'Total Value': item.totalValue?.toFixed(2) || 0,
    }));
  }

  private flattenPurchaseReport(report: any): any[] {
    return report.ordersBySupplier.map((item: any) => ({
      Supplier: item._id,
      'Order Count': item.orderCount,
      'Total Amount': item.totalAmount?.toFixed(2) || 0,
      'Average Amount': item.avgAmount?.toFixed(2) || 0,
    }));
  }
}