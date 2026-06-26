// const mongoose = require('mongoose');

// const paymentSchema = new mongoose.Schema({
//     requestId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'FinancialRequest',
//         required: true
//     },
//     stripePaymentId: {
//         type: String,
//         required: true
//     },
//     stripeInvoiceId: {
//         type: String,
//         required: true
//     },
//     amount: {
//         type: Number,
//         required: true,
//     },
//     currency: {
//         type: String,
//         required: true
//     },
//     status: {
//         type: String,
//         enum: ['pending', 'completed', 'failed'],
//         default: 'pending'
//     },
//     donorEmail: {
//         type: String,
//         required: true
//     },
//     donorName: {
//         type: String,
//         required: true
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now
//     }
// });

// module.exports = mongoose.model('Payment', paymentSchema);
