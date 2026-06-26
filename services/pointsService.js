const User = require('../models/User');
const UserRankPoint = require('../models/UserRankPoint');
// REMOVE this line: const Invoice = require('../models/Invoice');

class PointsService {
  // Add points for a donation
  static async addDonationPoints(invoice, invoiceModel) {
    try {
      console.log('🔍 [POINTS SERVICE] Starting points processing...', {
        invoiceId: invoice.id,
        status: invoice.status,
        donorId: invoice.donor_id,
        amount: invoice.amount
      });

      // Only process paid invoices
      if (invoice.status !== 'paid') {
        console.log(`ℹ️ [POINTS SERVICE] Invoice ${invoice.id} status is ${invoice.status}, skipping points`);
        return { success: false, message: 'Invoice not paid' };
      }

      // CHECK 1: If this is a real Invoice instance, check if points already processed
      if (invoice.id && typeof invoice.id === 'number' && invoiceModel) {
        const existingInvoice = await invoiceModel.findByPk(invoice.id);
        if (existingInvoice && existingInvoice.points_processed) {
          console.log(`⏭️ [POINTS SERVICE] Points already processed for invoice ${invoice.id}, skipping`);
          return { 
            success: false, 
            message: 'Points already processed for this invoice',
            alreadyProcessed: true 
          };
        }
      }

      console.log(`💰 [POINTS SERVICE] Processing points for paid invoice ${invoice.id}`);
      
      // Find the donor user by Firebase UID
      console.log(`🔍 [POINTS SERVICE] Looking for donor with Firebase UID: ${invoice.donor_id}`);
      const donorUser = await User.findOne({
        where: { firebase_uid: invoice.donor_id },
        attributes: ['id', 'full_name', 'email', 'user_image'],
        raw: true
      });

      if (!donorUser) {
        console.log(`❌ [POINTS SERVICE] Donor user not found for Firebase UID: ${invoice.donor_id}`);
        return { success: false, message: 'Donor user not found' };
      }

      console.log(`✅ [POINTS SERVICE] Found donor user:`, {
        id: donorUser.id,
        name: donorUser.full_name,
        email: donorUser.email
      });

      // Calculate points (1 point per dollar, rounded down)
      const donationAmount = parseFloat(invoice.amount);
      const pointsToAdd = Math.floor(donationAmount);
      
      console.log(`🎯 [POINTS SERVICE] Adding ${pointsToAdd} points for $${donationAmount} donation`);

      // Find or create user rank points record
      console.log(`🔍 [POINTS SERVICE] Looking for existing rank points for user ID: ${donorUser.id}`);
      let userRankPoints = await UserRankPoint.findOne({
        where: { userId: donorUser.id }
      });

      if (!userRankPoints) {
        // Create new rank points record
        console.log(`🆕 [POINTS SERVICE] Creating new rank points record for user ${donorUser.full_name}`);
        userRankPoints = await UserRankPoint.create({
          userId: donorUser.id,
          userEmail: donorUser.email || '',
          fullName: donorUser.full_name,
          userImage: donorUser.user_image,
          userPoints: pointsToAdd,
          currentRankId: 1 // Default rank ID
        });
        console.log(`✅ [POINTS SERVICE] Created new rank points record with ${pointsToAdd} points`);
      } else {
        // Update existing record
        const currentPoints = userRankPoints.userPoints;
        const newPoints = currentPoints + pointsToAdd;
        
        console.log(`📈 [POINTS SERVICE] Updating points: ${currentPoints} + ${pointsToAdd} = ${newPoints}`);
        await userRankPoints.update({
          userPoints: newPoints
        });
        console.log(`✅ [POINTS SERVICE] Updated points successfully`);
      }

      // MARK INVOICE AS PROCESSED (if it's a real invoice and model is provided)
      if (invoice.id && typeof invoice.id === 'number' && invoiceModel) {
        await invoiceModel.update(
          {
            points_processed: true,
            points_processed_at: new Date()
          },
          {
            where: { id: invoice.id }
          }
        );
        console.log(`✅ [POINTS SERVICE] Marked invoice ${invoice.id} as points processed`);
      }

      const result = {
        success: true,
        message: `Added ${pointsToAdd} points to ${donorUser.full_name}`,
        data: {
          donorName: donorUser.full_name,
          pointsAdded: pointsToAdd,
          donationAmount: donationAmount,
          totalPoints: userRankPoints.userPoints
        }
      };

      console.log('🎉 [POINTS SERVICE] Points processing completed successfully:', result);
      return result;

    } catch (error) {
      console.error('💥 [POINTS SERVICE] Error processing donation points:', error);
      return { 
        success: false, 
        error: error.message,
        stack: error.stack 
      };
    }
  }

  // Get user points summary
  static async getUserPoints(userId) {
    try {
      const userRankPoints = await UserRankPoint.findOne({
        where: { userId: userId },
        attributes: ['userPoints', 'currentRankId', 'rankName']
      });

      return {
        success: true,
        data: userRankPoints || { userPoints: 0, currentRankId: null, rankName: null }
      };
    } catch (error) {
      console.error('💥 Error getting user points:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = PointsService;