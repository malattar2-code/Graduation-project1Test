const RankAssignmentService = require('../services/rankAssignmentService');

async function testRankSystem() {
  try {
    console.log('🧪 Testing rank assignment system...');
    
    // Test with a specific donor user ID (replace with actual ID)
    const testUserId = 1; // Replace with actual donor user ID
    
    // Test adding points
    await RankAssignmentService.addPointsToUser(testUserId, 50, 'Test donation');
    await RankAssignmentService.addPointsToUser(testUserId, 25, 'Test referral');
    
    // Check progress
    const progress = await RankAssignmentService.getUserRankProgress(testUserId);
    console.log('📊 User rank progress:', progress);
    
    // Test leaderboard
    const leaderboard = await RankAssignmentService.getLeaderboard(5);
    console.log('🏆 Leaderboard:', leaderboard.map(u => ({
      user: u.User.full_name,
      points: u.userPoints
    })));
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testRankSystem();