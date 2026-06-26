const EmergencyReliefBanner = require('../../models/EmergencyReliefBanner');
const path = require('path');
const fs = require('fs');
const moment = require("moment");

// دالة تحويل الأرقام إلى نصوص (إنجليزي مبسط)
function numberToWords(num) {
  const ones = ["zero","one","two","three","four","five","six","seven","eight","nine"];
  const teens = ["ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
  const tens = ["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];

  if (num < 10) return ones[num];
  if (num < 20) return teens[num - 10];
  if (num < 100) {
    return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? "-" + ones[num % 10] : "");
  }
  return num.toString();
}

// ✅ عرض جميع السجلات
exports.getAll = async (req, res) => {
  try {
    let banners = await EmergencyReliefBanner.findAll();

    banners = banners.map(banner => ({
      ...banner.dataValues,
      idText: numberToWords(banner.id),
      date: moment(banner.date).format("dddd, MMMM Do YYYY, h:mm A")
    }));

    res.json({ banners });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ إنشاء سجل جديد
exports.create = async (req, res) => {
  try {
    const { title, region, description, keyword } = req.body;
    const image = req.file ? req.file.filename : null;

    const newBanner = await EmergencyReliefBanner.create({
      title,
      region,
      description,
      keyword,
      image,
    });

    res.json({ message: "تم إنشاء السجل بنجاح", banner: newBanner });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ تعديل سجل
exports.update = async (req, res) => {
  try {
    const banner = await EmergencyReliefBanner.findByPk(req.params.id);
    if (!banner) return res.status(404).json({ message: "السجل غير موجود" });

    // حذف الصورة القديمة إذا تم رفع صورة جديدة
    if (req.file && banner.image) {
      const oldPath = path.join(__dirname, '../uploads/emergency_relief_banner', banner.image);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

  await banner.update({
    title: req.body.title || banner.title,
    region: req.body.region || banner.region,
    description: req.body.description || banner.description,
    keyword: req.body.keyword !== undefined ? req.body.keyword : banner.keyword,
    image: req.file ? req.file.filename : banner.image
  });

    res.json({ message: "تم تحديث السجل بنجاح", banner });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ حذف سجل
exports.delete = async (req, res) => {
  try {
    const banner = await EmergencyReliefBanner.findByPk(req.params.id);
    if (!banner) return res.status(404).json({ message: "السجل غير موجود" });

    if (banner.image) {
      const filePath = path.join(__dirname, '../uploads/emergency_relief_banner', banner.image);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await banner.destroy();
    res.json({ message: "تم حذف السجل بنجاح" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ API إضافي (نفس getAll لكن للـ API محمي مثلاً)
exports.getAllApi = async (req, res) => {
  try {
    let banners = await EmergencyReliefBanner.findAll();

    banners = banners.map(banner => ({
      ...banner.dataValues,
      idText: numberToWords(banner.id),
      date: moment(banner.date).format("dddd, MMMM Do YYYY, h:mm A")
    }));

    res.json({ banners });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
