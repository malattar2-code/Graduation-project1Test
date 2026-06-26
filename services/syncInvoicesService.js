const { db } = require('../config/firebase-admin');
const Invoice = require('../models/Invoice');
const PointsService = require('./pointsService');

class SyncService {
  // Sync single invoice from Firestore to PostgreSQL
  async syncInvoice(firestoreId) {
    try {
      console.log(`🔄 [SYNC SERVICE] Starting sync for invoice: ${firestoreId}`);
      
      // Get invoice from Firestore
      const invoiceDoc = await db.collection('invoices').doc(firestoreId).get();
      
      if (!invoiceDoc.exists) {
        console.log(`❌ [SYNC SERVICE] Invoice ${firestoreId} not found in Firestore`);
        return null;
      }

      const firestoreData = invoiceDoc.data();
      console.log(`📄 [SYNC SERVICE] Firestore data:`, {
        status: firestoreData.status,
        donorId: firestoreData.donorId,
        amount: firestoreData.amount
      });
      
      // Convert Firestore timestamps to Date objects
      const createdAt = firestoreData.createdAt?.toDate();
      const paidAt = firestoreData.paidAt?.toDate();

      // Prepare data for PostgreSQL
      const invoiceData = {
        firestore_id: firestoreId,
        amount: parseFloat(firestoreData.amount) || 0,
        created_at: createdAt,
        currency: firestoreData.currency || 'usd',
        donor_email: firestoreData.donorEmail || '',
        donor_id: firestoreData.donorId || '',
        donor_name: firestoreData.donorName || '',
        fundraiser_id: parseInt(firestoreData.fundraiserId) || 0,
        fundraiser_title: firestoreData.fundraiserTitle || '',
        invoice_id: firestoreData.invoiceId || '',
        paid_at: paidAt,
        payment_method: firestoreData.paymentMethod || '',
        status: firestoreData.status || '',
        stripe_payment_id: firestoreData.stripePaymentId || ''
      };

      console.log(`💾 [SYNC SERVICE] Prepared invoice data for PostgreSQL:`, {
        status: invoiceData.status,
        donor_id: invoiceData.donor_id,
        amount: invoiceData.amount
      });

      // Check if invoice already exists in PostgreSQL
      const existingInvoice = await Invoice.findOne({
        where: { firestore_id: firestoreId }
      });

      let savedInvoice;
      let isNewInvoice = false;
      
      if (existingInvoice) {
        // Update existing invoice
        console.log(`📝 [SYNC SERVICE] Updating existing invoice: ${firestoreId}`);
        await existingInvoice.update(invoiceData);
        savedInvoice = existingInvoice;
        console.log(`✅ [SYNC SERVICE] Updated invoice: ${firestoreId}`);
      } else {
        // Create new invoice
        console.log(`🆕 [SYNC SERVICE] Creating new invoice: ${firestoreId}`);
        savedInvoice = await Invoice.create(invoiceData);
        isNewInvoice = true;
        console.log(`✅ [SYNC SERVICE] Created invoice: ${firestoreId}`);
      }

      // Process points ONLY for new paid invoices or existing invoices that haven't been processed
      if (invoiceData.status === 'paid') {
        // For existing invoices, check if points were already processed
        if (!isNewInvoice && existingInvoice.points_processed) {
          console.log(`⏭️ [SYNC SERVICE] Points already processed for invoice ${firestoreId}, skipping`);
        } else {
          console.log(`💰 [SYNC SERVICE] Processing points for paid invoice: ${firestoreId}`);
          
          // Pass the Invoice model to PointsService to avoid circular dependency
          const pointsResult = await PointsService.addDonationPoints(
            {
              id: savedInvoice.id,
              amount: invoiceData.amount,
              donor_id: invoiceData.donor_id,
              status: invoiceData.status
            },
            Invoice // Pass the Invoice model as second parameter
          );
          
          if (pointsResult.success) {
            console.log(`✅ [SYNC SERVICE] Points processed: ${pointsResult.message}`);
          } else if (pointsResult.alreadyProcessed) {
            console.log(`⏭️ [SYNC SERVICE] Points already processed: ${pointsResult.message}`);
          } else {
            console.log(`❌ [SYNC SERVICE] Points processing failed:`, pointsResult.error);
          }
        }
      } else {
        console.log(`ℹ️ [SYNC SERVICE] Invoice status is ${invoiceData.status}, skipping points`);
      }

      return savedInvoice;
      
    } catch (error) {
      console.error(`💥 [SYNC SERVICE] Error syncing invoice ${firestoreId}:`, error);
      throw error;
    }
  }

  // Rest of your methods remain the same...
  async syncDonorInvoices(donorId) {
    try {
      console.log(`🔄 [SYNC SERVICE] Syncing all invoices for donor: ${donorId}`);
      const invoicesSnapshot = await db.collection('invoices')
        .where('donorId', '==', donorId)
        .get();

      console.log(`📊 [SYNC SERVICE] Found ${invoicesSnapshot.size} invoices in Firestore`);

      const syncPromises = [];
      invoicesSnapshot.forEach(doc => {
        syncPromises.push(this.syncInvoice(doc.id));
      });

      await Promise.all(syncPromises);
      console.log(`✅ [SYNC SERVICE] Synced all invoices for donor: ${donorId}`);
    } catch (error) {
      console.error(`💥 [SYNC SERVICE] Error syncing invoices for donor ${donorId}:`, error);
      throw error;
    }
  }

  setupRealTimeSync() {
    console.log('🔄 [SYNC SERVICE] Setting up real-time Firestore sync...');
    
    db.collection('invoices').onSnapshot((snapshot) => {
      console.log(`📡 [SYNC SERVICE] Real-time update detected: ${snapshot.docChanges().length} changes`);
      
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added' || change.type === 'modified') {
          try {
            console.log(`🔄 [SYNC SERVICE] Processing ${change.type} for invoice: ${change.doc.id}`);
            await this.syncInvoice(change.doc.id);
            console.log(`✅ [SYNC SERVICE] Real-time sync completed: ${change.type} invoice ${change.doc.id}`);
          } catch (error) {
            console.error(`💥 [SYNC SERVICE] Real-time sync error for ${change.doc.id}:`, error);
          }
        }
      });
    }, (error) => {
      console.error('💥 [SYNC SERVICE] Firestore real-time sync error:', error);
    });
  }
}

module.exports = new SyncService();