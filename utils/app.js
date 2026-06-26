// ================================
// تحميل المتغيرات البيئية والمكتبات
// ================================
require('dotenv').config();

const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const sequelize = require("../config/dbSQL");
const methodOverride = require("method-override");
const multer = require('multer');
const ejs = require('ejs');
const path = require('path');
// const {db} = require('../config/firebase-admin');
const nodemailer = require('nodemailer');
const session = require('express-session');
// const { syncFirebaseUsers } = require("./syncUser");
const cookieParser = require("cookie-parser");
const bodyParser = require('body-parser');
const passport = require('../config/passport');   // <-- Passport config

// ================================
// تهيئة التطبيق
// ================================
const app = express();

// ================================
// الملفات الثابتة
// ================================
app.use('/uploadsBanares', express.static(path.join(__dirname, '..', 'public/uploads/emergency_relief_banner')));
app.use("/uploads", express.static("public/uploads"));
app.use('/assets', express.static(path.join(__dirname, '..', 'public/assets')));
app.use('/favicon.ico', express.static(path.join(__dirname, '..', 'public/favicon.ico')));

// ================================
// إعدادات أمان التطبيق
// ================================
// app.use(helmet());

// ================================
// لوجات التطوير
// ================================
app.use(morgan("dev"));

// ================================
// تحليل بيانات الطلب (يجب أن يكون قبل الجلسة)
// ================================
// Stripe webhook (needs raw body) — must come BEFORE the JSON parser
// const paymentController = require('../controller/site/paymentController');
// app.post('/api/payments/stripe-webhook',
//   bodyParser.raw({ type: 'application/json' }),
//   paymentController.handleWebhook
// );
// Webhook route needs RAW body - must be BEFORE express.json()
const paymentController = require('../controller/dashbored/paymentController');
app.post('/api/payments/webhook', 
  express.raw({ type: 'application/json' }), 
  paymentController.webhook
);

// Regular body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// app.js (or equivalent)
const translateProxy = require('../routers/site/translate-proxy');
app.use('/api/translate', translateProxy);   // make sure body parsing (express.json()) is enabled
// ================================
// ✅ إعداد الجلسة (قبل أي مسار يحتاجها)
// ================================
// ✅ FIXED - Persistent PostgreSQL session store
const SequelizeStore = require('connect-session-sequelize')(session.Store);

const sessionStore = new SequelizeStore({
  db: sequelize,
  tableName: 'Sessions',
  checkExpirationInterval: 15 * 60 * 1000,
  expiration: 24 * 60 * 60 * 1000
});
sessionStore.sync();

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret',
  store: sessionStore,              // ← Persists across restarts
  resave: false,
  saveUninitialized: false,
  rolling: true,                    // ← Refreshes cookie on every response
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,   // ← 24 hours
    sameSite: 'lax'
  },
  name: 'sessionId'                 // ← Custom name (not default connect.sid)
}));
// ================================
// ✅ إعداد Passport.js (بعد الجلسة)
// ================================
app.use(passport.initialize());
app.use(passport.session());

// ================================
// 🔹 الآن يمكن تركيب المسارات التي تعتمد على الجلسة
// ================================
const userRegistrationRoutes = require('../routers/site/userRegistrationRoutes');
app.use('/user-auth', userRegistrationRoutes);

// المسارات العامة الأخرى
const userRankPointsOpenRoutes = require('../routers/dashboard/userRankPointsOpen');
app.use('/api', userRankPointsOpenRoutes);

// ================================
// دعم method override و CORS
// ================================
app.use(methodOverride("_method"));

const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:3000',   // عنوان الواجهة الأمامية
  credentials: true
}));

