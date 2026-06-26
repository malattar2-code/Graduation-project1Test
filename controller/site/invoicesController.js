const Invoice = require('../../models/Invoice');
const { Op, Sequelize } = require('sequelize');
const sequelize = require('../../config/dbSQL'); // or however you import it
// DISABLED: Firebase-PostgreSQL sync service
// const syncService = require('../../services/syncInvoicesService');

exports.getUserInvoices = async (req, res) => {
  try {
    console.log('🎯 getUserInvoices controller called');
    console.log('👤 User from auth:', req.user);
    
    const donorId = req.user.id;
    
    if (!donorId) {
      console.log('❌ No donorId found in request');
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required' 
      });
    }

    console.log(`🔄 Fetching invoices for donor: ${donorId}`);

    // DISABLED: Firebase-PostgreSQL synchronization
    // try {
    //   console.log('🔄 Starting Firestore sync...');
    //   await syncService.syncDonorInvoices(donorId);
    //   console.log('✅ Firestore sync completed');
    // } catch (syncError) {
    //   console.error('⚠️ Sync error, continuing with existing data:', syncError);
    // }

    console.log('🗄️ Querying PostgreSQL for LAST 10 invoices...');
    const invoices = await Invoice.findAll({
      where: { donor_id: donorId },
      include: [
        {
          model: require('../../models/Fundraiser'),
          as: 'fundraiser',  // ← FIXED: was 'Fundraiser'
          attributes: ['fundraiser_title']
        }
      ],
      order: [
        [sequelize.literal('CASE WHEN "paid_at" IS NULL THEN 0 ELSE 1 END'), 'DESC'],
        ['paid_at', 'DESC'],
        ['created_at', 'DESC']
      ]
      // REMOVE raw: true and nest: true
    });

    const formattedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      fundraiserTitle: invoice.fundraiser?.fundraiser_title || 'N/A', // ← FIXED
      paymentMethod: invoice.payment_provider,
      displayStatus: invoice.status === 'paid' ? 'Successful' : 'Failed',
      formattedPaidAt: formatDate(invoice.paid_at),
      formattedAmount: formatAmount(invoice.gross_amount, invoice.currency),
      amount: invoice.gross_amount,
      currency: invoice.currency,
      paidAt: invoice.paid_at,
      status: invoice.status
    }));

    console.log(`✅ Sending response with ${formattedInvoices.length} invoices`);
    res.json({
      success: true,
      data: formattedInvoices,
      count: formattedInvoices.length,
    });

  } catch (error) {
    console.error('💥 Error in getUserInvoices:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch invoices: ' + error.message 
    });
  }
};

exports.deleteInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    if (!invoiceId) {
      return res.status(400).json({ error: 'Invoice ID is required' });
    }

    const invoice = await Invoice.findOne({
      where: { id: invoiceId }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    await invoice.destroy();

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete invoice: ' + error.message 
    });
  }
};

exports.getAllInvoices = async (req, res) => {
  try {
    console.log('🎯 getAllInvoices controller called for admin');
    
    const User = require('../../models/User');
    const Fundraiser = require('../../models/Fundraiser');

    console.log('🗄️ Querying PostgreSQL for ALL invoices...');
    const invoices = await Invoice.findAll({
      include: [
        { 
          model: User, 
          as: 'donor',  // lowercase — matches associations.js
          attributes: ['id', 'full_name', 'email'],
          required: false
        },
        { 
          model: Fundraiser, 
          as: 'fundraiser',  // lowercase — matches associations.js
          attributes: ['fundraiser_id', 'fundraiser_title'],
          required: false
        }
      ],
      order: [['paid_at', 'DESC']]
    });

    console.log(`📊 Found ${invoices.length} total invoices in database`);

    const formattedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      donor_id: invoice.donor_id,
      donor_name: invoice.donor?.full_name || 'N/A',
      donor_email: invoice.donor?.email || 'N/A',
      fundraiser_id: invoice.fundraiser_id,
      fundraiser_title: invoice.fundraiser?.fundraiser_title || 'N/A',
      gross_amount: invoice.gross_amount,
      net_amount: invoice.net_amount,
      processing_fee: invoice.processing_fee,
      currency: invoice.currency,
      status: invoice.status,
      payment_provider: invoice.payment_provider,
      provider_transaction_id: invoice.provider_transaction_id,
      paid_at: formatDate(invoice.paid_at),
      points_processed: invoice.points_processed,
      points_processed_at: formatDate(invoice.points_processed_at),
      raw_paid_at: invoice.paid_at,
      raw_points_processed_at: invoice.points_processed_at
    }));

    console.log('✅ Sending response with all invoices');
    res.json({
      success: true,
      data: formattedInvoices,
      count: formattedInvoices.length
    });

  } catch (error) {
    console.error('💥 Error in getAllInvoices:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch invoices: ' + error.message 
    });
  }
};

exports.debugAddPoints = async (req, res) => {
  try {
    console.log('🔧 [DEBUG] Manual points test endpoint called');
    const { donor_id, amount } = req.body;
    
    if (!donor_id || !amount) {
      return res.status(400).json({
        success: false,
        error: 'donor_id and amount are required'
      });
    }

    console.log('🔧 [DEBUG] Test data:', { donor_id, amount });
    
    const testInvoice = {
      id: 'debug-' + Date.now(),
      donor_id: donor_id,
      amount: parseFloat(amount),
      status: 'paid'
    };
    
    console.log('🔧 [DEBUG] Calling PointsService.addDonationPoints...');
    const PointsService = require('../../services/pointsService');
    const result = await PointsService.addDonationPoints(testInvoice);
    
    console.log('🔧 [DEBUG] PointsService result:', result);
    
    res.json(result);
  } catch (error) {
    console.error('💥 [DEBUG] Error testing points:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
};

exports.debugUserPoints = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔧 [DEBUG] Checking points for user ID:', id);
    
    const User = require('../../models/User');
    const user = await User.findOne({
      where: { id },
      attributes: ['id', 'full_name', 'email']
    });

    if (!user) {
      return res.json({
        success: false,
        error: 'User not found'
      });
    }

    const UserRankPoint = require('../../models/UserRankPoint');
    const userRankPoints = await UserRankPoint.findOne({
      where: { userId: user.id }
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.full_name,
          email: user.email
        },
        points: userRankPoints ? {
          totalPoints: userRankPoints.userPoints,
          rankId: userRankPoints.currentRankId,
          rankName: userRankPoints.rankName
        } : {
          totalPoints: 0,
          rankId: null,
          rankName: null
        }
      }
    });
  } catch (error) {
    console.error('💥 [DEBUG] Error checking user points:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Helper functions
function formatDate(date) {
  if (!date) return 'N/A';
  
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Invalid Date';
  }
}

function formatAmount(amount, currency = 'usd') {
  if (!amount) return 'N/A';
  
  const currencySymbols = {
    usd: '$',
    eur: '€',
    gbp: '£'
  };
  
  const symbol = currencySymbols[currency.toLowerCase()] || '$';
  return `${symbol}${parseFloat(amount).toFixed(2)}`;
}