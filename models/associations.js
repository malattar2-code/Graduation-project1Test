// models/associations.js
const User = require('./User');
const Fundraiser = require('./Fundraiser');
const FundraiserForm = require('./FundraiserForm');
const FundraiserRequest = require('./FundraiserRequest');
const Notification = require('./Notification');
const FundraisersVerificationRequest = require('./FundraisersVerificationRequest');
const Comment = require('./Comment');
const SavedFundraiser = require('./SavedFundraiser');
const Complaint = require('./Complaint');
const DonorsThanks = require('./DonorsThanks');
const Invoice = require('./Invoice');
const LedgerTransaction = require('./LedgerTransaction');
const WithdrawRequest = require('./WithdrawRequest');
const TransferLog = require('./TransferLog');
const FundraiserBalance = require('./FundraiserBalance');
const UserRankPoint = require('./UserRankPoint');
const Rank = require('./Rank');
const FundraiserAchievement = require('./FundraiserAchievement');

// ── User ─────────────────────────────────
User.hasMany(Fundraiser, { foreignKey: "fundraiser_user_id", as: "fundraisers" });
User.hasMany(Notification, { as: "notifications", foreignKey: "user_id" });
User.hasMany(SavedFundraiser, { foreignKey: "user_id", as: "savedFundraisers" });
User.hasOne(UserRankPoint, { foreignKey: 'userId', sourceKey: 'id', as: 'UserRankPoint' });

// ── Fundraiser ───────────────────────────
Fundraiser.belongsTo(User, { foreignKey: "fundraiser_user_id", as: "user" });
Fundraiser.hasOne(FundraiserForm, { foreignKey: "fundraiser_id", as: "form" });
Fundraiser.hasMany(FundraiserRequest, { foreignKey: "fundraiser_id", as: "submissions" });
Fundraiser.hasMany(SavedFundraiser, { foreignKey: "fundraiser_id", as: "savedByUsers", onDelete: 'CASCADE' });

// ── FundraiserForm ───────────────────────
FundraiserForm.belongsTo(Fundraiser, { foreignKey: "fundraiser_id", as: "fundraiser" });
FundraiserForm.belongsTo(User, { foreignKey: "user_id", as: "creator" });
FundraiserForm.hasMany(FundraiserRequest, { foreignKey: "form_id", as: "requests" });

// ── FundraiserRequest ────────────────────
FundraiserRequest.belongsTo(FundraiserForm, { foreignKey: "form_id", as: "form" });
FundraiserRequest.belongsTo(Fundraiser, { foreignKey: "fundraiser_id", as: "fundraiser" });
FundraiserRequest.belongsTo(User, { foreignKey: "user_id", as: "requester" });

// ── Notification ─────────────────────────
// Replace existing Notification associations with:
// Notification sender (can be user or admin, so no constraint)
Notification.belongsTo(User, { as: "senderUser", foreignKey: "sender_id", constraints: false });
Notification.belongsTo(User, { as: "recipient", foreignKey: "user_id", constraints: false });

// ── Fundraiser ↔ Verification Request ─────
Fundraiser.hasOne(FundraisersVerificationRequest, { foreignKey: "fundraiser_id", as: "verificationRequest" });
FundraisersVerificationRequest.belongsTo(Fundraiser, { foreignKey: "fundraiser_id", as: "fundraiser" });
FundraisersVerificationRequest.belongsTo(User, { foreignKey: "user_id", as: "requester" });

// ── Comment ──────────────────────────────
Comment.belongsTo(User, { foreignKey: "user_id", as: "user" });
Comment.belongsTo(Fundraiser, { foreignKey: "fundraiser_id", as: "fundraiser", onDelete: 'CASCADE' });
Comment.hasMany(Comment, { foreignKey: "parent_comment_id", as: "replies" });
Comment.belongsTo(Comment, { foreignKey: "parent_comment_id", as: "parent" });

// ── SavedFundraiser ──────────────────────
SavedFundraiser.belongsTo(User, { foreignKey: "user_id", as: "user" });
SavedFundraiser.belongsTo(Fundraiser, { foreignKey: "fundraiser_id", as: "fundraiser", onDelete: 'CASCADE' });

// ── Complaint ────────────────────────────
Complaint.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ── DonorsThanks ─────────────────────────
DonorsThanks.belongsTo(User, { foreignKey: 'user_thanked_id', as: 'thankedUser' });
DonorsThanks.belongsTo(User, { foreignKey: 'user_grateful_id', as: 'gratefulUser' });

