// testModel.js
const Category = require('./models/Category');

async function testConnection() {
  try {
    console.log('Testing Category model...');
    
    // Test if we can query the database
    const count = await Category.count();
    console.log(`✅ Category model connected successfully. Found ${count} categories.`);
    
    // Test creating a sample category
    const testCategory = await Category.create({
      category_name: 'Test Category',
      category_description: 'This is a test category',
      firebase_id: 'test-' + Date.now()
    });
    
    console.log('✅ Test category created successfully:', testCategory.category_id);
    
    // Clean up
    await Category.destroy({ where: { category_name: 'Test Category' } });
    console.log('✅ Test category cleaned up');
    
  } catch (error) {
    console.error('❌ Error testing Category model:', error);
  }
}

testConnection();