const { db } = require("../../config/firebase-admin");
//جلب الموقع اسم المدينة 
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
// 🔹 جميع الطلبات + النسب


exports.findAllRequest = async (req, res) => {
  try {
    const snapshot = await db.collection('requests').get();
    const totalCount = snapshot.size;

    const completeSnap = await db.collection('requests').where('status', '==', 'completed').get();
    const completeCount = completeSnap.size;

    const incompleteSnap = await db.collection('requests').where('status', '==', 'pending').get();
    const incompleteCount = incompleteSnap.size;

    let completedPercent = 0;
    let incompletePercent = 0;
    if (totalCount > 0) {
      completedPercent = (completeCount / totalCount) * 100;
      incompletePercent = (incompleteCount / totalCount) * 100;
    }

    res.json({
      total: totalCount,
      completed: completeCount,
      incomplete: incompleteCount,
      completedPercent: completedPercent.toFixed(2) + "%",
      incompletePercent: incompletePercent.toFixed(2) + "%"
    });
  } catch (error) {
    res.status(500).json({ message: "فشل في جلب الطلبات" });
  }
};

// 🔹 الطلبات المكتملة + نسبتها
exports.CompleteRequest = async (req, res) => {
  try {
    const totalSnap = await db.collection('requests').get();
    const totalCount = totalSnap.size;

    const snapshot = await db.collection('requests').where('status', '==', 'completed').get();
    const count = snapshot.size;

    let percent = 0;
    if (totalCount > 0) {
      percent = (count / totalCount) * 100;
    }

    // UPDATED: Fetch user data for each request
    const requests = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // FIXED: Initialize with default fallback first
      let userImage = '/assets/image/Fundraiser-Page/header-sec/man-profile.png';
      
      try {
        if (data.requesterId) {
          const userDoc = await db.collection('users').doc(data.requesterId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            console.log(`🔍 Fetching user data for requesterId: ${data.requesterId}`);
            
            if (userData.photoBase64) {
              // FIXED: Now userData is properly defined
              userImage = `${userData.photoBase64}`;
              console.log(`📱 Using base64 image for requesterId: ${data.requesterId}, length: ${userData.photoBase64.length}`);
            } else if (userData.userImage) {
              userImage = userData.userImage;
              console.log(`🌐 Using URL image for requesterId: ${data.requesterId}: ${userImage}`);
            } else if (userData.user_image) {
              userImage = userData.user_image;
              console.log(`🌐 Using user_image URL for requesterId: ${data.requesterId}: ${userImage}`);
            }
          } else {
            console.log(`❌ User not found for requesterId: ${data.requesterId}`);
          }
        } else {
          console.log(`❌ No requesterId found for request: ${doc.id}`);
        }
      } catch (userError) {
        console.error('Error fetching user data:', userError);
      }

      requests.push({
        id: doc.id,
        ...data,
        location: getCityFromGeoPoint(data.location),
        userImage: userImage // Add user image to the request
      });
    }

    console.log(`✅ Complete requests: ${requests.length} requests with user images`);
    res.json({
      total: totalCount,
      completed: count,
      completedPercent: percent.toFixed(2) + "%",
      requests
    });
  } catch (error) {
    console.error("خطأ في CompleteRequest:", error);
    res.status(500).json({ message: "فشل في جلب الطلبات المكتملة" });
  }
};

// 🔹 الطلبات غير المكتملة + نسبتها
exports.IncompleteRequest = async (req, res) => {
  try {
    const totalSnap = await db.collection('requests').get();
    const totalCount = totalSnap.size;

    const snapshot = await db.collection('requests').where('status', '==', 'pending').get();
    const count = snapshot.size;

    let percent = 0;
    if (totalCount > 0) {
      percent = (count / totalCount) * 100;
    }

    // UPDATED: Fetch user data for each request
    const requests = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Fetch user image
      let userImage = '/assets/image/Fundraiser-Page/header-sec/man-profile.png';
      try {
        if (data.requesterId) {
          const userDoc = await db.collection('users').doc(data.requesterId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            console.log(`🔍 Fetching user data for requesterId: ${data.requesterId}`, userData);
            
            if (userData.photoBase64) {
              userImage = `data:image/jpeg;base64,${userData.photoBase64}`;
              console.log(`📱 Using base64 image for requesterId: ${data.requesterId}`);
            } else if (userData.userImage) {
              userImage = userData.userImage;
              console.log(`🌐 Using URL image for requesterId: ${data.requesterId}: ${userImage}`);
            } else if (userData.user_image) {
              userImage = userData.user_image;
              console.log(`🌐 Using user_image URL for requesterId: ${data.requesterId}: ${userImage}`);
            }
          } else {
            console.log(`❌ User not found for requesterId: ${data.requesterId}`);
          }
        } else {
          console.log(`❌ No requesterId found for request: ${doc.id}`);
        }
      } catch (userError) {
        console.error('Error fetching user data:', userError);
      }

      requests.push({
        id: doc.id,
        ...data,
        location: getCityFromGeoPoint(data.location),
        userImage: userImage // Add user image to the request
      });
    }

    console.log(`✅ Incomplete requests: ${requests.length} requests with user images`);
    res.json({
      total: totalCount,
      incomplete: count,
      incompletePercent: percent.toFixed(2) + "%",
      requests
    });
  } catch (error) {
    console.error("خطأ في IncompleteRequest:", error);
    res.status(500).json({ message: "فشل في جلب الطلبات غير المكتملة" });
  }
};

