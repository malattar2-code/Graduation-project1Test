// routes/paymentRoutes.js
const express = require('express');
const bodyParser = require('body-parser');
const requireAuth = require('../../middelware/requireAuth'); // افترض هذا موجود
const paymentController = require('../../controller/site/paymentController');

const router = express.Router();

// 🟢 صفحة نجاح الدفع
router.get('/success', paymentController.paymentSuccess);

// 🟢 بيانات المستخدم الحالي
router.get('/me', requireAuth, paymentController.getMe);

// 🟢 إنشاء فاتورة
router.post('/create-invoice', requireAuth, paymentController.createInvoice);

// 🟢 إنشاء PaymentIntent
router.post('/create-payment-intent', requireAuth, paymentController.createPaymentIntent);
//خاص بالمحافظ الالكترونية 
// router.post('/process-wallet-payment', requireAuth, paymentController.processWalletPayment);
// router.post('/process-digital-wallet', requireAuth, paymentController.processDigitalWallet);

// 🟢 Webhook من Stripe (بدون requireAuth!)
// ملاحظة: Webhook مسجل أيضاً في app.js لضمان عمله بشكل صحيح
// يمكن استخدامه من هنا أو من app.js، لكن لا تستخدمه في مكانين في نفس الوقت
router.post(
  '/stripe-webhook',
  bodyParser.raw({ type: 'application/json' }),
  paymentController.handleWebhook
);
router.get("/check/:fundraiserId", paymentController.checkAccount);

// ✅ إنشاء حساب Stripe جديد
router.post("/create/:fundraiserId", paymentController.createAccount);

// ✅ تحويل الأموال عند اكتمال الحملة
router.post("/transfer/:fundraiserId", paymentController.transferFunds);
router.get('/login/:fundraiserId', paymentController.getLoginLink);
module.exports = router;