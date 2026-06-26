// const admin = require('firebase-admin');
// const UserPG = require('../models/User'); // موديل Sequelize

// async function syncFirebaseUsers() {
//   try {
//     const snapshot = await admin.firestore().collection('users').get();

//     for (const doc of snapshot.docs) {
//       const userData = doc.data();

//       // تجهيز البيانات مع تعيين قيم افتراضية عند الحاجة
//       const upsertData = {
//         firebase_uid: userData.uid || doc.id,
//         fullName: userData.fullName || 'Unknown User',
//         email: userData.email || `user_${doc.id}@example.com`,
//         password: userData.password || 'defaultPassword', // أو تركها null إذا مسموح
//         isVerified: userData.isVerified ?? false,
//         userType: userData.userType || 'unknown',
//         location: userData.location
//           ? { type: 'Point', coordinates: [userData.location.longitude, userData.location.latitude] }
//           : null,
//         phoneNumber: userData.phoneNumber || null,
//       };

//       // تنفيذ upsert في PostgreSQL
//       await UserPG.upsert(upsertData);
//       console.log(`✅ تم مزامنة المستخدم ${upsertData.email}`);
//     }

//     console.log('✅ المزامنة انتهت');

//   } catch (err) {
//     console.error('❌ خطأ أثناء مزامنة المستخدمين:', err);
//   }
// }

// services/userSync.js - UPDATED VERSION
// services/userSync.js - UPDATED VERSION (Respects Manual Bans)
const admin = require('firebase-admin');
const UserPG = require('../models/User');

