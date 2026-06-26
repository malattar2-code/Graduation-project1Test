// services/syncFundraisers.js - Fixed version
const admin = require("firebase-admin");
const { Sequelize, Op } = require("sequelize");
const Fundraiser = require("../models/Fundraiser");
const User = require("../models/User");

class SyncFundraisers {
    constructor() {
        this.db = admin.firestore();
        this.fundraisersCollection = this.db.collection("fundraisers");
        this.isListening = false;
        this.isPostgresListening = false;
    }

    // Helper function to calculate fundraiser status
    calculateFundraiserStatus(collectedAmount, targetAmount) {
        const collected = parseFloat(collectedAmount);
        const target = parseFloat(targetAmount);
        
        return collected >= target ? 'completed' : 'incompleted';
    }

    // Safe user lookup with type conversion
    async findUserByFirebaseUid(firebaseUid) {
        try {
            // Convert to string to ensure type consistency
            const uidString = String(firebaseUid);
            
            const user = await User.findOne({
                where: { firebase_uid: uidString }
            });
            
            return user;
        } catch (error) {
            console.error(`❌ Error finding user with UID ${firebaseUid}:`, error);
            return null;
        }
    }

    // Start real-time sync (keep existing methods but use enhanced versions)
    startRealTimeSync() {
        if (this.isListening) {
            console.log('🔊 Real-time Firestore sync is already running');
            return;
        }

        console.log('🔊 Starting enhanced real-time Firestore sync...');
        
        this.fundraisersCollection.onSnapshot((snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === 'modified' || change.type === 'added') {
                    try {
                        await this.syncSingleFundraiserFromFirebase(change.doc);
                        console.log(`✅ Firestore → PostgreSQL: ${change.type} fundraiser ${change.doc.id}`);
                    } catch (error) {
                        console.error(`❌ Firestore sync error for ${change.doc.id}:`, error);
                    }
                }
            });
        }, (error) => {
            console.error('💥 Firestore real-time sync error:', error);
        });

        this.isListening = true;
        console.log('🎯 Enhanced real-time Firestore sync activated');
    }

    // Start listening to PostgreSQL changes
    startPostgresRealTimeSync() {
        if (this.isPostgresListening) {
            console.log('🔊 Real-time PostgreSQL sync is already running');
            return;
        }

        console.log('🔊 Starting real-time PostgreSQL sync...');

        // Use polling every 30 seconds
        this.postgresPollingInterval = setInterval(async () => {
            try {
                await this.syncUpdatedFundraisersToFirebase();
            } catch (error) {
                console.error('💥 PostgreSQL polling sync error:', error);
            }
        }, 300000); // Check every 30 seconds

        this.isPostgresListening = true;
        console.log('🎯 Real-time PostgreSQL sync activated (polling every 30s)');
    }

    // Sync updated PostgreSQL records to Firestore
    async syncUpdatedFundraisersToFirebase() {
        try {
            console.log('🔄 Checking for updated PostgreSQL fundraisers...');
            
            // Find fundraisers updated in the last 5 minutes that have Firebase IDs
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            
            const updatedFundraisers = await Fundraiser.findAll({
                where: {
                    firebase_id: { [Op.ne]: null },
                    updated_at: { [Op.gte]: fiveMinutesAgo }
                },
                include: [{ model: User, as: 'user' }]
            });

            console.log(`📊 Found ${updatedFundraisers.length} updated fundraisers in PostgreSQL`);

            let syncedCount = 0;

            for (const fundraiser of updatedFundraisers) {
                try {
                    await this.syncSingleFundraiserToFirebase(fundraiser);
                    syncedCount++;
                } catch (error) {
                    console.error(`❌ Error syncing fundraiser ${fundraiser.fundraiser_id} to Firebase:`, error);
                }
            }

            if (syncedCount > 0) {
                console.log(`✅ PostgreSQL → Firestore: Synced ${syncedCount} updated fundraisers`);
            }

            return { syncedCount, total: updatedFundraisers.length };
        } catch (error) {
            console.error('💥 Error in syncUpdatedFundraisersToFirebase:', error);
            throw error;
        }
    }

    // ✅ ENHANCED: Sync single fundraiser from Firestore to PostgreSQL
    async syncSingleFundraiserFromFirebase(doc) {
        try {
            const firebaseData = doc.data();
            const firebaseDocId = doc.id;

            console.log(`🔄 Syncing from Firestore: ${firebaseDocId}`);

            // Use the safe user lookup method with type conversion
            const user = await this.findUserByFirebaseUid(firebaseData.userId);

            if (!user) {
                console.warn(`⚠️ User not found for Firebase UID: ${firebaseData.userId}`);
                return null;
            }

            // Calculate status based on amounts
            let fundraiserStatus;
            if (firebaseData.fundraiserStatus) {
                fundraiserStatus = firebaseData.fundraiserStatus;
            } else {
                fundraiserStatus = this.calculateFundraiserStatus(
                    firebaseData.collectedAmount || 0,
                    firebaseData.targetAmount || 0
                );
            }

            // ✅ CRITICAL: Look for existing fundraiser by firebase_id OR create new
            const [fundraiser, created] = await Fundraiser.findOrCreate({
                where: { 
                    [Op.or]: [
                        { firebase_id: firebaseDocId },
                        { fundraiser_id: firebaseData.fundraiserId }
                    ]
                },
                defaults: {
                    fundraiser_title: firebaseData.fundraiserTitle || 'Untitled',
                    fundraiser_categories: firebaseData.fundraiserCategories || [],
                    fundraiser_target_amount: Number(firebaseData.targetAmount) || 0,
                    fundraiser_collected_amount: Number(firebaseData.collectedAmount) || 0,
                    fundraiser_status: fundraiserStatus,
                    fundraiser_main_image: firebaseData.fundraiserMainImage || '',
                    fundraiser_sub_image_one: firebaseData.fundraiserSubImageOne || null,
                    fundraiser_sub_image_two: firebaseData.fundraiserSubImageTwo || null,
                    fundraiser_sub_image_three: firebaseData.fundraiserSubImageThree || null,
                    fundraiser_description: firebaseData.fundraiserDescription || '',
                    fundraiser_user_id: user.id,
                    firebase_id: firebaseDocId, // ✅ Always store Firebase ID
                    created_at: firebaseData.createdAt ? firebaseData.createdAt.toDate() : new Date(),
                    updated_at: firebaseData.updatedAt ? firebaseData.updatedAt.toDate() : new Date(),
                    synced_at: new Date()
                }
            });

            if (!created) {
                // For updates, always calculate status based on current amounts
                const updatedStatus = this.calculateFundraiserStatus(
                    Number(firebaseData.collectedAmount) || fundraiser.fundraiser_collected_amount,
                    Number(firebaseData.targetAmount) || fundraiser.fundraiser_target_amount
                );

                // ✅ CRITICAL: Ensure firebase_id is always updated
                await fundraiser.update({
                    fundraiser_title: firebaseData.fundraiserTitle || fundraiser.fundraiser_title,
                    fundraiser_categories: firebaseData.fundraiserCategories || fundraiser.fundraiser_categories,
                    fundraiser_target_amount: Number(firebaseData.targetAmount) || fundraiser.fundraiser_target_amount,
                    fundraiser_collected_amount: Number(firebaseData.collectedAmount) || fundraiser.fundraiser_collected_amount,
                    fundraiser_status: updatedStatus,
                    fundraiser_main_image: firebaseData.fundraiserMainImage || fundraiser.fundraiser_main_image,
                    fundraiser_sub_image_one: firebaseData.fundraiserSubImageOne || fundraiser.fundraiser_sub_image_one,
                    fundraiser_sub_image_two: firebaseData.fundraiserSubImageTwo || fundraiser.fundraiser_sub_image_two,
                    fundraiser_sub_image_three: firebaseData.fundraiserSubImageThree || fundraiser.fundraiser_sub_image_three,
                    fundraiser_description: firebaseData.fundraiserDescription || fundraiser.fundraiser_description,
                    firebase_id: firebaseDocId, // ✅ Ensure Firebase ID is always set
                    is_blocked: firebaseData.isBlocked || false,
                    block_reason: firebaseData.blockReason || null,
                    blocked_at: firebaseData.blockedAt ? firebaseData.blockedAt.toDate() : null,
                    updated_at: firebaseData.updatedAt ? firebaseData.updatedAt.toDate() : new Date(),
                    synced_at: new Date()
                });

                console.log(`✅ Updated PostgreSQL record for Firestore ID: ${firebaseDocId}`);
            } else {
                console.log(`✅ Created new PostgreSQL record for Firestore ID: ${firebaseDocId}`);
            }

            return { fundraiser, created, firebaseDocId };
        } catch (error) {
            console.error(`❌ Error syncing fundraiser from Firestore ${doc.id}:`, error);
            throw error;
        }
    }

    // ✅ ENHANCED: Sync single fundraiser from PostgreSQL to Firestore
    async syncSingleFundraiserToFirebase(fundraiser, forceCreateNew = false) {
        try {
            // Include user data for Firestore
            const fundraiserWithUser = await Fundraiser.findByPk(fundraiser.fundraiser_id, {
                include: [{ model: User, as: 'user' }]
            });

            if (!fundraiserWithUser) {
                console.warn(`⚠️ Fundraiser ${fundraiser.fundraiser_id} not found`);
                return null;
            }

            // Calculate status for Firestore
            const fundraiserStatus = this.calculateFundraiserStatus(
                fundraiserWithUser.fundraiser_collected_amount,
                fundraiserWithUser.fundraiser_target_amount
            );

            // Prepare Firestore data
            const firebaseData = {
                fundraiserTitle: fundraiserWithUser.fundraiser_title,
                fundraiserCategories: fundraiserWithUser.fundraiser_categories || [],
                targetAmount: Number(fundraiserWithUser.fundraiser_target_amount),
                collectedAmount: Number(fundraiserWithUser.fundraiser_collected_amount),
                fundraiserStatus: fundraiserStatus,
                fundraiserMainImage: fundraiserWithUser.fundraiser_main_image,
                fundraiserSubImageOne: fundraiserWithUser.fundraiser_sub_image_one,
                fundraiserSubImageTwo: fundraiserWithUser.fundraiser_sub_image_two,
                fundraiserSubImageThree: fundraiserWithUser.fundraiser_sub_image_three,
                fundraiserDescription: fundraiserWithUser.fundraiser_description,
                userId: fundraiserWithUser.user ? fundraiserWithUser.user.firebase_uid : null,
                fundraiserId: fundraiserWithUser.fundraiser_id,
                firebaseFundraiserId: fundraiserWithUser.firebase_id, // ✅ Store Firebase ID in Firestore
                isBlocked: fundraiserWithUser.is_blocked || false,
                blockReason: fundraiserWithUser.block_reason || null,
                blockedAt: fundraiserWithUser.blocked_at ? 
                admin.firestore.Timestamp.fromDate(fundraiserWithUser.blocked_at) : null,
                createdAt: admin.firestore.Timestamp.fromDate(fundraiserWithUser.created_at || new Date()),
                updatedAt: admin.firestore.Timestamp.fromDate(fundraiserWithUser.updated_at || new Date()),
                syncedAt: admin.firestore.Timestamp.fromDate(new Date())
            };

            let docRef;

            if (forceCreateNew || !fundraiserWithUser.firebase_id) {
                // Create new Firestore document
                docRef = await this.fundraisersCollection.add(firebaseData);
                
                // ✅ CRITICAL: Update PostgreSQL with the new Firestore ID
                await fundraiserWithUser.update({
                    firebase_id: docRef.id,
                    synced_at: new Date()
                });

                console.log(`✅ Created new Firestore document: ${docRef.id} for fundraiser ${fundraiserWithUser.fundraiser_id}`);
            } else {
                // Update existing Firestore document
                docRef = this.fundraisersCollection.doc(fundraiserWithUser.firebase_id);
                await docRef.set(firebaseData, { merge: true });
                console.log(`✅ Updated existing Firestore document: ${fundraiserWithUser.firebase_id}`);
            }

            return { docRef, fundraiserStatus };
        } catch (error) {
            console.error(`❌ Error syncing fundraiser ${fundraiser.fundraiser_id} to Firebase:`, error);
            throw error;
        }
    }
    // ✅ NEW: Method to fix missing Firebase IDs
    async fixMissingFirebaseIds() {
        try {
            console.log('🔧 Fixing missing Firebase IDs...');
            
            // Find fundraisers without Firebase IDs
            const fundraisersWithoutFirebaseId = await Fundraiser.findAll({
                where: { firebase_id: null },
                include: [{ model: User, as: 'user' }]
            });

            console.log(`📊 Found ${fundraisersWithoutFirebaseId.length} fundraisers without Firebase IDs`);

            let fixedCount = 0;

            for (const fundraiser of fundraisersWithoutFirebaseId) {
                try {
                    await this.syncSingleFundraiserToFirebase(fundraiser, true);
                    fixedCount++;
                    console.log(`✅ Fixed Firebase ID for fundraiser ${fundraiser.fundraiser_id}`);
                } catch (error) {
                    console.error(`❌ Error fixing Firebase ID for fundraiser ${fundraiser.fundraiser_id}:`, error);
                }
            }

            console.log(`🎉 Fixed ${fixedCount} missing Firebase IDs`);
            return { fixedCount, total: fundraisersWithoutFirebaseId.length };
        } catch (error) {
            console.error('💥 Error in fixMissingFirebaseIds:', error);
            throw error;
        }
    }

    // ✅ NEW: Method to verify synchronization
    async verifySync() {
        try {
            console.log('🔍 Verifying synchronization...');
            
            // Count fundraisers in PostgreSQL
            const postgresCount = await Fundraiser.count();
            
            // Count fundraisers in Firestore
            const firestoreSnapshot = await this.fundraisersCollection.get();
            const firestoreCount = firestoreSnapshot.size;
            
            // Count fundraisers with Firebase IDs in PostgreSQL
            const postgresWithFirebaseId = await Fundraiser.count({
                where: { firebase_id: { [Op.ne]: null } }
            });

            console.log('📊 Synchronization Report:');
            console.log(`   PostgreSQL total: ${postgresCount}`);
            console.log(`   Firestore total: ${firestoreCount}`);
            console.log(`   PostgreSQL with Firebase ID: ${postgresWithFirebaseId}`);
            console.log(`   Missing Firebase IDs: ${postgresCount - postgresWithFirebaseId}`);

            return {
                postgresCount,
                firestoreCount,
                postgresWithFirebaseId,
                missingFirebaseIds: postgresCount - postgresWithFirebaseId
            };
        } catch (error) {
            console.error('💥 Error in verifySync:', error);
            throw error;
        }
    }


    // PostgreSQL → Firestore (for new records)
    async syncToFirebase() {
        try {
            console.log('🔄 Syncing NEW fundraisers to Firebase...');
            
            const unsyncedFundraisers = await Fundraiser.findAll({
                where: { firebase_id: null },
                include: [{ model: User, as: 'user' }]
            });

            console.log(`📊 Found ${unsyncedFundraisers.length} unsynced fundraisers`);

            let syncedCount = 0;

            for (const fundraiser of unsyncedFundraisers) {
                try {
                    // Calculate status for Firestore
                    const fundraiserStatus = this.calculateFundraiserStatus(
                        fundraiser.fundraiser_collected_amount,
                        fundraiser.fundraiser_target_amount
                    );

                    const firebaseData = {
                        fundraiserTitle: fundraiser.fundraiser_title,
                        fundraiserCategories: fundraiser.fundraiser_categories || [],
                        targetAmount: Number(fundraiser.fundraiser_target_amount),
                        collectedAmount: Number(fundraiser.fundraiser_collected_amount),
                        fundraiserStatus: fundraiserStatus,
                        fundraiserMainImage: fundraiser.fundraiser_main_image,
                        fundraiserSubImageOne: fundraiser.fundraiser_sub_image_one,
                        fundraiserSubImageTwo: fundraiser.fundraiser_sub_image_two,
                        fundraiserSubImageThree: fundraiser.fundraiser_sub_image_three,
                        fundraiserDescription: fundraiser.fundraiser_description,
                        userId: fundraiser.user ? fundraiser.user.firebase_uid : null,
                        fundraiserId: fundraiser.fundraiser_id,
                        createdAt: admin.firestore.Timestamp.fromDate(fundraiser.created_at || new Date()),
                        updatedAt: admin.firestore.Timestamp.fromDate(fundraiser.updated_at || new Date()),
                        syncedAt: admin.firestore.Timestamp.fromDate(new Date())
                    };

                    const docRef = await this.fundraisersCollection.add(firebaseData);
                    
                    // Update PostgreSQL with Firestore ID
                    await fundraiser.update({
                        firebase_id: docRef.id,
                        synced_at: new Date()
                    });

                    syncedCount++;
                    console.log(`✅ Created new fundraiser in Firebase: ${docRef.id} with status: ${fundraiserStatus}`);
                } catch (error) {
                    console.error(`❌ Error syncing fundraiser ${fundraiser.fundraiser_id}:`, error);
                }
            }

            console.log(`🎉 Sync to Firebase completed: ${syncedCount}/${unsyncedFundraisers.length}`);
            return { syncedCount, total: unsyncedFundraisers.length };
        } catch (error) {
            console.error('💥 Error in syncToFirebase:', error);
            throw error;
        }
    }

    // Firestore → PostgreSQL
    async syncFromFirebase() {
        try {
            console.log('🔄 Syncing fundraisers from Firebase...');
            
            const snapshot = await this.fundraisersCollection.get();
            console.log(`📊 Found ${snapshot.size} fundraisers in Firebase`);

            let syncedCount = 0;

            for (const doc of snapshot.docs) {
                try {
                    await this.syncSingleFundraiserFromFirebase(doc);
                    syncedCount++;
                    console.log(`✅ Synced fundraiser from Firebase: ${doc.id}`);
                } catch (error) {
                    console.error(`❌ Error processing Firebase document ${doc.id}:`, error);
                }
            }

            console.log(`🎉 Sync from Firebase completed: ${syncedCount}/${snapshot.size}`);
            return { syncedCount, total: snapshot.size };
        } catch (error) {
            console.error('💥 Error in syncFromFirebase:', error);
            throw error;
        }
    }

    // Force sync all PostgreSQL fundraisers to Firestore
    async forceSyncAllToFirebase() {
        try {
            console.log('🔄 Force syncing ALL fundraisers to Firebase...');
            
            const allFundraisers = await Fundraiser.findAll({
                where: { firebase_id: { [Op.ne]: null } },
                include: [{ model: User, as: 'user' }]
            });

            console.log(`📊 Found ${allFundraisers.length} fundraisers with Firebase IDs`);

            let syncedCount = 0;

            for (const fundraiser of allFundraisers) {
                try {
                    await this.syncSingleFundraiserToFirebase(fundraiser);
                    syncedCount++;
                } catch (error) {
                    console.error(`❌ Error force syncing fundraiser ${fundraiser.fundraiser_id} to Firebase:`, error);
                }
            }

            console.log(`🎉 Force sync to Firebase completed: ${syncedCount}/${allFundraisers.length}`);
            return { syncedCount, total: allFundraisers.length };
        } catch (error) {
            console.error('💥 Error in forceSyncAllToFirebase:', error);
            throw error;
        }
    }

    // Two-way sync
    async twoWaySync() {
        try {
            console.log('🔄 Starting two-way synchronization...');
            
            const toFirebase = await this.syncToFirebase();
            const fromFirebase = await this.syncFromFirebase();
            
            console.log('🎉 Two-way sync completed successfully');
            return {
                toFirebase,
                fromFirebase,
                totalSynced: toFirebase.syncedCount + fromFirebase.syncedCount
            };
        } catch (error) {
            console.error('💥 Error in two-way sync:', error);
            throw error;
        }
    }

    // Start complete bidirectional sync
    startBidirectionalSync() {
        this.startRealTimeSync(); // Firestore → PostgreSQL
        this.startPostgresRealTimeSync(); // PostgreSQL → Firestore
        console.log('🔄 Bidirectional sync started');
    }

    // Stop all sync processes
    stopAllSync() {
        if (this.postgresPollingInterval) {
            clearInterval(this.postgresPollingInterval);
            console.log('🛑 PostgreSQL polling stopped');
        }
        this.isListening = false;
        this.isPostgresListening = false;
        console.log('🛑 All sync processes stopped');
    }

    // Method to update status for all fundraisers (useful for migration)
    async updateAllFundraiserStatuses() {
        try {
            console.log('🔄 Updating fundraiser statuses for all records...');
            
            const fundraisers = await Fundraiser.findAll();
            let updatedCount = 0;

            for (const fundraiser of fundraisers) {
                const newStatus = this.calculateFundraiserStatus(
                    fundraiser.fundraiser_collected_amount,
                    fundraiser.fundraiser_target_amount
                );

                if (fundraiser.fundraiser_status !== newStatus) {
                    await fundraiser.update({
                        fundraiser_status: newStatus
                    });
                    updatedCount++;
                }
            }

            console.log(`🎉 Updated ${updatedCount} fundraiser statuses`);
            return { updatedCount, total: fundraisers.length };
        } catch (error) {
            console.error('💥 Error updating fundraiser statuses:', error);
            throw error;
        }
    }
}

module.exports = SyncFundraisers;