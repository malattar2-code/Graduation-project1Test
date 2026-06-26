const RankAssignmentService = require('../services/rankAssignmentService');

async function initializeAllDonors() {
  try {
    console.log('🚀 Starting donor rank initialization...');
    await RankAssignmentService.initializeAllDonors();
    console.log('✅ Donor rank initialization completed!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Initialization failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initializeAllDonors();
}

module.exports = initializeAllDonors;