import Voucher from '../models/Voucher.js';
import Budget from '../models/Budget.mjs';
import Company from '../models/Company.js';
import logger from '../utils/logger.js';
import moment from 'moment';

// @desc    Get Profit & Loss Report
// @route   GET /api/reports/profit-loss
// @access  Private
export const getProfitLossReport = async (req, res) => {
  try {
    const { companyId, startDate, endDate } = req.query;

    if (!companyId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Company ID, start date, and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get all revenue vouchers (sales)
    const revenueVouchers = await Voucher.find({
      company: companyId,
      voucherType: { $in: ['sales', 'credit_note'] },
      date: { $gte: start, $lte: end }
    });

    // Get all expense vouchers (purchases, payments)
    const expenseVouchers = await Voucher.find({
      company: companyId,
      voucherType: { $in: ['purchase', 'payment', 'debit_note'] },
      date: { $gte: start, $lte: end }
    });

    const totalRevenue = revenueVouchers.reduce((sum, v) => sum + (v.totalAmount || 0), 0);
    const totalExpenses = expenseVouchers.reduce((sum, v) => sum + (v.totalAmount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;

    // Category-wise breakdown
    const revenueByCategory = {};
    const expensesByCategory = {};

    revenueVouchers.forEach(v => {
      const category = v.category || 'Uncategorized';
      revenueByCategory[category] = (revenueByCategory[category] || 0) + (v.totalAmount || 0);
    });

    expenseVouchers.forEach(v => {
      const category = v.category || 'Uncategorized';
      expensesByCategory[category] = (expensesByCategory[category] || 0) + (v.totalAmount || 0);
    });

    res.status(200).json({
      success: true,
      data: {
        period: { startDate, endDate },
        summary: {
          totalRevenue,
          totalExpenses,
          netProfit,
          profitMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0
        },
        revenue: {
          total: totalRevenue,
          byCategory: revenueByCategory,
          transactions: revenueVouchers.length
        },
        expenses: {
          total: totalExpenses,
          byCategory: expensesByCategory,
          transactions: expenseVouchers.length
        }
      }
    });
  } catch (error) {
    logger.error('Profit & Loss report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating Profit & Loss report'
    });
  }
};

// @desc    Get Balance Sheet
// @route   GET /api/reports/balance-sheet
// @access  Private
export const getBalanceSheet = async (req, res) => {
  try {
    const { companyId, asOfDate } = req.query;

    if (!companyId || !asOfDate) {
      return res.status(400).json({
        success: false,
        message: 'Company ID and as-of date are required'
      });
    }

    const date = new Date(asOfDate);

    // Get all vouchers up to the date
    const allVouchers = await Voucher.find({
      company: companyId,
      date: { $lte: date }
    });

    // Calculate assets (receivables)
    const receivables = allVouchers
      .filter(v => v.voucherType === 'sales' && !v.isPaid)
      .reduce((sum, v) => sum + (v.totalAmount || 0), 0);

    // Calculate liabilities (payables)
    const payables = allVouchers
      .filter(v => v.voucherType === 'purchase' && !v.isPaid)
      .reduce((sum, v) => sum + (v.totalAmount || 0), 0);

    // Calculate equity (retained earnings)
    const revenue = allVouchers
      .filter(v => v.voucherType === 'sales')
      .reduce((sum, v) => sum + (v.totalAmount || 0), 0);

    const expenses = allVouchers
      .filter(v => ['purchase', 'payment'].includes(v.voucherType))
      .reduce((sum, v) => sum + (v.totalAmount || 0), 0);

    const retainedEarnings = revenue - expenses;

    const totalAssets = receivables;
    const totalLiabilities = payables;
    const totalEquity = retainedEarnings;

    res.status(200).json({
      success: true,
      data: {
        asOfDate,
        assets: {
          currentAssets: {
            accountsReceivable: receivables
          },
          total: totalAssets
        },
        liabilities: {
          currentLiabilities: {
            accountsPayable: payables
          },
          total: totalLiabilities
        },
        equity: {
          retainedEarnings,
          total: totalEquity
        },
        balanceCheck: {
          assetsTotal: totalAssets,
          liabilitiesAndEquityTotal: totalLiabilities + totalEquity,
          balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
        }
      }
    });
  } catch (error) {
    logger.error('Balance Sheet report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating Balance Sheet'
    });
  }
};

// @desc    Get Cash Flow Statement
// @route   GET /api/reports/cash-flow
// @access  Private
export const getCashFlowReport = async (req, res) => {
  try {
    const { companyId, startDate, endDate } = req.query;

    if (!companyId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Company ID, start date, and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const cashVouchers = await Voucher.find({
      company: companyId,
      voucherType: { $in: ['receipt', 'payment', 'contra'] },
      date: { $gte: start, $lte: end }
    });

    const cashInflows = cashVouchers
      .filter(v => v.voucherType === 'receipt')
      .reduce((sum, v) => sum + (v.totalAmount || 0), 0);

    const cashOutflows = cashVouchers
      .filter(v => v.voucherType === 'payment')
      .reduce((sum, v) => sum + (v.totalAmount || 0), 0);

    const netCashFlow = cashInflows - cashOutflows;

    res.status(200).json({
      success: true,
      data: {
        period: { startDate, endDate },
        operatingActivities: {
          cashInflows,
          cashOutflows,
          netCashFlow
        },
        summary: {
          totalInflows: cashInflows,
          totalOutflows: cashOutflows,
          netChange: netCashFlow
        }
      }
    });
  } catch (error) {
    logger.error('Cash Flow report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating Cash Flow report'
    });
  }
};

// @desc    Get Sales Report
// @route   GET /api/reports/sales
// @access  Private
export const getSalesReport = async (req, res) => {
  try {
    const { companyId, startDate, endDate, groupBy = 'day' } = req.query;

    if (!companyId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Company ID, start date, and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const salesVouchers = await Voucher.find({
      company: companyId,
      voucherType: 'sales',
      date: { $gte: start, $lte: end }
    }).populate('party', 'name');

    const totalSales = salesVouchers.reduce((sum, v) => sum + (v.totalAmount || 0), 0);
    const totalQuantity = salesVouchers.reduce((sum, v) => {
      return sum + (v.items?.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0) || 0);
    }, 0);

    // Group by time period
    const salesByPeriod = {};
    salesVouchers.forEach(v => {
      const key = moment(v.date).startOf(groupBy).format('YYYY-MM-DD');
      if (!salesByPeriod[key]) {
        salesByPeriod[key] = { date: key, amount: 0, count: 0 };
      }
      salesByPeriod[key].amount += v.totalAmount || 0;
      salesByPeriod[key].count += 1;
    });

    // Top customers
    const customerSales = {};
    salesVouchers.forEach(v => {
      if (v.party) {
        const customerId = v.party._id.toString();
        if (!customerSales[customerId]) {
          customerSales[customerId] = {
            name: v.party.name,
            totalAmount: 0,
            transactionCount: 0
          };
        }
        customerSales[customerId].totalAmount += v.totalAmount || 0;
        customerSales[customerId].transactionCount += 1;
      }
    });

    const topCustomers = Object.values(customerSales)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    res.status(200).json({
      success: true,
      data: {
        period: { startDate, endDate },
        summary: {
          totalSales,
          totalQuantity,
          transactionCount: salesVouchers.length,
          averageOrderValue: salesVouchers.length > 0 ? totalSales / salesVouchers.length : 0
        },
        salesByPeriod: Object.values(salesByPeriod).sort((a, b) => a.date.localeCompare(b.date)),
        topCustomers
      }
    });
  } catch (error) {
    logger.error('Sales report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating Sales report'
    });
  }
};

