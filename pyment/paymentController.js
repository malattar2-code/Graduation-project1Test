// controllers/paymentController.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { db, admin } = require('../../config/firebase-admin');
const Fundraiser = require('../../models/Fundraiser.js');
const TransferLog = require("../../models/TransferLog"); // إذا كنت تستخدمه
const User = require('../../models/User.js');
const fs = require('fs');
const path = require('path');

// 🟢 صفحة نجاح الدفع
exports.paymentSuccess = async (req, res) => {
  try {
    const { invoice, payment_intent, payment_intent_client_secret } = req.query;
    
    let invoiceData = null;
    
    // محاولة جلب بيانات الفاتورة إذا كان invoice موجود
    if (invoice) {
      try {
        const invoiceRef = db.collection('invoices').doc(invoice);
        const invoiceSnap = await invoiceRef.get();
        
        if (invoiceSnap.exists) {
          const data = invoiceSnap.data();
          invoiceData = {
            invoiceId: invoice,
            amount: data.amount || 0,
            formattedAmount: `$${parseFloat(data.amount || 0).toFixed(2)}`,
            fundraiserTitle: data.fundraiserTitle || 'حملة تبرع',
            paidAt: data.paidAt ? data.paidAt.toDate().toLocaleString('ar-SA') : new Date().toLocaleString('ar-SA'),
            paymentMethod: data.paymentMethod || 'card',
            status: data.status || 'pending'
          };
        }
      } catch (error) {
        console.error('Error fetching invoice data:', error);
      }
    }
    
    res.render('site/payment-success', {
      title: 'تم الدفع بنجاح - Payment Success',
      invoiceId: invoice,
      invoiceData: invoiceData,
      paymentIntent: payment_intent,
      paymentIntentClientSecret: payment_intent_client_secret,
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || ''
    });
  } catch (error) {
    console.error('Error rendering payment success page:', error);
    res.status(500).send('حدث خطأ أثناء تحميل الصفحة');
  }
};

