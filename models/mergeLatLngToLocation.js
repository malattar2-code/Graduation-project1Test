const { db } = require("../config/firebase-admin");
const { GeoPoint } = require("firebase-admin").firestore;

const mergeLatLngToLocation = async () => {
  try {
    const usersSnapshot = await db.collection("users").get();

    if (usersSnapshot.empty) {
      console.log("No users found.");
      return;
    }

    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      const uid = doc.id;

      const latitude = data.latitude;
      const longitude = data.longitude;

      if (latitude !== undefined && longitude !== undefined) {
        await db.collection("users").doc(uid).update({
          location: new GeoPoint(Number(latitude), Number(longitude))
        });

        console.log(`Location set for user ${uid}`);
      } else {
        console.log(`User ${uid} does not have latitude/longitude fields.`);
      }
    }

    console.log("All users processed successfully!");
  } catch (err) {
    console.error("Error updating users:", err.message);
  }
};

mergeLatLngToLocation();