// 🔹 الطلبات قيد التنفيذ
exports.InProgresRequest = async (req, res) => {
  try {
    const snapshot = await db.collection('requests').where('status', '==', 'in_progress').get();

    // UPDATED: Fetch user data for each request
    const requests = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Fetch user image
      let userImage = '/assets/image/Fundraiser-Page/header-sec/man-profile.png';
      try {
        if (data.requesterId) {
          const userDoc = await db.collection('users').doc(data.requesterId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            console.log(`🔍 Fetching user data for requesterId: ${data.requesterId}`, userData);
            
            if (userData.photoBase64) {
              userImage = `data:image/jpeg;base64,${userData.photoBase64}`;
              console.log(`📱 Using base64 image for requesterId: ${data.requesterId}`);
            } else if (userData.userImage) {
              userImage = userData.userImage;
              console.log(`🌐 Using URL image for requesterId: ${data.requesterId}: ${userImage}`);
            } else if (userData.user_image) {
              userImage = userData.user_image;
              console.log(`🌐 Using user_image URL for requesterId: ${data.requesterId}: ${userImage}`);
            }
          } else {
            console.log(`❌ User not found for requesterId: ${data.requesterId}`);
          }
        } else {
          console.log(`❌ No requesterId found for request: ${doc.id}`);
        }
      } catch (userError) {
        console.error('Error fetching user data:', userError);
      }

      requests.push({
        id: doc.id,
        ...data,
        location: getCityFromGeoPoint(data.location),
        userImage: userImage // Add user image to the request
      });
    }

    console.log(`✅ In-progress requests: ${requests.length} requests with user images`);
    res.json({
      inProgress: snapshot.size,
      requests
    });
  } catch (error) {
    res.status(500).json({ message: "فشل في جلب الطلبات قيد التنفيذ" });
  }
};
exports.updateActivationUnActve = async (req, res) => {
  try {
    const requesterId = req.params.id; // ID الطلب من الرابط
    const requestRef = db.collection("requests").doc(requesterId);

    const doc = await requestRef.get();
    if (!doc.exists) {
      return res.status(404).json({ message: "الطلب غير موجود" });
    }

    const currentStatus = doc.data().activation || "active";

    // ✅ هنا لو بدك دايمًا يتحول من active → unactive فقط
    const newStatus = "unactive";
    
    await requestRef.update({ activation: newStatus});
   res.status(200).json({ message: "تم إلغاء التفعيل بنجاح ✅" });

  }
  catch (error) {
    console.error("خطأ أثناء التحديث:", error);
    res.status(500).json({ message: "فشل التحديث" });
  }
};
exports.updateActivationActve = async (req, res) => {
  try {
    const requesterId = req.params.id; // ID الطلب من الرابط
    const requestRef = db.collection("requests").doc(requesterId);

    const doc = await requestRef.get();
    if (!doc.exists) {
      return res.status(404).json({ message: "الطلب غير موجود" });
    }

    const currentStatus = doc.data().activation || "unactive";

    // ✅ هنا لو بدك دايمًا يتحول من active → unactive فقط
    const newStatus = "active";
    
    await requestRef.update({ activation: newStatus});
    res.status(200).json({ message: "تم  التفعيل بنجاح ✅" });

  }
  catch (error) {
    console.error("خطأ أثناء التحديث:", error);
    res.status(500).json({ message: "فشل التحديث" });
  }
};
exports.updateStatusInProgres = async (req, res) => {
  try {
    const requesterId = req.params.id; // ID الطلب من الرابط
    const requestRef = db.collection("requests").doc(requesterId);

    const doc = await requestRef.get();
    if (!doc.exists) {
      return res.status(404).json({ message: "الطلب غير موجود" });
    }

    const currentStatus = doc.data().activation || "in_progress";

    // ✅ هنا لو بدك دايمًا يتحول من active → unactive فقط
    const newStatus = "pending";
    const newisPickedUp = false

    await requestRef.update({ status: newStatus ,isPickedUp:newisPickedUp});
res.status(200).json({ message: "تم ارجاع الحالة الى الانتظار  بنجاح ✅" });
  }
  catch (error) {
    console.error("خطأ أثناء التحديث:", error);
    res.status(500).json({ message: "فشل التحديث" });
  }
};
exports.getAll = async (req, res) => {
  try {
    const banners = await EmergencyReliefBanner.findAll();
    res.render("dashbored/admin-panel", { banners });  // صفحة عرض
  } catch (err) {
    res.send("خطأ: " + err.message);
  }
};

// Add this to your users controller
exports.getUserById = async (req, res) => {
    try {
        const userId = req.params.uid;
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const userData = userDoc.data();
        res.json({
            id: userDoc.id,
            ...userData
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};