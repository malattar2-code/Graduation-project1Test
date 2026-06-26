const { db } = require("../config/firebase-admin");
const { GeoPoint } = require("firebase-admin").firestore;

const addLocationToAllUsers = async () => {
  try {
    const usersSnapshot = await db.collection("users").get();

    if (usersSnapshot.empty) {
      console.log("No users found.");
      return;
    }

    // مثال: موقع افتراضي (يمكن تغييره حسب الحاجة)
    const defaultLatitude = 31.42451;
    const defaultLongitude = 34.37691;

    for (const doc of usersSnapshot.docs) {
      const uid = doc.id;

      // تحديث المستند بدون حذف الحقول الأخرى
      await db.collection("users").doc(uid).update({
        location: new GeoPoint(defaultLatitude, defaultLongitude)
      });

      console.log(`Location added for user ${uid}`);
    }

    console.log("All users updated successfully!");
  } catch (err) {
    console.error("Error updating users:", err.message);
  }
};

addLocationToAllUsers();
