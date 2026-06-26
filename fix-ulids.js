// fix-ulids.js — Run once: node fix-ulids.js
require('dotenv').config(); // ← ADD THIS LINE

const { ulid } = require('ulid');
const sequelize = require('./config/dbSQL');
const Fundraiser = require('./models/Fundraiser');

async function fix() {
  try {
    // Test connection first
    await sequelize.authenticate();
    console.log('✅ DB connection OK');

    const tempFundraisers = await Fundraiser.findAll({
      where: {
        public_id: {
          [require('sequelize').Op.like]: 'TEMP_%'
        }
      },
      attributes: ['fundraiser_id', 'public_id']
    });

    console.log(`Found ${tempFundraisers.length} TEMP_ records to fix`);

    for (const f of tempFundraisers) {
      const newUlid = ulid();
      await Fundraiser.update(
        { public_id: newUlid },
        { where: { fundraiser_id: f.fundraiser_id } }
      );
      console.log(`✅ Updated: ${f.public_id} → ${newUlid}`);
    }

    console.log('\n🎉 Done! All TEMP_ IDs replaced.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

fix();