const Invoice = require('../../models/Invoice');
const Fundraiser = require('../../models/Fundraiser');
const User = require('../../models/User');
const { Sequelize, Op } = require('sequelize');

exports.getUserDonationStats = async (req, res) => {
  try {
    console.log('🎯 Getting donation statistics for user from session:', req.user);
    
    const userId = req.user.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User authentication required'
      });
    }

    console.log('🔍 Model check:', {
      User: User ? 'Loaded' : 'Undefined',
      Fundraiser: Fundraiser ? 'Loaded' : 'Undefined',
      Invoice: Invoice ? 'Loaded' : 'Undefined'
    });

    const user = await User.findOne({
      where: { id: userId },
      attributes: ['id', 'email'],
      raw: true
    });

    if (!user) {
      console.log('❌ User not found in PostgreSQL database for ID:', userId);
      return res.status(404).json({
        success: false,
        error: 'User not found in database'
      });
    }

    console.log('✅ Found user in PostgreSQL:', user.id, user.email);

    const userFundraisers = await Fundraiser.findAll({
      where: { fundraiser_user_id: user.id },
      attributes: ['fundraiser_id'],
      raw: true
    });

    console.log(`📊 User has ${userFundraisers.length} fundraisers`);

    if (userFundraisers.length === 0) {
      return res.json({
        success: true,
        data: {
          monthlyTotal: 0,
          allTimeTotal: 0,
          dailyDonations: {}
        }
      });
    }

    const fundraiserIds = userFundraisers.map(f => f.fundraiser_id);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const monthlyTotal = await Invoice.sum('gross_amount', { // CHANGED: amount → gross_amount
      where: {
        fundraiser_id: fundraiserIds,
        status: 'paid',
        paid_at: { [Op.between]: [startOfMonth, endOfMonth] }
      }
    });

    const allTimeTotal = await Invoice.sum('gross_amount', { // CHANGED: amount → gross_amount
      where: {
        fundraiser_id: fundraiserIds,
        status: 'paid'
      }
    });

    const dailyDonations = await Invoice.findAll({
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('paid_at')), 'date'],
        [Sequelize.fn('SUM', Sequelize.col('gross_amount')), 'total_amount'] // CHANGED: amount → gross_amount
      ],
      where: {
        fundraiser_id: fundraiserIds,
        status: 'paid',
        paid_at: { [Op.between]: [startOfMonth, endOfMonth] }
      },
      group: [Sequelize.fn('DATE', Sequelize.col('paid_at'))],
      order: [[Sequelize.fn('DATE', Sequelize.col('paid_at')), 'ASC']],
      raw: true
    });

    const dailyDonationsMap = {};
    dailyDonations.forEach(day => {
      const dateStr = new Date(day.date).toISOString().split('T')[0];
      dailyDonationsMap[dateStr] = parseFloat(day.total_amount) || 0;
    });

    const completeDailyData = generateCompleteDailyData(startOfMonth, endOfMonth, dailyDonationsMap);

    res.json({
      success: true,
      data: {
        monthlyTotal: monthlyTotal || 0,
        allTimeTotal: allTimeTotal || 0,
        dailyDonations: completeDailyData
      }
    });

  } catch (error) {
    console.error('💥 Error in getUserDonationStats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch donation statistics: ' + error.message
    });
  }
};

exports.getUserFundraiserStats = async (req, res) => {
  try {
    console.log('📊 Getting fundraiser statistics for user from session:', req.user);
    
    const userId = req.user.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User authentication required'
      });
    }

    const user = await User.findOne({
      where: { id: userId },
      attributes: ['id', 'email'],
      raw: true
    });

    if (!user) {
      console.log('❌ User not found in PostgreSQL database for ID:', userId);
      return res.status(404).json({
        success: false,
        error: 'User not found in database'
      });
    }

    console.log('✅ Found user in PostgreSQL:', user.id, user.email);

    const userFundraisers = await Fundraiser.findAll({
      where: { fundraiser_user_id: user.id },
      attributes: [
        'fundraiser_id',
        'fundraiser_title',
        'fundraiser_target_amount',
        'fundraiser_collected_amount',
        'fundraiser_status'
      ],
      raw: true
    });

    console.log(`📊 User has ${userFundraisers.length} fundraisers total`);

    if (userFundraisers.length === 0) {
      return res.json({
        success: true,
        data: {
          completedDonationsTotal: 0,
          completedFundraisersPercentage: 0,
          totalProgressPercentage: 0
        }
      });
    }

    const completedFundraisers = userFundraisers.filter(f => f.fundraiser_status === 'completed');
    const completedDonationsTotal = completedFundraisers.reduce((total, fundraiser) => {
      return total + parseFloat(fundraiser.fundraiser_collected_amount || 0);
    }, 0);

    console.log(`💰 Completed fundraisers: ${completedFundraisers.length}, Total collected: $${completedDonationsTotal}`);

    const completedFundraisersPercentage = userFundraisers.length > 0 
      ? Math.round((completedFundraisers.length / userFundraisers.length) * 100)
      : 0;

    console.log(`📈 Completed fundraisers percentage: ${completedFundraisersPercentage}%`);

    const totalCollectedAmount = userFundraisers.reduce((total, fundraiser) => {
      return total + parseFloat(fundraiser.fundraiser_collected_amount || 0);
    }, 0);

    const totalTargetAmount = userFundraisers.reduce((total, fundraiser) => {
      return total + parseFloat(fundraiser.fundraiser_target_amount || 0);
    }, 0);

    const totalProgressPercentage = totalTargetAmount > 0 
      ? Math.round((totalCollectedAmount / totalTargetAmount) * 100)
      : 0;

    const cappedProgressPercentage = Math.min(totalProgressPercentage, 100);

    console.log(`🎯 Total progress: ${totalCollectedAmount} / ${totalTargetAmount} = ${cappedProgressPercentage}%`);

    res.json({
      success: true,
      data: {
        completedDonationsTotal: completedDonationsTotal,
        completedFundraisersPercentage: completedFundraisersPercentage,
        totalProgressPercentage: cappedProgressPercentage,
        stats: {
          totalFundraisers: userFundraisers.length,
          completedFundraisers: completedFundraisers.length,
          totalCollectedAmount: totalCollectedAmount,
          totalTargetAmount: totalTargetAmount
        }
      }
    });

  } catch (error) {
    console.error('💥 Error in getUserFundraiserStats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fundraiser statistics: ' + error.message
    });
  }
};

function generateCompleteDailyData(startOfMonth, endOfMonth, dailyDonationsMap) {
  const completeData = {};
  const currentDate = new Date(startOfMonth);
  
  while (currentDate <= endOfMonth) {
    const dateStr = currentDate.toISOString().split('T')[0];
    completeData[dateStr] = dailyDonationsMap[dateStr] || 0;
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return completeData;
}