// 🟢 بيانات المستخدم الحالي
exports.getMe = async (req, res) => {
  try {
    const uid = req.user.uid;
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    const userData = userDoc.data();
    res.json({
      uid: userData.uid,
      email: userData.email || null,
      name: userData.fullName || userData.firstName || 'No Name',
      photoURL: userData.userImage || null,
      phoneNumber: userData.phone || null,
      emailVerified: userData.isVerified || false,
      disabled: false,
    });
  } catch (err) {
    console.error('❌ Error fetching user:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 🟢 إنشاء فاتورة
// 🟢 إنشاء فاتورة
exports.createInvoice = async (req, res) => {
  try {
    const { fundraiserKey, amount, paymentMethod, paymentDetails, currency = 'usd' } = req.body;
    const uid = req.user?.uid;

    if (!uid) return res.status(401).json({ error: 'المستخدم غير مسجل دخول' });
    if (!amount || !fundraiserKey) return res.status(400).json({ error: 'البيانات غير مكتملة' });

    // 🔹 جلب بيانات المستخدم من Firebase
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) return res.status(404).json({ error: 'المستخدم غير موجود' });
    const userData = userDoc.data();

    // 🔹 جلب بيانات الحملة من PostgreSQL
    const fundraiserInstance = await Fundraiser.findOne({ where: { fundraiser_id: fundraiserKey } });
    if (!fundraiserInstance) return res.status(404).json({ error: 'الحملة غير موجودة' });
    const fundraiser = fundraiserInstance.get({ plain: true });

    // 🔹 إنشاء الفاتورة في Firestore
    const invoiceRef = db.collection('invoices').doc();
    const invoiceData = {
      invoiceId: invoiceRef.id,
      donorId: uid,
      donorName: userData.fullName || userData.firstName || 'متبرع مجهول',
      donorEmail: userData.email || null,
      amount,
      currency,
      fundraiserId: fundraiser.fundraiser_id,
      fundraiserTitle: fundraiser.fundraiser_title || '',
      paymentMethod: paymentMethod || 'card',
      paymentDetails: paymentDetails || {},
      status: 'pending',
      createdAt: admin.firestore.Timestamp.now(),
    };
    await invoiceRef.set(invoiceData);

    // 🔹 إنشاء Stripe Invoice
    try {
      // 1️⃣ إنشاء أو استرجاع العميل في Stripe
      let stripeCustomer;
      if (userData.email) {
        const existingCustomers = await stripe.customers.list({ email: userData.email, limit: 1 });
        if (existingCustomers.data.length > 0) {
          stripeCustomer = existingCustomers.data[0];
        } else {
          stripeCustomer = await stripe.customers.create({
            email: userData.email,
            name: userData.fullName || userData.firstName || 'متبرع مجهول',
            metadata: { firebase_uid: uid }
          });
        }
      } else {
        return res.status(400).json({ error: 'البريد الإلكتروني للمستخدم مطلوب لإنشاء فاتورة Stripe' });
      }

      // 2️⃣ إنشاء عنصر الفاتورة (Invoice Item)
      const invoiceItem = await stripe.invoiceItems.create({
        customer: stripeCustomer.id,
        amount: Math.round(amount * 100), // تحويل الدولار إلى سنت
        currency,
        description: `تبرع لحملة: ${fundraiser.fundraiser_title}`,
        metadata: {
          fundraiser_id: fundraiser.fundraiser_id,
          fundraiser_name: fundraiser.fundraiser_title,
          fundraiser_owner_email: fundraiser.owner_email || 'N/A',
          donor_name: userData.fullName || userData.firstName || 'متبرع مجهول',
          donor_email: userData.email,
          donation_amount_usd: amount.toFixed(2),
        },
      });

      // 3️⃣ إنشاء الفاتورة في Stripe
      const stripeInvoice = await stripe.invoices.create({
        customer: stripeCustomer.id,
        collection_method: 'send_invoice',
        auto_advance: true, // دفع تلقائي
        metadata: {
          invoice_id: invoiceRef.id,
          fundraiser_id: fundraiser.fundraiser_id,
          donor_email: userData.email,
        }
      });

      // 4️⃣ تأكيد ودفع الفاتورة
      const finalizedInvoice = await stripe.invoices.finalizeInvoice(stripeInvoice.id);

      // 5️⃣ تحديث Firestore بالفاتورة
      await invoiceRef.update({
        stripeInvoiceId: finalizedInvoice.id,
        stripeInvoiceUrl: finalizedInvoice.hosted_invoice_url,
        stripePdfUrl: finalizedInvoice.invoice_pdf,
      });

      console.log(`✅ Stripe Invoice Created: ${finalizedInvoice.id}`);

    } catch (stripeErr) {
      console.error("❌ Stripe Invoice Error:", stripeErr);
    }

    // 🔹 الرد على العميل
    res.json({
      success: true,
      invoiceId: invoiceRef.id,
      stripeInvoiceUrl: invoiceRef.stripeInvoiceUrl || null
    });

  } catch (error) {
    console.error('❌ Create Invoice Error:', error);
    res.status(500).json({ error: 'فشل في إنشاء الفاتورة' });
  }
};



// 🟢 إنشاء PaymentIntent
// 🟢 إنشاء PaymentIntent متكامل مع Google Pay و AliPay و Card
exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = 'usd', fundraiserId, invoiceId, paymentMethod } = req.body;
    const uid = req.user?.uid;

    // التحقق من المبلغ
    if (!amount || amount < 100) {
      return res.status(400).json({ error: 'المبلغ غير صالح (الحد الأدنى $1)' });
    }

    // جلب بيانات الحملة
    const fundraiserData = await Fundraiser.findOne({ where: { fundraiser_id: fundraiserId } });
    if (!fundraiserData) return res.status(404).json({ error: 'الحملة غير موجودة' });

    const currentCollected = parseFloat(fundraiserData.fundraiser_collected_amount || 0);
    const newAmount = parseFloat(amount / 100);
    const targetAmount = parseFloat(fundraiserData.fundraiser_target_amount);

    if (currentCollected + newAmount > targetAmount) {
      return res.status(400).json({ error: 'المبلغ المتبرع به يتجاوز الهدف المطلوب' });
    }

    // تحديد طرق الدفع المدعومة
    let supportedMethods = ['card'];
    switch (paymentMethod) {
      case 'google_pay':
        supportedMethods = ['card'];
        break;
      case 'alipay':
        supportedMethods = ['alipay'];
        break;
      default:
        supportedMethods = ['card'];
    }

    // إنشاء PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: supportedMethods,
      description: `Donation to ${fundraiserData.fundraiser_title} by ${uid}`,
      metadata: {
        userId: uid,
        fundraiser_id: fundraiserId,
        invoice_id: invoiceId,
        paymentMethod: paymentMethod || 'card',
      },
    });

    // ✅ AliPay تحتاج redirect
    if (paymentMethod === 'alipay') {
      const paymentMethodData = await stripe.paymentMethods.create({ type: 'alipay' });
      const confirm = await stripe.paymentIntents.confirm(paymentIntent.id, {
        payment_method: paymentMethodData.id,
        return_url: `${process.env.DOMAIN || 'http://localhost:3000'}/api/payments/success?invoice=${invoiceId}`,
      });

      return res.json({
        success: true,
        redirectUrl: confirm.next_action?.alipay_handle_redirect?.url || null,
      });
    }

    // ✅ Card أو Google Pay ترجع clientSecret
    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      paymentMethod,
    });

  } catch (error) {
    console.error('❌ خطأ في إنشاء PaymentIntent:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 🟢 Webhook


exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('❌ Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const { invoice_id, fundraiser_id, userId } = paymentIntent.metadata;
        const amount = paymentIntent.amount / 100;

        // ✅ التحقق من وجود البيانات المطلوبة
        if (!invoice_id || !fundraiser_id || !userId) {
          console.error('❌ Missing required metadata in payment_intent.succeeded:', {
            invoice_id,
            fundraiser_id,
            userId
          });
          return res.status(400).json({ error: 'Missing required metadata' });
        }

        // جلب بيانات الفاتورة من Firestore
        const invoiceRef = db.collection('invoices').doc(invoice_id);
        const invoiceSnap = await invoiceRef.get();
        if (!invoiceSnap.exists) {
          console.error('❌ Invoice not found in Firestore:', invoice_id);
          return res.status(404).json({ error: 'Invoice not found' });
        }
        const invoiceData = invoiceSnap.data();

        // ✅ التحقق من حالة الفاتورة لتجنب المعالجة المكررة
        if (invoiceData.status === 'paid') {
          console.log('ℹ️ Invoice already paid, skipping duplicate processing:', invoice_id);
          return res.status(200).json({ received: true, message: 'Already processed' });
        }

        // إنشاء حساب مؤقت للمتبرع في Stripe (Customer) إذا لم يكن موجود
        let customer;
        if (invoiceData.donorEmail) {
          try {
            const customers = await stripe.customers.list({ email: invoiceData.donorEmail, limit: 1 });
            customer = customers.data[0];
            if (!customer) {
              customer = await stripe.customers.create({
                email: invoiceData.donorEmail,
                name: invoiceData.donorName || 'Donor',
                metadata: { firebase_uid: userId }
              });
            }
          } catch (customerError) {
            console.error('❌ Error creating/retrieving customer:', customerError);
            // نتابع العملية بدون customer إذا فشل الإنشاء
          }
        }

        // ✅ إنشاء Invoice في Stripe فقط إذا لم تكن موجودة
        let stripeInvoice;
        if (invoiceData.stripeInvoiceId) {
          try {
            // محاولة جلب الفاتورة الموجودة
            stripeInvoice = await stripe.invoices.retrieve(invoiceData.stripeInvoiceId);
            console.log('ℹ️ Using existing Stripe invoice:', invoiceData.stripeInvoiceId);
          } catch (retrieveError) {
            console.log('ℹ️ Existing invoice not found, creating new one');
            stripeInvoice = null;
          }
        }

        if (!stripeInvoice) {
          // إنشاء Invoice Item في Stripe فقط إذا لم يكن موجود
          if (customer) {
            try {
              await stripe.invoiceItems.create({
                customer: customer.id,
                amount: Math.round(amount * 100), // سنت
                currency: invoiceData.currency || 'usd',
                description: `Donation to ${invoiceData.fundraiserTitle}`,
                metadata: {
                  fundraiser_id,
                  invoice_id,
                  donor_name: invoiceData.donorName,
                  donor_email: invoiceData.donorEmail,
                  fundraiser_email: invoiceData.fundraiserOwnerEmail || null,
                },
              });

              // إنشاء Invoice في Stripe
              stripeInvoice = await stripe.invoices.create({
                customer: customer.id,
                auto_advance: true, // يدفع تلقائيًا عند الإنشاء
                metadata: {
                  fundraiser_id,
                  invoice_id,
                },
              });

              // دفع الفاتورة مباشرة إذا لم يتم دفعها
              try {
                await stripe.invoices.pay(stripeInvoice.id);
              } catch (payError) {
                console.error('⚠️ Error paying invoice (may already be paid):', payError.message);
              }
            } catch (stripeError) {
              console.error('❌ Error creating Stripe invoice:', stripeError);
              // نتابع العملية حتى لو فشل إنشاء Stripe invoice
            }
          }
        }

        // 3️⃣ تحديث الفاتورة في Firestore
        const updateData = {
          status: 'paid',
          paidAt: admin.firestore.Timestamp.now(),
          stripePaymentId: paymentIntent.id,
        };
        if (stripeInvoice) {
          updateData.stripeInvoiceId = stripeInvoice.id;
        }
        await invoiceRef.update(updateData);

        // 4️⃣ تحديث رصيد الحملة في PostgreSQL
        await Fundraiser.increment('fundraiser_collected_amount', {
          by: amount,
          where: { fundraiser_id },
        });

        // التحقق إذا الحملة مكتملة
        const updatedFundraiser = await Fundraiser.findOne({ where: { fundraiser_id } });
        if (updatedFundraiser && updatedFundraiser.fundraiser_collected_amount >= updatedFundraiser.fundraiser_target_amount) {
          await Fundraiser.update(
            { fundraiser_status: 'completed' },
            { where: { fundraiser_id } }
          );
        }

        // 5️⃣ تسجيل التبرع في Firestore
        await db.collection('donations').add({
          userId,
          fundraiserId: fundraiser_id,
          invoiceId: invoice_id,
          amount,
          status: 'completed',
          createdAt: admin.firestore.Timestamp.now(),
        });

        console.log('✅ Payment processed successfully:', {
          invoice_id,
          fundraiser_id,
          amount,
          stripeInvoiceId: stripeInvoice?.id || 'N/A'
        });
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const { invoice_id, fundraiser_id, userId } = paymentIntent.metadata || {};
        
        if (!invoice_id) {
          console.error('❌ Missing invoice_id in payment_failed event');
          break;
        }

        // تحديث حالة الفاتورة إلى فاشل
        const invoiceRef = db.collection('invoices').doc(invoice_id);
        const invoiceSnap = await invoiceRef.get();
        
        if (invoiceSnap.exists) {
          await invoiceRef.update({
            status: 'failed',
            failedAt: admin.firestore.Timestamp.now(),
            failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
            stripePaymentId: paymentIntent.id,
          });
          console.log('❌ Payment failed, invoice updated:', invoice_id);
        }
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object;
        const { invoice_id } = paymentIntent.metadata || {};
        
        if (!invoice_id) {
          console.error('❌ Missing invoice_id in payment_intent.canceled event');
          break;
        }

        // تحديث حالة الفاتورة إلى ملغى
        const invoiceRef = db.collection('invoices').doc(invoice_id);
        const invoiceSnap = await invoiceRef.get();
        
        if (invoiceSnap.exists) {
          await invoiceRef.update({
            status: 'canceled',
            canceledAt: admin.firestore.Timestamp.now(),
            stripePaymentId: paymentIntent.id,
          });
          console.log('ℹ️ Payment canceled, invoice updated:', invoice_id);
        }
        break;
      }

      case 'payment_intent.requires_action': {
        const paymentIntent = event.data.object;
        const { invoice_id } = paymentIntent.metadata || {};
        
        if (!invoice_id) {
          console.error('❌ Missing invoice_id in payment_intent.requires_action event');
          break;
        }

        // تحديث حالة الفاتورة إلى يتطلب إجراء
        const invoiceRef = db.collection('invoices').doc(invoice_id);
        const invoiceSnap = await invoiceRef.get();
        
        if (invoiceSnap.exists) {
          await invoiceRef.update({
            status: 'requires_action',
            requiresActionAt: admin.firestore.Timestamp.now(),
            stripePaymentId: paymentIntent.id,
          });
          console.log('ℹ️ Payment requires action, invoice updated:', invoice_id);
        }
        break;
      }

      case 'payout.paid': {
        const payout = event.data.object;
        const { amount, metadata } = payout;
        const fundraiserId = metadata.fundraiser_id;
        const userId = metadata.user_id;

        if (!fundraiserId || !userId) {
          console.error('❌ Missing metadata in payout:', payout.id);
          return res.status(400).send('Missing fundraiser_id or user_id in metadata');
        }

        const fundraiser = await Fundraiser.findOne({ where: { fundraiser_id: fundraiserId } });
        if (!fundraiser) {
          console.error('❌ Fundraiser not found for payout:', payout.id);
          return res.status(404).send('Fundraiser not found');
        }

        await Fundraiser.update(
          { fundraiser_status: 'transferred' },
          { where: { fundraiser_id: fundraiserId } }
        );

        await TransferLog.create({
          stripeTransferId: payout.id, // ✅ إصلاح: استخدام الحقل الصحيح
          fundraiserId: fundraiserId,
          userId: userId,
          amount: amount / 100,
          fee: 0, // يمكن حسابها إذا كانت متوفرة في metadata
          status: 'completed',
        });

        console.log(`✅ Payout ${payout.id} processed for fundraiser ${fundraiserId}`);

        // ✅ حذف الحملة بعد نجاح إنشاء TransferLog
        try {
          // إعادة جلب الحملة بعد التحديث
          const fundraiserToDelete = await Fundraiser.findOne({
            where: { fundraiser_id: fundraiserId }
          });
          
          if (fundraiserToDelete) {
            await deleteFundraiserAfterTransfer(fundraiserToDelete);
            console.log(`✅ Fundraiser ${fundraiserId} deleted after successful payout`);
          }
        } catch (deleteError) {
          console.error('⚠️ Error deleting fundraiser after payout:', deleteError);
          // لا نوقف العملية إذا فشل الحذف - التحويل نجح بالفعل
        }
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('❌ Error processing webhook:', err);
    res.status(500).send('Error processing webhook');
  }
};

//عمليات خاصة بطالب المساعدة
// ✅ التحقق من وجود حساب Stripe للمستفيد
/**
 * ✅ التحقق مما إذا كان المستخدم لديه حساب Stripe مرتبط بالحملة
 */

// مساعدة: إنشاء رابط onboarding لحساب Stripe
async function createAccountLinkURL(stripeAccountId, fundraiserId, userId) {
  const BASE_URL =
    process.env.NODE_ENV === 'production'
      ? process.env.DOMAIN
      : 'http://localhost:3000';

  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: `${BASE_URL}/beneficiary.html?uid=${userId}&fundraiser=${fundraiserId}`,
    return_url: `${BASE_URL}/beneficiary.html?uid=${userId}&fundraiser=${fundraiserId}&success=true`,
    type: 'account_onboarding',
  });

  return accountLink.url;
}

