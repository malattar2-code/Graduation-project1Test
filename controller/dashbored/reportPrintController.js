// controller/reportPrintController.js
const fs = require("fs");
const path = require("path");
const Stimulsoft = require("stimulsoft-reports-js");

exports.printReportPDF = async (req, res) => {
    try {
        // ✅ تحديد المسارات المطلوب التحقق منها
        const reportPath = path.join(__dirname, "../../reports/Report.mrt");
        const jsonPath = path.join(__dirname, "../../services/firebase-structure.json");

        console.log("🔍 Checking file paths...");
        console.log("📄 Report Path:", reportPath);
        console.log("📊 JSON Path:", jsonPath);

        // ✅ تحقق من وجود ملف التقرير
        if (!fs.existsSync(reportPath)) {
            console.error("❌ ملف التقرير NajdaMonthlyReport.mrt غير موجود في المسار المحدد.");
            return res.status(404).json({
                message: "❌ ملف التقرير NajdaMonthlyReport.mrt غير موجود.",
                path: reportPath,
            });
        }

        // ✅ تحقق من وجود ملف البيانات
        if (!fs.existsSync(jsonPath)) {
            console.error("❌ ملف البيانات firebase-structure.json غير موجود.");
            return res.status(404).json({
                message: "❌ ملف البيانات firebase-structure.json غير موجود.",
                path: jsonPath,
            });
        }

        // ✅ تحميل التقرير
        const report = new Stimulsoft.Report.StiReport();
        report.loadFile(reportPath);

        // ✅ تحميل بيانات JSON
        const jsonData = fs.readFileSync(jsonPath, "utf8");
        const parsedData = JSON.parse(jsonData);

        // ✅ إنشاء DataSet بنفس اسم Data Source داخل التقرير
        const dataSet = new Stimulsoft.System.Data.DataSet("firebase-structure");
        dataSet.readJson(parsedData);

        // ✅ ربط البيانات مع التقرير
        report.regData("firebase-structure", "", dataSet);

        // ✅ توليد وتصدير التقرير إلى PDF
        report.renderAsync(() => {
            const pdfSettings = new Stimulsoft.Report.Export.StiPdfExportSettings();
            const pdfService = new Stimulsoft.Report.Export.StiPdfExportService();
            const stream = new Stimulsoft.System.IO.MemoryStream();

            pdfService.exportTo(report, stream, pdfSettings);

            const buffer = stream.toArray();
            const pdfData = Buffer.from(buffer, "base64");

            // ✅ إرسال التقرير كـ PDF للمتصفح
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", 'inline; filename="NajdaReport.pdf"');
            res.end(pdfData);
        });

    } catch (error) {
        console.error("❌ خطأ أثناء إنشاء التقرير:", error);
        res.status(500).json({
            message: "حدث خطأ أثناء إنشاء التقرير",
            error: error.message,
            stack: error.stack,
        });
    }
};