// ================================
// إعداد محرك العرض (EJS)
// ================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// ================================
// استدعاء الراوترات
// ================================
const router = require("../routers/index");
app.use("/", router);
// In your main app.js file
const savedFundraisersRoutes = require('../routers/site/savedFundraisersRoute');
app.use('/saved-fundraisers', savedFundraisersRoutes);
// ================================
// الاتصال بقاعدة البيانات
// ================================
require('../models/associations');  // 👈 activates all associations
//{ force: false }
const EmergencyReliefBanner = require('../models/EmergencyReliefBanner'); // استدعاء الموديل
const User = require('../models/User');
// const Financial_requests = require('../models/Financial_requests');
// sequelize.sync({ alter: true})
//   .then(() => console.log("DB connected"))
//   .catch(err => console.log(err));
/////////////////////////
// async function checkFirebaseConnection() {
//   try {
//     const collections = await db.listCollections();
//     const snapshot = await db.collection("users").limit(1).get();

// if (!snapshot.empty) {
//     const doc = snapshot.docs[0];
//     const fields = Object.keys(doc.data());
//     console.log("Fields in this document:", fields);
// } else {
//     console.log("Collection is empty");
// }
//     console.log('✅ Firebase connection is successful!');
//     console.log('Available collections:', collections.map(col => col.id));
//   } catch (error) {
//     console.error('❌ Firebase connection error:', error.message);
//   }
// }

// checkFirebaseConnection();
// //المزامنة استدعاء الدالةط

// syncFirebaseUsers()
//   .then(() => console.log("✅ المزامنة انتهت"))
//   .catch(err => console.error("❌ خطأ أثناء المزامنة:", err));
//================================
//الايميل
//================================

// // ✅ تهيئة الإيميل موجودات في ملف malalr.js
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: "your_email@gmail.com",
//     pass: "your_app_password",
//   },
// });

// // 🔹 إرسال إيميل
// async function sendEmail(to, subject, text) {
//   await transporter.sendMail({
//     from: '"My App" <your_email@gmail.com>',
//     to,
//     subject,
//     text,
//   });
// }
//================================
//انهاء الايميل
//================================
// ================================
// تصدير التطبيق
// ================================
// =======================================
// تحميل مكتبة المدن
// Add these lines to your main server.js or index.js file
// Import sync routes
// Add these lines to your main server.js or index.js file
// app.js or server.js
const invoicesRouter = require('../routers/site/invoicesRoute');
const syncInvoicesService = require('../services/syncInvoicesService');


// Routes
app.use('/api/invoices', invoicesRouter);

// Initialize real-time sync
// syncInvoicesService.setupRealTimeSync();
const donorsThanksRouter = require('../routers/site/donorsThanksRoute');

// Use the donors thanks routes
app.use('/api/donors', donorsThanksRouter);

const rankCountService = require('../services/RankCountService');
const rankCountScheduler = require('../services/RankCountScheduler');

// The service auto-initializes, but you can also start the scheduler
// rankCountScheduler.start();
// In your app.js or server.js
const syncCommentsRoutes = require('../routers/site/syncCommentsRoute');

// // In app.js - use a different prefix that's not protected
// app.use('/internal', syncCommentsRoutes); // This creates routes like /internal/comments/sync-all

const siteRoutes = require('../routers/site/categoriesRoute'); 
// Import sync routes
const syncRoutes = require('../routers/site/syncRoutes');

// Import sync scheduler (optional)
// const syncScheduler = require('../utils/syncScheduler');
const statisticsRoutes = require('../routers/dashboard/statisticsRoutes');
// Make sure this matches your intended path structure
app.use('/', statisticsRoutes);

// Also test if the routes are accessible
console.log('🔄 Registered Statistics Routes:');
console.log('   GET /api/statistics/users/monthly');
console.log('   GET /api/statistics/users/overview');
console.log('   GET /api/statistics/test');
// ... your existing imports and configuration ...

// Add sync routes to your Express app

// In your app.js file, modify the sync scheduling section:

// app.use('/api', syncRoutes);

// Schedule categories sync every 1 minute
// syncScheduler.scheduleCategorySync('*/50 * * * *');

// Schedule users sync every 15 seconds (quarter minute)
// syncScheduler.scheduleUserSync('*/50 * * * *');

// Or use the combined method:
// syncScheduler.scheduleAutoSync('*/1 * * * *', '*/15 * * * * *');