// ── UserRankPoint ────────────────────────
UserRankPoint.belongsTo(User, { foreignKey: 'userId', targetKey: 'id', as: 'User', onDelete: 'CASCADE' });
UserRankPoint.belongsTo(Rank, { foreignKey: 'currentRankId', targetKey: 'rankId', as: 'Rank', onDelete: 'SET NULL' });
Rank.hasMany(UserRankPoint, { foreignKey: 'currentRankId', sourceKey: 'rankId', as: 'UserRankPoints' });

// ── User <-> Invoice (as donor) ─────────────────────────────────────────────
User.hasMany(Invoice, {
  foreignKey: 'donor_id',
  as: 'donations_made'
});
Invoice.belongsTo(User, {
  foreignKey: 'donor_id',
  as: 'donor'
});

// ── Fundraiser <-> Invoice ──────────────────────────────────────────────────
Fundraiser.hasMany(Invoice, {
  foreignKey: 'fundraiser_id',
  as: 'invoices'
});
Invoice.belongsTo(Fundraiser, {
  foreignKey: 'fundraiser_id',
  as: 'fundraiser'
});

// ── Fundraiser <-> LedgerTransaction ────────────────────────────────────────
Fundraiser.hasMany(LedgerTransaction, {
  foreignKey: 'fundraiser_id',
  as: 'ledger_entries'
});
LedgerTransaction.belongsTo(Fundraiser, {
  foreignKey: 'fundraiser_id',
  as: 'fundraiser'
});

// ── User <-> LedgerTransaction ──────────────────────────────────────────────
User.hasMany(LedgerTransaction, {
  foreignKey: 'user_id',
  as: 'ledger_entries'
});
LedgerTransaction.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// ── Fundraiser <-> WithdrawRequest ──────────────────────────────────────────
Fundraiser.hasMany(WithdrawRequest, {
  foreignKey: 'fundraiser_id',
  as: 'withdraw_requests'
});
WithdrawRequest.belongsTo(Fundraiser, {
  foreignKey: 'fundraiser_id',
  as: 'fundraiser'
});

// ── User <-> WithdrawRequest ────────────────────────────────────────────────
User.hasMany(WithdrawRequest, {
  foreignKey: 'user_id',
  as: 'withdraw_requests'
});
WithdrawRequest.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// ── WithdrawRequest <-> TransferLog (one-to-one) ────────────────────────────
WithdrawRequest.hasOne(TransferLog, {
  foreignKey: 'withdraw_request_id',
  as: 'transfer_log'
});
TransferLog.belongsTo(WithdrawRequest, {
  foreignKey: 'withdraw_request_id',
  as: 'withdraw_request'
});

// ── Fundraiser <-> TransferLog ──────────────────────────────────────────────
Fundraiser.hasMany(TransferLog, {
  foreignKey: 'fundraiser_id',
  as: 'transfer_logs'
});
TransferLog.belongsTo(Fundraiser, {
  foreignKey: 'fundraiser_id',
  as: 'fundraiser'
});

// ── User <-> TransferLog ────────────────────────────────────────────────────
User.hasMany(TransferLog, {
  foreignKey: 'user_id',
  as: 'transfer_logs'
});
TransferLog.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// ── Fundraiser <-> FundraiserBalance (one-to-one) ───────────────────────────
Fundraiser.hasOne(FundraiserBalance, {
  foreignKey: 'fundraiser_id',
  as: 'balance'
});
FundraiserBalance.belongsTo(Fundraiser, {
  foreignKey: 'fundraiser_id',
  as: 'fundraiser'
});

// ── User (admin) <-> WithdrawRequest (reviewed_by) ──────────────────────────
User.hasMany(WithdrawRequest, {
  foreignKey: 'reviewed_by',
  as: 'reviewed_withdrawals'
});
WithdrawRequest.belongsTo(User, {
  foreignKey: 'reviewed_by',
  as: 'reviewer'
});
// ── Fundraiser <-> FundraiserAchievement ─────────────────────────────────────
Fundraiser.hasMany(FundraiserAchievement, {
  foreignKey: 'fundraiser_id',
  as: 'achievements'
});
FundraiserAchievement.belongsTo(Fundraiser, {
  foreignKey: 'fundraiser_id',
  as: 'fundraiser'
});

// ── User <-> FundraiserAchievement ─────────────────────────────────────────
User.hasMany(FundraiserAchievement, {
  foreignKey: 'user_id',
  as: 'achievements'
});
FundraiserAchievement.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

module.exports = {
  User, Fundraiser, FundraiserForm, FundraiserRequest,
  Notification, FundraisersVerificationRequest, Comment,
  SavedFundraiser, Complaint, DonorsThanks,
  UserRankPoint, Rank,  Invoice, LedgerTransaction,
  WithdrawRequest,TransferLog,FundraiserBalance,
  FundraiserAchievement
};