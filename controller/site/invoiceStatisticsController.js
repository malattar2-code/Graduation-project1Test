const Invoice = require('../../models/Invoice');
const { Sequelize, Op } = require('sequelize');

exports.getInvoiceStatistics = async (req, res) => {
  try {
    console.log('📊 Getting invoice statistics for admin panel');

    const statusTotals = await Invoice.findAll({
      attributes: [
        'status',
        [Sequelize.fn('SUM', Sequelize.col('gross_amount')), 'total_amount'], // CHANGED: amount → gross_amount
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'invoice_count']
      ],
      group: ['status'],
      raw: true
    });

    const paidTotal = statusTotals.find(s => s.status === 'paid')?.total_amount || 0;
    const notPaidTotal = statusTotals.find(s => s.status !== 'paid')?.total_amount || 0;
    const paidCount = statusTotals.find(s => s.status === 'paid')?.invoice_count || 0;
    const notPaidCount = statusTotals.find(s => s.status !== 'paid')?.invoice_count || 0;

    const monthlyTotals = await Invoice.findAll({
      attributes: [
        [Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('paid_at')), 'month'],
        [Sequelize.fn('SUM', Sequelize.col('gross_amount')), 'total_amount'], // CHANGED: amount → gross_amount
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'invoice_count']
      ],
      where: {
        status: 'paid',
        paid_at: { [Op.between]: ['2025-08-01', '2026-08-31'] }
      },
      group: [Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('paid_at'))],
      order: [[Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('paid_at')), 'ASC']],
      raw: true
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyTotals = await Invoice.findAll({
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('paid_at')), 'date'],
        [Sequelize.fn('SUM', Sequelize.col('gross_amount')), 'total_amount'], // CHANGED: amount → gross_amount
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'invoice_count']
      ],
      where: {
        status: 'paid',
        paid_at: { [Op.gte]: thirtyDaysAgo }
      },
      group: [Sequelize.fn('DATE', Sequelize.col('paid_at'))],
      order: [[Sequelize.fn('DATE', Sequelize.col('paid_at')), 'ASC']],
      raw: true
    });

    const formattedMonthly = monthlyTotals.map(month => ({
      month: formatMonth(month.month),
      total_amount: parseFloat(month.total_amount) || 0,
      invoice_count: parseInt(month.invoice_count) || 0,
      raw_month: month.month
    }));

    const formattedDaily = dailyTotals.map(day => ({
      date: formatDate(day.date),
      total_amount: parseFloat(day.total_amount) || 0,
      invoice_count: parseInt(day.invoice_count) || 0,
      raw_date: day.date
    }));

    console.log('✅ Statistics fetched successfully');
    
    res.json({
      success: true,
      data: {
        status_totals: {
          paid: {
            total_amount: parseFloat(paidTotal) || 0,
            invoice_count: parseInt(paidCount) || 0
          },
          not_paid: {
            total_amount: parseFloat(notPaidTotal) || 0,
            invoice_count: parseInt(notPaidCount) || 0
          }
        },
        monthly_totals: formattedMonthly,
        daily_totals: formattedDaily
      }
    });

  } catch (error) {
    console.error('💥 Error in getInvoiceStatistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics: ' + error.message
    });
  }
};

function formatMonth(dateString) {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}