// مساعدة: حذف الحملة بشكل كامل بعد نجاح التحويل
async function deleteFundraiserAfterTransfer(fundraiser) {
  try {
    console.log('🗑️ Starting fundraiser deletion after successful transfer...');
    
    // حفظ Firebase ID قبل الحذف
    const firebaseId = fundraiser.firebase_id;
    
    // حذف الصور من نظام الملفات
    const imagePaths = [
      fundraiser.fundraiser_main_image,
      fundraiser.fundraiser_sub_image_one,
      fundraiser.fundraiser_sub_image_two,
      fundraiser.fundraiser_sub_image_three
    ].filter(Boolean);

    const deleteImagePromises = imagePaths.map(async (imagePath) => {
      try {
        if (imagePath && imagePath.startsWith('/uploads/')) {
          const fullPath = path.join(__dirname, '../../public', imagePath);
          if (fs.existsSync(fullPath)) {
            await fs.promises.unlink(fullPath);
            console.log('🗑️ Deleted image:', imagePath);
          }
        }
      } catch (imageError) {
        console.error('⚠️ Error deleting image:', imagePath, imageError);
        // لا نوقف العملية إذا فشل حذف صورة
      }
    });

    await Promise.allSettled(deleteImagePromises);

    // حذف من Firebase إن كان موجوداً
    if (firebaseId) {
      try {
        await db.collection('fundraisers').doc(firebaseId).delete();
        console.log('🗑️ Deleted from Firebase:', firebaseId);
      } catch (firebaseError) {
        console.error('⚠️ Error deleting from Firebase:', firebaseError);
        // لا نوقف العملية إذا فشل حذف Firebase
      }
    }

    // حذف الحملة من PostgreSQL
    await fundraiser.destroy();
    console.log('✅ Fundraiser deleted successfully after transfer');
    
  } catch (error) {
    console.error('❌ Error deleting fundraiser after transfer:', error);
    throw error; // نرمي الخطأ ليتم التعامل معه في الدالة الرئيسية
  }
}

