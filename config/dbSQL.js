const { Sequelize } = require('sequelize');

// let sequelize;

const sequelize = new Sequelize({
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD||"12345678",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  dialect: "postgres",
  logging: console.log, // Enable logging
  define: {
    timestamps: true,
    underscored: true
  }
});

// if (process.env.DATABASE_URL) {
//   // Production - use Render's DATABASE_URL
//   sequelize = new Sequelize(process.env.DATABASE_URL, {
//     dialect: 'postgres',
//     dialectOptions: {
//       ssl: {
//         require: true,
//         rejectUnauthorized: false
//       }
//     },
//     logging: process.env.NODE_ENV === 'development' ? console.log : false,
//     pool: {
//       max: 5,
//       min: 0,
//       acquire: 30000,
//       idle: 10000
//     }
//   });
// } else {
//   // Development - use individual environment variables
//   sequelize = new Sequelize(
//     process.env.DB_NAME || 'NajdaDB',
//     process.env.DB_USER || 'postgres', 
//     process.env.DB_PASSWORED || '',
//     {
//       host: process.env.DB_HOST || 'localhost',
//       port: process.env.DB_PORT || 5432,
//       dialect: 'postgres',
//       logging: process.env.NODE_ENV === 'development' ? console.log : false,
//       pool: {
//         max: 5,
//         min: 0,
//         acquire: 30000,
//         idle: 10000
//       }
//     }
//   );
// }

// Test connection function
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
}

testConnection();

module.exports = sequelize;