// test-routes.js - Run this with: node test-routes.js
console.log('🔍 Testing individual route files...');

const testFile = (filePath, name) => {
  try {
    delete require.cache[require.resolve(filePath)];
    const routes = require(filePath);
    console.log(`✅ ${name} loaded successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ERROR in ${name}:`, error.message);
    return false;
  }
};

// Test each route file
testFile('../routers/site/userRegistrationRoutes', 'userRegistrationRoutes');
testFile('../routers/site/syncRoutes', 'syncRoutes');
testFile('../routers/site/categoriesRoute', 'categoriesRoute');
testFile('../routers/site/categoryRoute', 'categoryRoute');
testFile('../routers/site/faqRoute', 'faqRoute');
testFile('../routers/dashboard/userPanelIndigentRoute', 'userPanelIndigentRoute');
testFile('../routers/site/allFundraisersRoute', 'allFundraisersRoute');
testFile('../routers/index', 'main router');

console.log('Testing completed.');