// --- التحقق من حساب Stripe ---
exports.checkAccount = async (req, res) => {
  const { fundraiserId } = req.params;

  try {
    // ✅ إصلاح: استخدام findOne مع fundraiser_id مثل باقي الدوال
    const fundraiser = await Fundraiser.findOne({
      where: { fundraiser_id: fundraiserId },
      include: [{ model: User, as: 'user' }],
    });

    if (!fundraiser) {
      return res.status(404).json({ ok: false, error: 'Fundraiser not found' });
    }

    // ✅ إصلاح: التحقق من stripeAccountId في كل من Fundraiser و User
    let stripeAccountId = fundraiser.stripeAccountId;
    
    // إذا لم يكن موجود في Fundraiser، ابحث في User
    if (!stripeAccountId || stripeAccountId === '') {
      const user = fundraiser.user;
      if (user && user.stripeAccountId && user.stripeAccountId !== '') {
        stripeAccountId = user.stripeAccountId;
        // ✅ تحديث Fundraiser بنسخ stripeAccountId من User إذا كان موجوداً
        try {
          fundraiser.stripeAccountId = stripeAccountId;
          await fundraiser.save();
        } catch (updateErr) {
          console.warn('Failed to update fundraiser.stripeAccountId from user:', updateErr.message);
        }
      }
    }

    if (!stripeAccountId || stripeAccountId === '') {
      return res.json({ ok: true, hasAccount: false });
    }

    // جلب حالة الحساب من Stripe
    const account = await stripe.accounts.retrieve(stripeAccountId);

    // نُعدّ كائن مفصل بالحالة ليُرسل للواجهة
    const details = {
      id: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      requirements: account.requirements || {},
      accountStatus: account.charges_enabled && account.payouts_enabled ? 'active' : 'pending',
    };
    let loginLink = null;
    if (details.accountStatus === 'active') {
      const link = await stripe.accounts.createLoginLink(account.id);
      loginLink = link.url;
    }


    // إذا الحساب غير مكتمل، نُنشئ رابط onboarding (اختياري)
    let onboardingUrl = null;
    if (!account.charges_enabled || !account.payouts_enabled) {
      onboardingUrl = await createAccountLinkURL(account.id, fundraiserId, fundraiser.user?.id || '');
    }

    return res.json({
      ok: true,
      hasAccount: true,
      details,
      onboardingUrl,
      loginLink, // 👈 تمت إضافتها هنا
  
    });
  } catch (err) {
    console.error('Stripe check error:', err);
    return res.status(500).json({ ok: false, error: 'Error checking Stripe account' });
  }
};