// @desc    Get Purchase Report
// @route   GET /api/reports/purchase
// @access  Private
export const getPurchaseReport = async (req, res) => {
  try {
    const { companyId, startDate, endDate } = req.query;

    if (!companyId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Company ID, start date, and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const purchaseVouchers = await Voucher.find({
      company: companyId,
      voucherType: 'purchase',
      date: { $gte: start, $lte: end }
    }).populate('party', 'name');

    const totalPurchases = purchaseVouchers.reduce((sum, v) => sum + (v.totalAmount || 0), 0);

    // Top suppliers
    const supplierPurchases = {};
    purchaseVouchers.forEach(v => {
      if (v.party) {
        const supplierId = v.party._id.toString();
        if (!supplierPurchases[supplierId]) {
          supplierPurchases[supplierId] = {
            name: v.party.name,
            totalAmount: 0,
            transactionCount: 0
          };
        }
        supplierPurchases[supplierId].totalAmount += v.totalAmount || 0;
        supplierPurchases[supplierId].transactionCount += 1;
      }
    });

    const topSuppliers = Object.values(supplierPurchases)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    res.status(200).json({
      success: true,
      data: {
        period: { startDate, endDate },
        summary: {
          totalPurchases,
          transactionCount: purchaseVouchers.length,
          averagePurchaseValue: purchaseVouchers.length > 0 ? totalPurchases / purchaseVouchers.length : 0
        },
        topSuppliers
      }
    });
  } catch (error) {
    logger.error('Purchase report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating Purchase report'
    });
  }
};

