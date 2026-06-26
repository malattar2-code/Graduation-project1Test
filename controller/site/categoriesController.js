const Category = require('../../models/Category');
// DISABLED: Firebase operations replaced with PostgreSQL-only approach
// const { db } = require('../../config/firebase-admin');

exports.addCategory = async (req, res) => {
    try {
        console.log('=== ADD CATEGORY REQUEST ===');
        console.log('Request body:', req.body);

        const { categoryName, categoryDescription, imageUrl } = req.body;

        if (!categoryName || categoryName.trim() === '') {
            console.log('Validation failed: Category name is required');
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }

        const categoryData = {
            category_name: categoryName.trim(),
            category_description: categoryDescription ? categoryDescription.trim() : null,
            firebase_id: generateFirebaseId()
        };

        if (imageUrl && imageUrl.trim() !== '') {
            categoryData.category_image = imageUrl.trim();
            console.log('Image URL will be stored:', categoryData.category_image);
        } else {
            categoryData.category_image = null;
            console.log('No image URL provided');
        }

        console.log('Category data to save:', categoryData);

        const newCategory = await Category.create(categoryData);

        console.log('✅ Category created in PostgreSQL:', {
            id: newCategory.category_id,
            name: newCategory.category_name,
            image: newCategory.category_image
        });

        // DISABLED: Firebase synchronization removed per requirements
        // All category data is now managed exclusively in PostgreSQL
        /*
        try {
            const firebaseData = {
                categoryName: categoryName.trim(),
                categoryImage: imageUrl || '',
                categoryDescription: categoryDescription || '',
                createdAt: new Date().toISOString()
            };

            const firebaseRef = db.collection('categories').doc(newCategory.firebase_id);
            await firebaseRef.set(firebaseData);
            console.log('✅ Category synced to Firebase');
        } catch (firebaseError) {
            console.warn('⚠️ Firebase sync failed, but PostgreSQL entry created:', firebaseError);
        }
        */

        res.json({
            success: true,
            message: 'Category added successfully',
            category: newCategory
        });

    } catch (error) {
        console.error('❌ Error adding category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add category: ' + error.message
        });
    }
};

exports.getCategoriesPage = async (req, res) => {
    try {
        const categories = await Category.findAll({
            order: [['category_name', 'ASC']]
        });

        console.log('📊 Categories found:', categories.length);
        categories.forEach(cat => {
            console.log(`- ${cat.category_name}: ${cat.category_image || 'No image'}`);
        });

        res.render('site/categories', {
            categories: categories,
            title: 'Categories Management'
        });

    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).send('Error loading categories page');
    }
};

// API endpoint to get all categories
exports.getCategoriesAPI = async (req, res) => {
    try {
        const categories = await Category.findAll({
            order: [['category_name', 'ASC']]
        });
        
        res.json({
            success: true,
            data: categories,
            count: categories.length
        });
    } catch (error) {
        console.error('Error fetching categories API:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories'
        });
    }
};

function generateFirebaseId() {
    return 'cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}