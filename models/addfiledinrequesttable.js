const db = require('../config/firebase-admin'); // هذا الملف اللي انت مجهزه

async function addFieldToRequests() {
  try {
    const snapshot = await db.collection("requests").get();

    // نعمل batch عشان نحدث الكل دفعة واحدة
    const batch = db.batch();

    snapshot.forEach(doc => {
      const docRef = db.collection("requests").doc(doc.id);

      // إضافة الحقل الجديد مع الحفاظ على باقي البيانات
      batch.update(docRef, { activation: "active" }); 
      // تقدر تغير "active" لقيمة ثانية حسب المطلوب
    });

    await batch.commit();
    console.log("✅ تمت إضافة الحقل لجميع المستندات بدون حذف البيانات السابقة");
  } catch (error) {
    console.error("❌ خطأ أثناء الإضافة:", error);
  }
}

// استدعاء الدالة مرة واحدة
addFieldToRequests();