async function syncFirebaseUsers() {
  try {
    console.log('🔄 Starting user sync...');
    
    // 1️⃣ Get all users from Firebase
    const snapshot = await admin.firestore().collection('users').get();
    const firebaseUsers = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      firebase_uid: doc.id
    }));

    console.log(`📊 Found ${firebaseUsers.length} users in Firebase`);

    // 2️⃣ Get all users from PostgreSQL
    const pgUsers = await UserPG.findAll();
    const pgUsersMap = {};
    pgUsers.forEach(u => { 
      pgUsersMap[u.firebase_uid] = u;
    });

    console.log(`📊 Found ${pgUsers.length} users in PostgreSQL`);

    let updatedCount = 0;
    let createdCount = 0;
    let skippedManualBans = 0;

    // 3️⃣ Sync additions/updates
    for (const fbUser of firebaseUsers) {
      try {
        // Helper functions (keep your existing ones)
        const parseDate = (dateValue) => {
          if (!dateValue) return null;
          if (dateValue.toDate && typeof dateValue.toDate === 'function') {
            return dateValue.toDate();
          }
          const date = new Date(dateValue);
          return isNaN(date.getTime()) ? null : date;
        };

        const parseCoordinates = (location) => {
          if (!location) return null;
          try {
            if (typeof location === 'string') {
              const coords = location.match(/[-+]?[0-9]*\.?[0-9]+/g);
              if (coords && coords.length >= 2) {
                return {
                  type: 'Point',
                  coordinates: [parseFloat(coords[1]), parseFloat(coords[0])]
                };
              }
            }
            if (Array.isArray(location)) {
              return {
                type: 'Point',
                coordinates: [parseFloat(location[1]), parseFloat(location[0])]
              };
            }
            if (location.latitude !== undefined && location.longitude !== undefined) {
              return {
                type: 'Point',
                coordinates: [parseFloat(location.longitude), parseFloat(location.latitude)]
              };
            }
            return null;
          } catch (error) {
            console.error('Error parsing location:', error);
            return null;
          }
        };

        // Prepare base user data
        const baseUserData = {
          firebase_uid: fbUser.uid || fbUser.id,
          full_name: fbUser.fullName || fbUser.full_name || 'Unknown User',
          email: fbUser.email || `user${fbUser.id}@example.com`,
          is_verified: fbUser.isVerified !== undefined ? fbUser.isVerified : 
                      fbUser.is_verified !== undefined ? fbUser.is_verified : false,
          user_type: fbUser.userType || fbUser.user_type || 'unknown',
          location: parseCoordinates(fbUser.location),
          phone_number: fbUser.phone || fbUser.phone_number || null,
          gender: fbUser.gender || null,
          birth_date: parseDate(fbUser.birthDate),
          user_image: fbUser.userImage || fbUser.user_image || null
        };

        // Check if user exists in PostgreSQL
        const existingPgUser = pgUsersMap[baseUserData.firebase_uid];
        
        // 🚨 CRITICAL FIX: Respect manual bans
        let finalUserData = { ...baseUserData };
        
        if (existingPgUser) {
          // If user exists, check if they were manually banned/unbanned
          const existingBanReason = existingPgUser.ban_reason;
          const isManualBan = existingBanReason && 
                            (existingBanReason.includes('Manual ban by administrator') ||
                             existingBanReason.includes('Manually banned by administrator'));
          
          const isManualUnban = existingBanReason === null && !existingPgUser.is_banned;
          
          if (isManualBan || isManualUnban) {
            // 🛑 RESPECT MANUAL ACTION: Don't override manual bans/unbans
            console.log(`🔒 Respecting manual action for user ${baseUserData.firebase_uid}:`, {
              manualAction: isManualBan ? 'BAN' : 'UNBAN',
              existingIsBanned: existingPgUser.is_banned,
              firebaseIsBanned: fbUser.isBanned
            });
            
            // Keep the existing ban status and reason
            finalUserData.is_banned = existingPgUser.is_banned;
            finalUserData.ban_reason = existingPgUser.ban_reason;
            skippedManualBans++;
          } else {
            // 🔄 Auto-sync ban status for non-manual cases
            finalUserData.is_banned = fbUser.isBanned !== undefined ? fbUser.isBanned : 
                                    fbUser.is_banned !== undefined ? fbUser.is_banned : false;
            finalUserData.ban_reason = fbUser.banReason || fbUser.ban_reason || null;
          }
        } else {
          // New user - sync ban status normally
          finalUserData.is_banned = fbUser.isBanned !== undefined ? fbUser.isBanned : 
                                  fbUser.is_banned !== undefined ? fbUser.is_banned : false;
          finalUserData.ban_reason = fbUser.banReason || fbUser.ban_reason || null;
        }

        console.log(`🔄 Syncing user ${finalUserData.firebase_uid}:`, {
          is_banned: finalUserData.is_banned,
          ban_reason: finalUserData.ban_reason,
          email: finalUserData.email
        });

        if (existingPgUser) {
          // ✅ Update existing user
          const [affectedCount] = await UserPG.update(finalUserData, { 
            where: { firebase_uid: finalUserData.firebase_uid } 
          });
          if (affectedCount > 0) {
            updatedCount++;
            console.log(`♻️ Updated user ${finalUserData.email} - Banned: ${finalUserData.is_banned}`);
          }
        } else {
          // ✅ Add new user
          await UserPG.create(finalUserData);
          createdCount++;
          console.log(`➕ Added user ${finalUserData.email} - Banned: ${finalUserData.is_banned}`);
        }
      } catch (userError) {
        console.error(`💥 Error syncing user ${fbUser.uid || fbUser.id}:`, userError.message);
        continue;
      }
    }

    // 4️⃣ Sync deletions
    const firebaseUidSet = new Set(firebaseUsers.map(u => u.uid || u.id));
    let deletedCount = 0;
    
    for (const pgUser of pgUsers) {
      if (!firebaseUidSet.has(pgUser.firebase_uid)) {
        await UserPG.destroy({ where: { firebase_uid: pgUser.firebase_uid } });
        deletedCount++;
        console.log(`❌ Deleted user ${pgUser.email} (not found in Firebase)`);
      }
    }

    console.log(`✅ User sync completed: ${createdCount} created, ${updatedCount} updated, ${deletedCount} deleted, ${skippedManualBans} manual bans respected`);
  } catch (err) {
    console.error('❌ Error during user sync:', err);
  }
}

module.exports = { syncFirebaseUsers };