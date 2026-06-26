const { auth, db } = require("../../config/firebase-admin");
// const geoNames = require("../../services/geonames.json");
const fs = require("fs");
const path = require("path");
const geonames = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../services/geonames.json"), "utf8")
);

// دالة لإيجاد المدينة بناءً على أقرب خط عرض وخط طول
function getCityFromGeoPoint(location) {
  try {
    if (!location || !location._latitude || !location._longitude) return "غير معروف";

    let closest = { city: "غير معروف", distance: Infinity };
    geonames.forEach(city => {
      const dLat = city.lat - location._latitude;
      const dLng = city.lng - location._longitude;
      const dist = dLat * dLat + dLng * dLng;
      if (dist < closest.distance) {
        closest = { city: city.name, distance: dist };
      }
    });

    return closest.city;
  } catch (err) {
    console.error("خطأ في تحويل GeoPoint:", err);
    return "غير معروف";
  }
}

//المدينة
// function getCityFromGeoPoint(location) {
//   if (!location || !location._latitude || !location._longitude) return "غير معروف";

//   let closestCity = "غير معروف";
//   let minDistance = Number.MAX_VALUE;

//   geoNames.forEach(city => {
//     const dLat = city.lat - location._latitude;
//     const dLng = city.lng - location._longitude;
//     const distance = Math.sqrt(dLat*dLat + dLng*dLng);

//     if (distance < minDistance) {
//       minDistance = distance;
//       closestCity = city.name;
//     }
//   });

//   return closestCity;
// }

// 🔹 جميع المستخدمين
exports.findAllUsers = async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const usersCount = usersSnapshot.size;

    let index = 1;
    const usersList = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      const location = data.location ? {
        latitude: data.location._latitude,
        longitude: data.location._longitude
      } : null;

      return {
        number: index++,
        id: doc.id,
        ...data,
        //  location: getCityFromGeoPoint(data.location)
      };
    });

    res.json({ count: usersCount, users: usersList });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "فشل في جلب المستخدمين" });
  }
};

// 🔹 المستخدمين (Fundraisers / Requesters)
exports.requerterUser = async (req, res) => {
  try {
    const snapshot = await db.collection("users")
      .where("userType", "==", "requester")
      .get();

    let index = 1;

    const list = snapshot.docs.map(doc => {
      const data = doc.data();
      let location = "غير معروف";

      try {
        location = getCityFromGeoPoint(data.location);
      } catch (err) {
        console.error("خطأ في doc.id =", doc.id, err);
      }

      return {
        number: index++,
        id: doc.id,
        ...data,
        location
      };
    });

    res.json({ count: snapshot.size, users: list });
  } catch (error) {
    console.error("خطأ في requerterUser:", error);
    res.status(500).json({ message: "فشل في جلب البيانات" });
  }
};

// 🔹 المستخدمين (Donors)
exports.donorUsers = async (req, res) => {
  try {
    const snapshot = await db.collection('users').where('userType', '==', 'donor').get();
    let index = 1;
   const list = snapshot.docs.map(doc => {
      const data = doc.data();
      let locationName = "غير معروف";

      try {
        location = getCityFromGeoPoint(data.location);
      } catch (err) {
        console.error("خطأ في doc.id =", doc.id, err);
      }

      return {
        number: index++,
        id: doc.id,
        ...data,
        location
      };
    });

    res.json({ count: snapshot.size, users: list });
  } catch (error) {
    res.status(500).json({ message: "فشل في جلب البيانات" });
  }
};

// 🔹 حذف مستخدم
exports.deleteUser = async (req, res) => {
  const uid = req.params.id;
  if (!uid) return res.status(400).json({ success: false, message: "User ID required" });

  try {
    // حذف المستخدم من Firestore
    await db.collection("users").doc(uid).delete();

    // حذف البيانات التابعة
    const collectionsToDelete = ["posts", "requests"];
    for (const col of collectionsToDelete) {
      const snapshot = await db.collection(col).where("uid", "==", uid).get();
      if (!snapshot.empty) {
        const batch = db.batch();
        snapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }
    }

    // حذف من Firebase Auth
    await auth.deleteUser(uid).catch(() => {});

    return res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