// --- إنشاء حساب Stripe Connect ---
exports.createAccount = async (req, res) => {
  const { fundraiserId } = req.params;

  try {
    // ✅ إصلاح: استخدام findOne مع fundraiser_id
    const fundraiser = await Fundraiser.findOne({
      where: { fundraiser_id: fundraiserId },
      include: [{ model: User, as: 'user' }],
    });

    if (!fundraiser) {
      return res.status(404).json({ ok: false, error: 'Fundraiser not found' });
    }

    const user = fundraiser.user;
    if (!user) {
      return res.status(400).json({ ok: false, error: 'No user associated with this fundraiser' });
    }
    if (!user.email) {
      return res.status(400).json({ ok: false, error: 'User email is required' });
    }

    // ✅ إصلاح: التحقق من stripeAccountId في كل من Fundraiser و User
    let existingAccountId = fundraiser.stripeAccountId;
    if (!existingAccountId || existingAccountId === '') {
      existingAccountId = user.stripeAccountId;
    }

    // إذا كان هناك stripeAccountId محفوظ بالفعل، حاول استرجاعه أولًا
    if (existingAccountId && existingAccountId !== '') {
      try {
        const existing = await stripe.accounts.retrieve(existingAccountId);
        // أعد رابط Onboarding لو الحساب غير مكتمل
        if (!existing.charges_enabled || !existing.payouts_enabled) {
          const onboardUrl = await createAccountLinkURL(existing.id, fundraiserId, user.id);
          // ✅ تحديث Fundraiser و User إذا لم يكن موجوداً
          if (!fundraiser.stripeAccountId || fundraiser.stripeAccountId === '') {
            fundraiser.stripeAccountId = existing.id;
            await fundraiser.save();
          }
          if (!user.stripeAccountId || user.stripeAccountId === '') {
            user.stripeAccountId = existing.id;
            await user.save();
          }
          return res.json({
            ok: true,
            hasAccount: true,
            accountStatus: existing.charges_enabled && existing.payouts_enabled ? 'active' : 'pending',
            onboardUrl,
            message: 'Stripe account exists but may require onboarding to complete',
          });
        }

        // ✅ تحديث Fundraiser و User إذا لم يكن موجوداً
        if (!fundraiser.stripeAccountId || fundraiser.stripeAccountId === '') {
          fundraiser.stripeAccountId = existing.id;
          await fundraiser.save();
        }
        if (!user.stripeAccountId || user.stripeAccountId === '') {
          user.stripeAccountId = existing.id;
          await user.save();
        }

        return res.json({
          ok: true,
          hasAccount: true,
          accountStatus: 'active',
          message: 'Stripe account already exists and is active',
        });
      } catch (err) {
        // إذا استرجاع الحساب فشل (مثلاً تم حذفه على Stripe)، نمضي لإنشاء واحد جديد
        console.warn('Existing Stripe account retrieval failed, creating new one:', err.message);
        fundraiser.stripeAccountId = null;
        if (user.stripeAccountId === existingAccountId) {
          user.stripeAccountId = null;
          await user.save();
        }
        await fundraiser.save();
      }
    }

    // إنشاء حساب جديد في Stripe (Express)
    const account = await stripe.accounts.create({
      type: 'express',
      country: user.country || 'US',
      email: user.email,
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
      business_type: 'individual',
      metadata: {
        fundraiser_id: fundraiserId,
        user_id: user.id,
      },
    });

    // خزّن stripeAccountId في كل من user و fundraiser إن أمكن
    try {
      user.stripeAccountId = account.id;
      await user.save();
    } catch (uErr) {
      console.warn('Failed to save stripeAccountId on user model:', uErr.message);
    }

    try {
      fundraiser.stripeAccountId = account.id;
      await fundraiser.save();
    } catch (fErr) {
      console.warn('Failed to save stripeAccountId on fundraiser model:', fErr.message);
    }

    // إنشاء رابط onboarding وإرجاعه
    const onboardUrl = await createAccountLinkURL(account.id, fundraiserId, user.id);

    return res.json({
      ok: true,
      onboardUrl,
      accountId: account.id,
      message: 'Stripe account created successfully',
    });
  } catch (err) {
    console.error('Stripe create account error:', err);
    return res.status(500).json({
      ok: false,
      error: err.raw?.message || err.message || 'Unexpected error while creating Stripe account',
    });
  }
};