// Optional: Start real-time sync listeners
// syncScheduler.startRealtimeSync();

// On application shutdown
// process.on('SIGINT', () => {
//   syncScheduler.stopAllJobs();
//   syncScheduler.stopRealtimeSync();
//   process.exit(0);
// });

// Error handling for uncaught exceptions
// process.on('uncaughtException', (error) => {
//   console.error('Uncaught Exception:', error);
//   // Perform cleanup
//   syncScheduler.stopAllJobs();
//   syncScheduler.stopRealtimeSync();
//   process.exit(1);
// });

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Optional: send error to logging service
});
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test endpoint works!' });
});

app.get('/api/test-categories', async (req, res) => {
  try {
    const Category = require('./models/Category');
    const categories = await Category.findAll();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Or for simple setup:
app.use(cors());

const categoriesRoutes = require('../routers/site/categoriesRoute');
const testRoutes = require('../routers/site/testRoute'); // For testing

// Mount routes
app.use('/', categoriesRoutes);
app.use('/test', testRoutes); // Test if this works first
app.use('/uploads', express.static('public/uploads'));

// =======================================

const categoryRoutes = require('../routers/site/categoryRoute');
app.use('/', categoryRoutes);

// =======================================

const faqRoutes = require('../routers/site/faqRoute');
app.use('/', faqRoutes);

// In your main app file
const complaintRoutes = require('../routers/site/complaintRoute');

// Add this with your other routes
app.use('/', complaintRoutes);

// Your existing routes
const adminPanelRoutes = require('../routers/dashboard/adminPanalRoute');
app.use('/', adminPanelRoutes);

// In your main app.js or index.js

// =======================================
// Add after other route imports
const userPanelIndigentRoute = require("../routers/dashboard/userPanelIndigentRoute");
app.use("/", userPanelIndigentRoute);

// Serve static files from public directory

// app.js - Add this route
const allFundraisersRoute = require('../routers/site/allFundraisersRoute');
app.use('/', allFundraisersRoute);
// =======================================

// Add after other route imports
const indigentAccountRoute = require('../routers/site/indigentAccountRoute');
app.use('/', indigentAccountRoute);


// In your main app.js or index.js
const userPanelDonorRoutes = require('../routers/dashboard/userPanelDonorRoutes');

// Use the routes
app.use('/', userPanelDonorRoutes); // This will make the route accessible at /userPanelDonor

// In your main route file (index.js in routers folder)
const donorAccountRoutes = require('../routers/site/donorAccountRoute'); // Adjust path as needed

// Mount the routes
app.use('/', donorAccountRoutes); // or whatever base path you're using

const fundraiserRoutes = require('../routers/site/fundraiserRoute');
app.use('/', fundraiserRoutes);

const fundraiserFormRoute = require("../routers/dashboard/fundraiserFormRoute");
app.use("/", fundraiserFormRoute);

// Add this with your other route imports
const notificationRoutes = require("../routers/dashboard/notificationRoute");

// Add this with your other app.use() statements
app.use("/", notificationRoutes);
// const paymentRoutes = require('../routers/site/paymentRoute');
// app.use('/api/payments', paymentRoutes);
// Initialize synchronization
// Ensure JSON parsing is enabled
// Add this to catch any unhandled errors
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  
  // Ensure API routes return JSON, not HTML
  if (req.originalUrl.startsWith('/auth/')) {
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
  
  next(err);
});

const SyncFundraisers = require('../services/syncFundraisers');

// const syncFundraisers = new SyncFundraisers();

// Start bidirectional sync
// syncFundraisers.startBidirectionalSync();

// Force sync all existing records to update Firestore status
// syncFundraisers.forceSyncAllToFirebase().then(result => {
//     console.log('Force sync completed:', result);
// }).catch(console.error);

// Stop sync when needed (e.g., when shutting down the server)
// process.on('SIGINT', () => {
//     syncFundraisers.stopAllSync();
//     process.exit(0);
// });
// Add category API route
// =======================================
module.exports = app;

