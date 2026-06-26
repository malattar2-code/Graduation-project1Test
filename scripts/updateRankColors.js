const sequelize = require('../config/dbSQL');
const UserRankPoint = require('../models/UserRankPoint');
const Rank = require('../models/Rank');

async function updateRankColors() {
  try {
    const userRankPoints = await UserRankPoint.findAll({ where: { rankColor: null } });
    console.log(`Found ${userRankPoints.length} records without rank color`);
    
    for (const urp of userRankPoints) {
      if (urp.currentRankId) {
        const rank = await Rank.findByPk(urp.currentRankId);
        if (rank && rank.rankColor) {
          urp.rankColor = rank.rankColor;
          await urp.save();
          console.log(`Updated user ${urp.userId} with color ${rank.rankColor}`);
        }
      }
    }
    console.log('Done');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

updateRankColors();