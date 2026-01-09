import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sale, SaleDocument } from '../sales/schemas/sale.schema';
import { Inventory, InventoryDocument } from '../inventory/schemas/inventory.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { Medicine, MedicineDocument } from '../medicines/schemas/medicine.schema';
import { DateRangeDto } from './dto/date-range.dto';
import { SalesReportDto } from './dto/sales-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Sale.name) private saleModel: Model<SaleDocument>,
    @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Medicine.name) private medicineModel: Model<MedicineDocument>,
  ) {}

  // ==========================================
  // SALES REPORTS
  // ==========================================

  async getSalesReport(userId: string, reportDto: SalesReportDto) {
    const { dateFrom, dateTo, groupBy, paymentMethod, status } = reportDto;

    const filter: any = {
      user: userId,
      isActive: true,
      saleDate: { $gte: dateFrom, $lte: dateTo },
    };

    if (status) {
      filter.status = status;
    } else {
      filter.status = 'completed'; // Default to completed sales
    }

    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }

    // Group by configuration
    let dateFormat: string;
    switch (groupBy) {
      case 'daily':
        dateFormat = '%Y-%m-%d';
        break;
      case 'weekly':
        dateFormat = '%Y-W%V';
        break;
      case 'monthly':
        dateFormat = '%Y-%m';
        break;
      case 'yearly':
        dateFormat = '%Y';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const [summary, salesByPeriod, topMedicines, paymentBreakdown] = await Promise.all([
      // Overall summary
      this.saleModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalSales: { $sum: 1 },
            totalRevenue: { $sum: '$totalAmount' },
            totalDiscount: { $sum: '$totalDiscount' },
            totalTax: { $sum: '$totalTax' },
            totalQuantity: { $sum: { $sum: '$items.quantity' } },
          },
        },
      ]),

      // Sales by period
      this.saleModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: '$saleDate' } },
            sales: { $sum: 1 },
            revenue: { $sum: '$totalAmount' },
            quantity: { $sum: { $sum: '$items.quantity' } },
            avgSaleValue: { $avg: '$totalAmount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Top selling medicines
      this.saleModel.aggregate([
        { $match: filter },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.medicineName',
            totalQuantity: { $sum: '$items.quantity' },
            totalRevenue: { $sum: '$items.totalAmount' },
            salesCount: { $sum: 1 },
          },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 20 },
      ]),

      // Payment method breakdown
      this.saleModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$paymentMethod',
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' },
          },
        },
        { $sort: { totalAmount: -1 } },
      ]),
    ]);

    return {
      summary: summary[0] || {
        totalSales: 0,
        totalRevenue: 0,
        totalDiscount: 0,
        totalTax: 0,
        totalQuantity: 0,
      },
      salesByPeriod,
      topMedicines,
      paymentBreakdown,
      period: {
        from: dateFrom,
        to: dateTo,
        groupBy,
      },
    };
  }

  async getDailySalesReport(userId: string, dateRangeDto: DateRangeDto) {
    const { dateFrom, dateTo } = dateRangeDto;

    return this.saleModel.aggregate([
      {
        $match: {
          user: userId,
          isActive: true,
          status: 'completed',
          saleDate: { $gte: dateFrom, $lte: dateTo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } },
          date: { $first: '$saleDate' },
          salesCount: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
          discount: { $sum: '$totalDiscount' },
          tax: { $sum: '$totalTax' },
          itemsSold: { $sum: { $sum: '$items.quantity' } },
          avgSaleValue: { $avg: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  async getMonthlySalesReport(userId: string, year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    return this.saleModel.aggregate([
      {
        $match: {
          user: userId,
          isActive: true,
          status: 'completed',
          saleDate: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $month: '$saleDate' },
          month: { $first: { $dateToString: { format: '%B', date: '$saleDate' } } },
          salesCount: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
          discount: { $sum: '$totalDiscount' },
          tax: { $sum: '$totalTax' },
          profit: { $sum: { $subtract: ['$totalAmount', '$subtotal'] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  async getYearlySalesReport(userId: string) {
    return this.saleModel.aggregate([
      {
        $match: {
          user: userId,
          isActive: true,
          status: 'completed',
        },
      },
      {
        $group: {
          _id: { $year: '$saleDate' },
          year: { $first: { $dateToString: { format: '%Y', date: '$saleDate' } } },
          salesCount: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
          discount: { $sum: '$totalDiscount' },
          tax: { $sum: '$totalTax' },
        },
      },
      { $sort: { _id: -1 } },
    ]);
  }

  // ==========================================
  // INVENTORY REPORTS
  // ==========================================

  async getInventoryReport(userId: string) {
    const [stockSummary, categoryBreakdown, expiryReport, lowStockItems, topValueItems] =
      await Promise.all([
        // Stock summary
        this.inventoryModel.aggregate([
          { $match: { user: userId, isActive: true } },
          {
            $project: {
              availableQty: {
                $subtract: [
                  '$quantity',
                  { $add: ['$soldQuantity', '$damagedQuantity'] },
                ],
              },
              stockValue: { $multiply: ['$quantity', '$purchasePrice'] },
            },
          },
          {
            $group: {
              _id: null,
              totalItems: { $sum: 1 },
              totalQuantity: { $sum: '$availableQty' },
              totalValue: { $sum: '$stockValue' },
            },
          },
        ]),

        // Category breakdown
        this.inventoryModel.aggregate([
          { $match: { user: userId, isActive: true } },
          {
            $lookup: {
              from: 'medicines',
              localField: 'medicine',
              foreignField: '_id',
              as: 'medicineInfo',
            },
          },
          { $unwind: '$medicineInfo' },
          {
            $group: {
              _id: '$medicineInfo.category',
              itemCount: { $sum: 1 },
              totalQuantity: { $sum: '$quantity' },
              totalValue: { $sum: { $multiply: ['$quantity', '$purchasePrice'] } },
            },
          },
          { $sort: { totalValue: -1 } },
        ]),

        // Expiry report
        this.inventoryModel.aggregate([
          { $match: { user: userId, isActive: true } },
          {
            $project: {
              medicine: 1,
              batchNumber: 1,
              expiryDate: 1,
              quantity: 1,
              daysUntilExpiry: {
                $divide: [
                  { $subtract: ['$expiryDate', new Date()] },
                  1000 * 60 * 60 * 24,
                ],
              },
            },
          },
          {
            $bucket: {
              groupBy: '$daysUntilExpiry',
              boundaries: [-Infinity, 0, 30, 60, 90, Infinity],
              default: 'Other',
              output: {
                count: { $sum: 1 },
                items: { $push: '$$ROOT' },
              },
            },
          },
        ]),

        // Low stock items
        this.inventoryModel
          .find({
            user: userId,
            isActive: true,
            status: 'low_stock',
          })
          .populate('medicine')
          .limit(20)
          .exec(),

        // Top value items
        this.inventoryModel.aggregate([
          { $match: { user: userId, isActive: true } },
          {
            $project: {
              medicine: 1,
              batchNumber: 1,
              quantity: 1,
              purchasePrice: 1,
              stockValue: { $multiply: ['$quantity', '$purchasePrice'] },
            },
          },
          { $sort: { stockValue: -1 } },
          { $limit: 20 },
          {
            $lookup: {
              from: 'medicines',
              localField: 'medicine',
              foreignField: '_id',
              as: 'medicineInfo',
            },
          },
        ]),
      ]);

    return {
      summary: stockSummary[0] || { totalItems: 0, totalQuantity: 0, totalValue: 0 },
      categoryBreakdown,
      expiryReport,
      lowStockItems,
      topValueItems,
    };
  }

  async getStockMovementReport(userId: string, dateRangeDto: DateRangeDto) {
    const { dateFrom, dateTo } = dateRangeDto;

    return this.saleModel.aggregate([
      {
        $match: {
          user: userId,
          isActive: true,
          status: 'completed',
          saleDate: { $gte: dateFrom, $lte: dateTo },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.medicineName',
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.totalAmount' },
          avgPrice: { $avg: '$items.unitPrice' },
          salesCount: { $sum: 1 },
        },
      },
      { $sort: { totalSold: -1 } },
    ]);
  }

  // ==========================================
  // PURCHASE/ORDER REPORTS
  // ==========================================

  async getPurchaseReport(userId: string, dateRangeDto: DateRangeDto) {
    const { dateFrom, dateTo } = dateRangeDto;

    const [summary, ordersBySupplier, monthlyPurchases, statusBreakdown] = await Promise.all([
      // Overall summary
      this.orderModel.aggregate([
        {
          $match: {
            user: userId,
            isActive: true,
            orderDate: { $gte: dateFrom, $lte: dateTo },
          },
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' },
            avgOrderValue: { $avg: '$totalAmount' },
            totalItems: { $sum: { $size: '$items' } },
          },
        },
      ]),

      // Orders by supplier
      this.orderModel.aggregate([
        {
          $match: {
            user: userId,
            isActive: true,
            orderDate: { $gte: dateFrom, $lte: dateTo },
          },
        },
        {
          $group: {
            _id: '$supplierName',
            orderCount: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' },
            avgAmount: { $avg: '$totalAmount' },
          },
        },
        { $sort: { totalAmount: -1 } },
      ]),

      // Monthly purchases
      this.orderModel.aggregate([
        {
          $match: {
            user: userId,
            isActive: true,
            orderDate: { $gte: dateFrom, $lte: dateTo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$orderDate' } },
            orderCount: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Status breakdown
      this.orderModel.aggregate([
        {
          $match: {
            user: userId,
            isActive: true,
            orderDate: { $gte: dateFrom, $lte: dateTo },
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' },
          },
        },
      ]),
    ]);

    return {
      summary: summary[0] || {
        totalOrders: 0,
        totalAmount: 0,
        avgOrderValue: 0,
        totalItems: 0,
      },
      ordersBySupplier,
      monthlyPurchases,
      statusBreakdown,
      period: {
        from: dateFrom,
        to: dateTo,
      },
    };
  }

  // ==========================================
  // PROFIT & LOSS REPORTS
  // ==========================================

  async getProfitLossReport(userId: string, dateRangeDto: DateRangeDto) {
    const { dateFrom, dateTo } = dateRangeDto;

    // Get sales with inventory details to calculate profit
    const sales = await this.saleModel.aggregate([
      {
        $match: {
          user: userId,
          isActive: true,
          status: 'completed',
          saleDate: { $gte: dateFrom, $lte: dateTo },
        },
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'inventories',
          localField: 'items.inventory',
          foreignField: '_id',
          as: 'inventoryInfo',
        },
      },
      { $unwind: '$inventoryInfo' },
      {
        $project: {
          date: '$saleDate',
          medicineName: '$items.medicineName',
          quantity: '$items.quantity',
          sellingPrice: '$items.unitPrice',
          purchasePrice: '$inventoryInfo.purchasePrice',
          revenue: '$items.totalAmount',
          cost: { $multiply: ['$items.quantity', '$inventoryInfo.purchasePrice'] },
          profit: {
            $subtract: [
              '$items.totalAmount',
              { $multiply: ['$items.quantity', '$inventoryInfo.purchasePrice'] },
            ],
          },
        },
      },
    ]);

    const summary = sales.reduce(
      (acc, sale) => ({
        totalRevenue: acc.totalRevenue + sale.revenue,
        totalCost: acc.totalCost + sale.cost,
        totalProfit: acc.totalProfit + sale.profit,
      }),
      { totalRevenue: 0, totalCost: 0, totalProfit: 0 }
    );

    const profitMargin = summary.totalRevenue > 0 
      ? (summary.totalProfit / summary.totalRevenue) * 100 
      : 0;

    return {
      summary: {
        ...summary,
        profitMargin: profitMargin.toFixed(2),
      },
      detailedSales: sales,
      period: {
        from: dateFrom,
        to: dateTo,
      },
    };
  }

  // ==========================================
  // CUSTOMER REPORTS
  // ==========================================

  async getCustomerReport(userId: string, dateRangeDto: DateRangeDto) {
    const { dateFrom, dateTo } = dateRangeDto;

    const [topCustomers, customerStats, newCustomers] = await Promise.all([
      // Top customers by revenue
      this.saleModel.aggregate([
        {
          $match: {
            user: userId,
            isActive: true,
            status: 'completed',
            customerPhone: { $exists: true, $ne: null },
            saleDate: { $gte: dateFrom, $lte: dateTo },
          },
        },
        {
          $group: {
            _id: '$customerPhone',
            customerName: { $first: '$customerName' },
            totalPurchases: { $sum: 1 },
            totalSpent: { $sum: '$totalAmount' },
            avgPurchaseValue: { $avg: '$totalAmount' },
            lastPurchase: { $max: '$saleDate' },
          },
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 20 },
      ]),

      // Customer statistics
      this.saleModel.aggregate([
        {
          $match: {
            user: userId,
            isActive: true,
            status: 'completed',
            saleDate: { $gte: dateFrom, $lte: dateTo },
          },
        },
        {
          $group: {
            _id: null,
            totalCustomers: {
              $addToSet: '$customerPhone',
            },
            withoutPhone: {
              $sum: {
                $cond: [{ $or: [{ $eq: ['$customerPhone', null] }, { $eq: ['$customerPhone', ''] }] }, 1, 0],
              },
            },
          },
        },
        {
          $project: {
            totalCustomers: { $size: '$totalCustomers' },
            withoutPhone: 1,
          },
        },
      ]),

      // New customers (first purchase in period)
      this.saleModel.aggregate([
        {
          $match: {
            user: userId,
            isActive: true,
            status: 'completed',
            customerPhone: { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: '$customerPhone',
            firstPurchase: { $min: '$saleDate' },
            customerName: { $first: '$customerName' },
          },
        },
        {
          $match: {
            firstPurchase: { $gte: dateFrom, $lte: dateTo },
          },
        },
        { $sort: { firstPurchase: -1 } },
      ]),
    ]);

    return {
      topCustomers,
      stats: customerStats[0] || { totalCustomers: 0, withoutPhone: 0 },
      newCustomers,
      period: {
        from: dateFrom,
        to: dateTo,
      },
    };
  }

  // ==========================================
  // DASHBOARD ANALYTICS
  // ==========================================

  async getDashboardAnalytics(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);

    const [
      todayStats,
      yesterdayStats,
      monthStats,
      lastMonthStats,
      recentSales,
      lowStockAlerts,
      expiryAlerts,
      topSellingToday,
    ] = await Promise.all([
      // Today's stats
      this.getSalesStats(userId, today, new Date()),

      // Yesterday's stats
      this.getSalesStats(userId, yesterday, today),

      // This month stats
      this.getSalesStats(userId, thisMonth, new Date()),

      // Last month stats
      this.getSalesStats(userId, lastMonth, lastMonthEnd),

      // Recent sales (last 10)
      this.saleModel
        .find({ user: userId, isActive: true, status: 'completed' })
        .sort({ saleDate: -1 })
        .limit(10)
        .select('billNumber customerName totalAmount saleDate paymentMethod')
        .exec(),

      // Low stock alerts
      this.inventoryModel
        .find({ user: userId, isActive: true, status: 'low_stock' })
        .populate('medicine')
        .limit(5)
        .exec(),

      // Expiry alerts (next 30 days)
      this.inventoryModel
        .find({
          user: userId,
          isActive: true,
          expiryDate: {
            $gte: today,
            $lte: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
        })
        .populate('medicine')
        .sort({ expiryDate: 1 })
        .limit(5)
        .exec(),

      // Top selling today
      this.saleModel.aggregate([
        {
          $match: {
            user: userId,
            isActive: true,
            status: 'completed',
            saleDate: { $gte: today },
          },
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.medicineName',
            quantity: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.totalAmount' },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: 5 },
      ]),
    ]);

    // Calculate growth percentages
    const salesGrowth = yesterdayStats[0]?.revenue
      ? ((todayStats[0]?.revenue - yesterdayStats[0]?.revenue) / yesterdayStats[0]?.revenue) * 100
      : 0;

    const monthGrowth = lastMonthStats[0]?.revenue
      ? ((monthStats[0]?.revenue - lastMonthStats[0]?.revenue) / lastMonthStats[0]?.revenue) * 100
      : 0;

    return {
      today: {
        sales: todayStats[0]?.count || 0,
        revenue: todayStats[0]?.revenue || 0,
        growth: salesGrowth.toFixed(2),
      },
      thisMonth: {
        sales: monthStats[0]?.count || 0,
        revenue: monthStats[0]?.revenue || 0,
        growth: monthGrowth.toFixed(2),
      },
      recentSales,
      alerts: {
        lowStock: lowStockAlerts.length,
        expiringSoon: expiryAlerts.length,
      },
      topSellingToday,
      lowStockAlerts,
      expiryAlerts,
    };
  }

  // Helper: Get sales stats for a period
  private async getSalesStats(userId: string, dateFrom: Date, dateTo: Date) {
    return this.saleModel.aggregate([
      {
        $match: {
          user: userId,
          isActive: true,
          status: 'completed',
          saleDate: { $gte: dateFrom, $lte: dateTo },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
    ]);
  }
}