// @desc    Get Budget vs Actual Report
// @route   GET /api/reports/budget-vs-actual
// @access  Private
export const getBudgetVsActualReport = async (req, res) => {
  try {
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    const budgets = await Budget.find({
      company: companyId,
      status: 'active'
    });

    const budgetAnalysis = budgets.map(budget => ({
      name: budget.name,
      category: budget.category,
      budgetAmount: budget.amount,
      actualSpent: budget.actualSpent,
      remaining: budget.remainingAmount,
      utilization: budget.utilizationPercentage,
      variance: {
        amount: budget.actualSpent - budget.amount,
        percentage: budget.amount > 0 ? ((budget.actualSpent - budget.amount) / budget.amount * 100).toFixed(2) : 0
      },
      status: budget.actualSpent > budget.amount ? 'Over Budget' : 
              budget.utilizationPercentage >= 90 ? 'Near Limit' : 'On Track'
    }));

    const summary = {
      totalBudget: budgets.reduce((sum, b) => sum + b.amount, 0),
      totalSpent: budgets.reduce((sum, b) => sum + b.actualSpent, 0),
      totalRemaining: budgets.reduce((sum, b) => sum + b.remainingAmount, 0),
      averageUtilization: budgets.length > 0 ? 
        budgets.reduce((sum, b) => sum + b.utilizationPercentage, 0) / budgets.length : 0
    };

    res.status(200).json({
      success: true,
      data: {
        summary,
        budgets: budgetAnalysis
      }
    });
  } catch (error) {
    logger.error('Budget vs Actual report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating Budget vs Actual report'
    });
  }
};

// @desc    Get Dashboard Summary
// @route   GET /api/reports/dashboard
// @access  Private
export const getDashboardSummary = async (req, res) => {
  try {
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // This month's data
    const thisMonthVouchers = await Voucher.find({
      company: companyId,
      date: { $gte: startOfMonth }
    });

    const monthSales = thisMonthVouchers
      .filter(v => v.voucherType === 'sales')
      .reduce((sum, v) => sum + (v.totalAmount || 0), 0);

    const monthPurchases = thisMonthVouchers
      .filter(v => v.voucherType === 'purchase')
      .reduce((sum, v) => sum + (v.totalAmount || 0), 0);

    // Year to date
    const ytdVouchers = await Voucher.find({
      company: companyId,
      date: { $gte: startOfYear }
    });

    const ytdSales = ytdVouchers
      .filter(v => v.voucherType === 'sales')
      .reduce((sum, v) => sum + (v.totalAmount || 0), 0);

    const ytdPurchases = ytdVouchers
      .filter(v => v.voucherType === 'purchase')
      .reduce((sum, v) => sum + (v.totalAmount || 0), 0);

    // Outstanding
    const outstandingReceivables = await Voucher.find({
      company: companyId,
      voucherType: 'sales',
      isPaid: false
    });

    const outstandingPayables = await Voucher.find({
      company: companyId,
      voucherType: 'purchase',
      isPaid: false
    });

    const totalReceivables = outstandingReceivables.reduce((sum, v) => sum + (v.totalAmount || 0), 0);
    const totalPayables = outstandingPayables.reduce((sum, v) => sum + (v.totalAmount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        thisMonth: {
          sales: monthSales,
          purchases: monthPurchases,
          profit: monthSales - monthPurchases
        },
        yearToDate: {
          sales: ytdSales,
          purchases: ytdPurchases,
          profit: ytdSales - ytdPurchases
        },
        outstanding: {
          receivables: totalReceivables,
          payables: totalPayables,
          net: totalReceivables - totalPayables
        }
      }
    });
  } catch (error) {
    logger.error('Dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating dashboard summary'
    });
  }
};