// --- تحويل الأموال مع إعادة إنشاء رابط Onboarding تلقائي ---
// نستخدم transaction على مستوى Sequelize (إذا مدعوم) لضمان الاتساق
exports.transferFunds = async (req, res) => {
  const { fundraiserId } = req.params;

  try {
    // ✅ إصلاح: استخدام findOne مع fundraiser_id
    const fundraiser = await Fundraiser.findOne({
      where: { fundraiser_id: fundraiserId },
      include: [{ model: User, as: 'user' }],
    });

    if (!fundraiser) {
      return res.status(404).json({ ok: false, error: 'Fundraiser not found' });
    }

    // ✅ التحقق من أن التحويل لم يتم من قبل
    if (fundraiser.fundraiser_status === 'transferred') {
      return res.status(400).json({ 
        ok: false, 
        error: 'تم تحويل الأموال لهذه الحملة مسبقاً. لا يمكن التحويل مرة أخرى.' 
      });
    }

    // ✅ إصلاح: التحقق من stripeAccountId في كل من Fundraiser و User
    let stripeAccountId = fundraiser.stripeAccountId;
    if (!stripeAccountId || stripeAccountId === '') {
      const user = fundraiser.user;
      if (user && user.stripeAccountId && user.stripeAccountId !== '') {
        stripeAccountId = user.stripeAccountId;
        // تحديث Fundraiser
        fundraiser.stripeAccountId = stripeAccountId;
        await fundraiser.save();
      }
    }

    if (!stripeAccountId || stripeAccountId === '') {
      return res.status(400).json({ ok: false, error: 'Stripe account not connected' });
    }

    // جلب حساب Stripe والتحقق من المتطلبات الحالية
    let account;
    try {
      account = await stripe.accounts.retrieve(stripeAccountId);
    } catch (err) {
      console.error('Failed to retrieve Stripe account:', err);
      // إذا الحساب غير موجود على Stripe، قم بتنظيف الحقل محليًا واطلب إنشاء حساب جديد
      fundraiser.stripeAccountId = null;
      const user = fundraiser.user;
      if (user && user.stripeAccountId === stripeAccountId) {
        user.stripeAccountId = null;
        await user.save();
      }
      await fundraiser.save();
      return res.status(400).json({
        ok: false,
        error: 'Stripe account not found. Please recreate your Stripe account.',
      });
    }

    // إذا الحساب غير مكتمل، أنشئ رابط onboarding وأرسله
    if (!account.charges_enabled || !account.payouts_enabled) {
      const onboardingUrl = await createAccountLinkURL(stripeAccountId, fundraiserId, fundraiser.user?.id || '');
      return res.status(400).json({
        ok: false,
        error: 'Stripe account is not fully set up. Complete onboarding first.',
        onboardingUrl,
        requirements: account.requirements || {},
      });
    }

    // ✅ حساب المبلغ للتحويل (فقط للحملة المحددة)
    const collected = parseFloat(fundraiser.fundraiser_collected_amount || 0);
    if (!collected || collected <= 0) {
      return res.status(400).json({ 
        ok: false, 
        error: 'لا يوجد أموال متاحة للتحويل في هذه الحملة. المبلغ: $0.00' 
      });
    }

    const amountCents = Math.floor(collected * 100);
    if (amountCents < 50) {
      return res.status(400).json({ ok: false, error: 'Minimum transfer amount is $0.50' });
    }

    const platformFeePercent = Number(process.env.PLATFORM_FEE_PERCENT || 5);
    const feeCents = Math.round((amountCents * platformFeePercent) / 100);
    const amountAfterFeeCents = amountCents - feeCents;

    // إنشاء التحويل عبر Stripe
    const transfer = await stripe.transfers.create({
      amount: amountAfterFeeCents,
      currency: 'usd',
      destination: stripeAccountId,
      description: `Funds for fundraiser: ${fundraiser.fundraiser_title}`,
      metadata: {
        fundraiser_id: fundraiserId,
        user_id: fundraiser.user?.id || null,
        platform_fee_cents: feeCents,
      },
    });

    // تحديث قاعدة البيانات داخل transaction (إن كان مدعومًا)
    const sequelize = Fundraiser.sequelize;
    let transferLogCreated = false;
    
    if (sequelize && typeof sequelize.transaction === 'function') {
      await sequelize.transaction(async (t) => {
        // نعيد جلب الـ fundraiser مع القفل إن أردت، هنا سنستخدم instance المعدل
        fundraiser.fundraiser_collected_amount = parseFloat(0);
        fundraiser.fundraiser_status = 'transferred';
        fundraiser.last_transfer_date = new Date();
        // ✅ إصلاح: تحويل total_transferred إلى رقم قبل الجمع لتجنب concatenation
        const currentTotal = parseFloat(fundraiser.total_transferred || 0) || 0;
        const transferAmount = parseFloat((amountAfterFeeCents / 100).toFixed(2));
        fundraiser.total_transferred = parseFloat((currentTotal + transferAmount).toFixed(2));
        await fundraiser.save({ transaction: t });

        await TransferLog.create({
          fundraiserId,
          userId: fundraiser.user?.id || null,
          stripeTransferId: transfer.id,
          amount: amountAfterFeeCents / 100,
          fee: feeCents / 100,
          status: 'completed',
        }, { transaction: t });
        transferLogCreated = true;
      });
    } else {
      // إذا لم يكن هناك دعم للـ transaction، قم بالعمليات بالتتابع
      fundraiser.fundraiser_collected_amount = parseFloat(0);
      fundraiser.fundraiser_status = 'transferred';
      fundraiser.last_transfer_date = new Date();
      // ✅ إصلاح: تحويل total_transferred إلى رقم قبل الجمع لتجنب concatenation
      const currentTotal = parseFloat(fundraiser.total_transferred || 0) || 0;
      const transferAmount = parseFloat((amountAfterFeeCents / 100).toFixed(2));
      fundraiser.total_transferred = parseFloat((currentTotal + transferAmount).toFixed(2));
      await fundraiser.save();

      await TransferLog.create({
        fundraiserId,
        userId: fundraiser.user?.id || null,
        stripeTransferId: transfer.id,
        amount: amountAfterFeeCents / 100,
        fee: feeCents / 100,
        status: 'completed',
      });
      transferLogCreated = true;
    }

    // ✅ حذف الحملة بعد نجاح إنشاء TransferLog
    if (transferLogCreated) {
      try {
        // إعادة جلب الحملة مع أحدث البيانات (بعد الحفظ) قبل الحذف
        await fundraiser.reload();
        await deleteFundraiserAfterTransfer(fundraiser);
        console.log('✅ Fundraiser deleted after successful transfer');
      } catch (deleteError) {
        console.error('⚠️ Error deleting fundraiser after transfer:', deleteError);
        // لا نوقف العملية إذا فشل الحذف - التحويل نجح بالفعل
      }
    }

    return res.json({
      ok: true,
      transferId: transfer.id,
      amountTransferred: amountAfterFeeCents / 100,
      fee: feeCents / 100,
      message: 'Funds transferred successfully',
    });
  } catch (err) {
    console.error('Stripe transfer error:', err);
    // إذا كانت أخطاء Stripe معروفة، أرسل رسالة واضحة
    if (err && err.raw && err.raw.message) {
      return res.status(500).json({ ok: false, error: err.raw.message });
    }
    return res.status(500).json({ ok: false, error: err.message || 'Error transferring funds' });
  }
};
// --- إنشاء رابط تسجيل الدخول إلى لوحة Stripe Express ---
exports.getLoginLink = async (req, res) => {
  try {
    const { fundraiserId } = req.params;

    // ✅ إصلاح: استخدام findOne مع fundraiser_id
    const fundraiser = await Fundraiser.findOne({
      where: { fundraiser_id: fundraiserId },
      include: [{ model: User, as: 'user' }],
    });

    if (!fundraiser) {
      return res.status(404).json({ ok: false, error: 'Fundraiser not found' });
    }

    // ✅ إصلاح: التحقق من stripeAccountId في كل من Fundraiser و User
    let stripeAccountId = fundraiser.stripeAccountId;
    if (!stripeAccountId || stripeAccountId === '') {
      const user = fundraiser.user;
      if (user && user.stripeAccountId && user.stripeAccountId !== '') {
        stripeAccountId = user.stripeAccountId;
        // تحديث Fundraiser
        fundraiser.stripeAccountId = stripeAccountId;
        await fundraiser.save();
      }
    }

    if (!stripeAccountId || stripeAccountId === '') {
      return res.status(400).json({ ok: false, error: 'Stripe account not connected' });
    }

    // إنشاء رابط تسجيل الدخول إلى لوحة Express
    const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);

    return res.json({
      ok: true,
      loginUrl: loginLink.url,
    });
  } catch (err) {
    console.error('Stripe login link error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};
