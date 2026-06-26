/**
 * Payment & Withdrawal System Migration
 * ======================================
 * Run this migration to set up the new payment system:
 * 1. Rename old tables (invoices, transfer_logs) to backup names
 * 2. Add new columns to existing tables (fundraisers, users)
 * 3. Create new tables (invoices_v2, ledger_transactions, withdraw_requests, transfer_logs_v2, fundraiser_balances)
 * 4. Remove stripeAccountId from fundraisers table
 */

const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/dbSQL'); // adjust path as needed

async function up() {
  const t = await sequelize.transaction();

  try {
    console.log('=== Starting Payment System Migration ===');

    // ── 1. Rename old tables to backup names ───────────────────────────────
    console.log('1. Renaming old tables...');
    await sequelize.query(
      `ALTER TABLE IF EXISTS invoices RENAME TO invoices_old;`,
      { transaction: t }
    );
    await sequelize.query(
      `ALTER TABLE IF EXISTS transfer_logs RENAME TO transfer_logs_old;`,
      { transaction: t }
    );
    console.log('   ✓ Old tables renamed to invoices_old, transfer_logs_old');

    // ── 2. Modify fundraisers table ────────────────────────────────────────
    console.log('2. Modifying fundraisers table...');

    // Add fundraiser_owner_type ENUM
    await sequelize.query(
      `ALTER TABLE fundraisers 
       ADD COLUMN IF NOT EXISTS fundraiser_owner_type VARCHAR(20) 
       CHECK (fundraiser_owner_type IN ('requester', 'charity')) 
       DEFAULT 'requester';`,
      { transaction: t }
    );

    // Add allow_early_withdrawal BOOLEAN
    await sequelize.query(
      `ALTER TABLE fundraisers 
       ADD COLUMN IF NOT EXISTS allow_early_withdrawal BOOLEAN 
       DEFAULT FALSE;`,
      { transaction: t }
    );

    // Drop stripeAccountId column
    await sequelize.query(
      `ALTER TABLE fundraisers 
       DROP COLUMN IF EXISTS stripeAccountId;`,
      { transaction: t }
    );

    // Note: 'expired' value for fundraiser_status ENUM
    // PostgreSQL requires recreating ENUM to add values
    // Check if status column exists and is ENUM
    const [enumResult] = await sequelize.query(
      `SELECT pg_type.typname AS enum_type,
              pg_enum.enumlabel AS enum_value
       FROM pg_type
       JOIN pg_enum ON pg_enum.enumtypid = pg_type.oid
       JOIN pg_attribute ON pg_attribute.atttypid = pg_type.oid
       JOIN pg_class ON pg_class.oid = pg_attribute.attrelid
       WHERE pg_class.relname = 'fundraisers'
       AND pg_attribute.attname = 'fundraiser_status';`,
      { transaction: t }
    );

    if (enumResult.length > 0) {
      const enumTypeName = enumResult[0].enum_type;
      const hasExpired = enumResult.some(r => r.enum_value === 'expired');

      if (!hasExpired) {
        // Rename old enum, create new one with 'expired', swap columns
        await sequelize.query(
          `ALTER TYPE ${enumTypeName} RENAME TO ${enumTypeName}_old;`,
          { transaction: t }
        );
        await sequelize.query(
          `CREATE TYPE ${enumTypeName} AS ENUM (
            'incompleted', 'create_form', 'Waiting_requesters', 
            'completed', 'transferred', 'waiting_verification', 'expired'
          );`,
          { transaction: t }
        );
        await sequelize.query(
          `ALTER TABLE fundraisers 
           ALTER COLUMN fundraiser_status TYPE ${enumTypeName} 
           USING fundraiser_status::text::${enumTypeName};`,
          { transaction: t }
        );
        await sequelize.query(
          `DROP TYPE ${enumTypeName}_old;`,
          { transaction: t }
        );
        console.log('   ✓ Added "expired" to fundraiser_status ENUM');
      }
    }
    console.log('   ✓ Fundraisers table modified');

    // ── 3. Modify users table ──────────────────────────────────────────────
    console.log('3. Modifying users table...');

    await sequelize.query(
      `ALTER TABLE users 
       ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP NULL;`,
      { transaction: t }
    );

    await sequelize.query(
      `ALTER TABLE users 
       ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP NULL;`,
      { transaction: t }
    );

    // Remove stripe_account_id from users if it exists
    await sequelize.query(
      `ALTER TABLE users 
       DROP COLUMN IF EXISTS stripe_account_id;`,
      { transaction: t }
    );
    console.log('   ✓ Users table modified');

    // ── 4. Create invoices table (new) ─────────────────────────────────────
    console.log('4. Creating invoices table...');
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS invoices (
        id              SERIAL PRIMARY KEY,
        donor_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        fundraiser_id   INTEGER NOT NULL REFERENCES fundraisers(fundraiser_id) ON DELETE RESTRICT,
        gross_amount    DECIMAL(15,2) NOT NULL,
        processing_fee  DECIMAL(15,2) NOT NULL DEFAULT 0,
        net_amount      DECIMAL(15,2) NOT NULL,
        currency        VARCHAR(3) NOT NULL DEFAULT 'USD',
        payment_provider VARCHAR(20) NOT NULL 
          CHECK (payment_provider IN ('stripe', 'paypal', 'palpay', 'bank_transfer')),
        provider_transaction_id VARCHAR(255),
        status          VARCHAR(20) NOT NULL DEFAULT 'pending'
          CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
        points_processed BOOLEAN NOT NULL DEFAULT FALSE,
        points_processed_at TIMESTAMP NULL,
        paid_at         TIMESTAMP NULL,
        created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
      );`,
      { transaction: t }
    );
    await sequelize.query(
      `CREATE INDEX idx_invoices_donor ON invoices(donor_id);`,
      { transaction: t }
    );
    await sequelize.query(
      `CREATE INDEX idx_invoices_fundraiser ON invoices(fundraiser_id);`,
      { transaction: t }
    );
    await sequelize.query(
      `CREATE INDEX idx_invoices_status ON invoices(status);`,
      { transaction: t }
    );
    await sequelize.query(
      `CREATE INDEX idx_invoices_provider_tx ON invoices(provider_transaction_id);`,
      { transaction: t }
    );
    console.log('   ✓ Invoices table created');

    // ── 5. Create ledger_transactions table ────────────────────────────────
    console.log('5. Creating ledger_transactions table...');
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS ledger_transactions (
        id              SERIAL PRIMARY KEY,
        fundraiser_id   INTEGER NOT NULL REFERENCES fundraisers(fundraiser_id) ON DELETE RESTRICT,
        user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        type            VARCHAR(20) NOT NULL
          CHECK (type IN ('donation', 'withdrawal', 'refund', 'fee', 'adjustment')),
        amount          DECIMAL(15,2) NOT NULL,
        currency        VARCHAR(3) NOT NULL DEFAULT 'USD',
        reference_type  VARCHAR(30) NOT NULL
          CHECK (reference_type IN ('invoice', 'withdraw_request', 'transfer_log', 'admin_adjustment')),
        reference_id    INTEGER NOT NULL,
        description     TEXT NOT NULL,
        created_at      TIMESTAMP NOT NULL DEFAULT NOW()
      );`,
      { transaction: t }
    );
    await sequelize.query(
      `CREATE INDEX idx_ledger_fundraiser ON ledger_transactions(fundraiser_id);`,
      { transaction: t }
    );
    await sequelize.query(
      `CREATE INDEX idx_ledger_user ON ledger_transactions(user_id);`,
      { transaction: t }
    );
    await sequelize.query(
      `CREATE INDEX idx_ledger_type ON ledger_transactions(type);`,
      { transaction: t }
    );
    await sequelize.query(
      `CREATE INDEX idx_ledger_reference ON ledger_transactions(reference_type, reference_id);`,
      { transaction: t }
    );
    console.log('   ✓ Ledger transactions table created');

    // ── 6. Create withdraw_requests table ──────────────────────────────────
    console.log('6. Creating withdraw_requests table...');
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS withdraw_requests (
        id                  SERIAL PRIMARY KEY,
        fundraiser_id       INTEGER NOT NULL REFERENCES fundraisers(fundraiser_id) ON DELETE RESTRICT,
        user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        amount              DECIMAL(15,2) NOT NULL,
        withdrawal_method   VARCHAR(20) NOT NULL
          CHECK (withdrawal_method IN ('stripe', 'bank_transfer', 'paypal', 'palpay')),
        withdrawal_details  JSONB NOT NULL,
        notes               TEXT NULL,
        admin_notes         TEXT NULL,
        status              VARCHAR(20) NOT NULL DEFAULT 'pending'
          CHECK (status IN ('pending', 'approved', 'rejected', 'processing', 'completed')),
        reviewed_by         INTEGER REFERENCES users(id) ON DELETE SET NULL,
        reviewed_at         TIMESTAMP NULL,
        created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
      );`,
      { transaction: t }
    );
    await sequelize.query(
      `CREATE INDEX idx_withdraw_fundraiser ON withdraw_requests(fundraiser_id);`,
      { transaction: t }
    );
    await sequelize.query(
      `CREATE INDEX idx_withdraw_user ON withdraw_requests(user_id);`,
      { transaction: t }
    );
    await sequelize.query(
      `CREATE INDEX idx_withdraw_status ON withdraw_requests(status);`,
      { transaction: t }
    );
    console.log('   ✓ Withdraw requests table created');

    // ── 7. Create transfer_logs table (new) ────────────────────────────────
    console.log('7. Creating transfer_logs table...');
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS transfer_logs (
        id                      SERIAL PRIMARY KEY,
        withdraw_request_id     INTEGER NOT NULL REFERENCES withdraw_requests(id) ON DELETE RESTRICT,
        fundraiser_id           INTEGER NOT NULL REFERENCES fundraisers(fundraiser_id) ON DELETE RESTRICT,
        user_id                 INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        amount                  DECIMAL(15,2) NOT NULL,
        fee                     DECIMAL(15,2) NOT NULL DEFAULT 0,
        net_amount              DECIMAL(15,2) NOT NULL,
        transfer_provider       VARCHAR(20) NOT NULL
          CHECK (transfer_provider IN ('bank', 'stripe', 'paypal', 'palpay')),
        provider_transfer_id    VARCHAR(255),
        status                  VARCHAR(20) NOT NULL DEFAULT 'processing'
          CHECK (status IN ('processing', 'completed', 'failed')),
        transferred_at          TIMESTAMP NULL,
        created_at              TIMESTAMP NOT NULL DEFAULT NOW()
      );`,
      { transaction: t }
    );
    await sequelize.query(
      `CREATE INDEX idx_transfer_withdraw_req ON transfer_logs(withdraw_request_id);`,
      { transaction: t }
    );
    await sequelize.query(
      `CREATE INDEX idx_transfer_fundraiser ON transfer_logs(fundraiser_id);`,
      { transaction: t }
    );
    await sequelize.query(
      `CREATE INDEX idx_transfer_status ON transfer_logs(status);`,
      { transaction: t }
    );
    await sequelize.query(
      `CREATE INDEX idx_transfer_provider ON transfer_logs(provider_transfer_id);`,
      { transaction: t }
    );
    console.log('   ✓ Transfer logs table created');

    // ── 8. Create fundraiser_balances table ────────────────────────────────
    console.log('8. Creating fundraiser_balances table...');
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS fundraiser_balances (
        fundraiser_id               INTEGER PRIMARY KEY REFERENCES fundraisers(fundraiser_id) ON DELETE CASCADE,
        total_balance               DECIMAL(15,2) NOT NULL DEFAULT 0,
        available_balance           DECIMAL(15,2) NOT NULL DEFAULT 0,
        pending_withdrawal_balance  DECIMAL(15,2) NOT NULL DEFAULT 0,
        total_withdrawn             DECIMAL(15,2) NOT NULL DEFAULT 0,
        total_donors                INTEGER NOT NULL DEFAULT 0,
        last_donation_at            TIMESTAMP NULL,
        updated_at                  TIMESTAMP NOT NULL DEFAULT NOW(),
        total_fees                  DECIMAL(15,2) NOT NULL DEFAULT 0
      );`,
      { transaction: t }
    );
    await sequelize.query(
      `CREATE INDEX idx_balance_available ON fundraiser_balances(available_balance);`,
      { transaction: t }
    );
    console.log('   ✓ Fundraiser balances table created');

    await t.commit();
    console.log('\n=== Migration completed successfully! ===');
    console.log('Summary:');
    console.log('  - Old tables renamed: invoices -> invoices_old, transfer_logs -> transfer_logs_old');
    console.log('  - New tables created: invoices, ledger_transactions, withdraw_requests, transfer_logs, fundraiser_balances');
    console.log('  - Modified tables: fundraisers, users');
    console.log('\nTo rollback, run: node migrations/001_setup_payment_system.js rollback');

  } catch (error) {
    await t.rollback();
    console.error('Migration failed:', error);
    throw error;
  }
}

async function down() {
  const t = await sequelize.transaction();

  try {
    console.log('=== Rolling Back Payment System Migration ===');

    // Drop new tables (order matters due to FK constraints)
    console.log('Dropping new tables...');
    await sequelize.query(`DROP TABLE IF EXISTS transfer_logs CASCADE;`, { transaction: t });
    await sequelize.query(`DROP TABLE IF EXISTS withdraw_requests CASCADE;`, { transaction: t });
    await sequelize.query(`DROP TABLE IF EXISTS ledger_transactions CASCADE;`, { transaction: t });
    await sequelize.query(`DROP TABLE IF EXISTS invoices CASCADE;`, { transaction: t });
    await sequelize.query(`DROP TABLE IF EXISTS fundraiser_balances CASCADE;`, { transaction: t });

    // Restore old table names
    console.log('Restoring old table names...');
    await sequelize.query(
      `ALTER TABLE IF EXISTS invoices_old RENAME TO invoices;`,
      { transaction: t }
    );
    await sequelize.query(
      `ALTER TABLE IF EXISTS transfer_logs_old RENAME TO transfer_logs;`,
      { transaction: t }
    );

    // Revert column changes on fundraisers
    console.log('Reverting fundraisers table...');
    await sequelize.query(
      `ALTER TABLE fundraisers 
       DROP COLUMN IF EXISTS fundraiser_owner_type;`,
      { transaction: t }
    );
    await sequelize.query(
      `ALTER TABLE fundraisers 
       DROP COLUMN IF EXISTS allow_early_withdrawal;`,
      { transaction: t }
    );
    await sequelize.query(
      `ALTER TABLE fundraisers 
       ADD COLUMN IF NOT EXISTS stripeAccountId VARCHAR(255);`,
      { transaction: t }
    );

    // Revert column changes on users
    console.log('Reverting users table...');
    await sequelize.query(
      `ALTER TABLE users 
       DROP COLUMN IF EXISTS last_login_at;`,
      { transaction: t }
    );
    await sequelize.query(
      `ALTER TABLE users 
       DROP COLUMN IF EXISTS terms_accepted_at;`,
      { transaction: t }
    );

    await t.commit();
    console.log('Rollback completed successfully!');

  } catch (error) {
    await t.rollback();
    console.error('Rollback failed:', error);
    throw error;
  }
}

// CLI execution
if (require.main === module) {
  const command = process.argv[2];

  if (command === 'rollback') {
    down().then(() => process.exit(0)).catch(() => process.exit(1));
  } else {
    up().then(() => process.exit(0)).catch(() => process.exit(1));
  }
}

module.exports = { up, down };
