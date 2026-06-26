// services/categorySyncService.js
const Category = require('../models/Category');
const { db } = require("../config/firebase-admin");

class CategorySyncService {
  constructor() {
    this.isSyncing = false;
  }

  /**
   * Sync categories from PostgreSQL to Firebase
   */
  async syncPostgresToFirebase() {
    if (this.isSyncing) {
      console.log('Sync already in progress...');
      return { success: false, message: 'Sync already in progress' };
    }

    this.isSyncing = true;
    console.log('Starting PostgreSQL to Firebase sync...');

    try {
      // Fetch all categories from PostgreSQL using Sequelize
      const pgCategories = await Category.findAll({
        order: [['category_id', 'ASC']]
      });
      
      console.log(`Found ${pgCategories.length} categories in PostgreSQL`);

      // Get Firebase categories collection reference
      const categoriesRef = db.collection('categories');
      let syncedCount = 0;
      let errors = [];
      
      // Process each PostgreSQL category
      for (const pgCategory of pgCategories) {
        try {
          // Prepare Firebase document data
          const firebaseData = {
            categoryId: pgCategory.category_id,
            categoryName: pgCategory.category_name || '',
            categoryImage: pgCategory.category_image || 'Disabilities',
            categoryDescription: pgCategory.category_description || '',
            createdAt: pgCategory.created_at || new Date(),
            updatedAt: pgCategory.updated_at || new Date(),
            syncedAt: new Date()
          };

          if (pgCategory.firebase_id) {
            // Update existing Firebase document
            await categoriesRef.doc(pgCategory.firebase_id).set(firebaseData, { merge: true });
            console.log(`Updated Firebase doc: ${pgCategory.firebase_id}`);
          } else {
            // Create new Firebase document
            const docRef = await categoriesRef.add(firebaseData);
            
            // Update PostgreSQL with the Firebase ID using Sequelize
            await pgCategory.update({ firebase_id: docRef.id });
            
            console.log(`Created new Firebase doc: ${docRef.id} for category_id: ${pgCategory.category_id}`);
          }
          syncedCount++;
        } catch (error) {
          console.error(`Error syncing category ${pgCategory.category_id}:`, error);
          errors.push({ categoryId: pgCategory.category_id, error: error.message });
        }
      }

      console.log(`PostgreSQL to Firebase sync completed. Synced: ${syncedCount}/${pgCategories.length}`);
      return { 
        success: true, 
        syncedCount, 
        totalCount: pgCategories.length,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('Sync error:', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync categories from Firebase to PostgreSQL
   */
  async syncFirebaseToPostgres() {
    if (this.isSyncing) {
      console.log('Sync already in progress...');
      return { success: false, message: 'Sync already in progress' };
    }

    this.isSyncing = true;
    console.log('Starting Firebase to PostgreSQL sync...');

    try {
      // Fetch all categories from Firebase
      const snapshot = await db.collection('categories').get();
      const firebaseCategories = [];
      
      snapshot.forEach(doc => {
        firebaseCategories.push({
          firebase_id: doc.id,
          ...doc.data()
        });
      });

      console.log(`Found ${firebaseCategories.length} categories in Firebase`);
      let syncedCount = 0;
      let errors = [];

      // Process each Firebase category
      for (const fbCategory of firebaseCategories) {
        try {
          // Check if category exists in PostgreSQL
          const existingCategory = await Category.findOne({
            where: { firebase_id: fbCategory.firebase_id }
          });

          if (existingCategory) {
            // Update existing PostgreSQL record
            await existingCategory.update({
              category_name: fbCategory.categoryName || '',
              category_image: fbCategory.categoryImage || '',
              category_description: fbCategory.categoryDescription || ''
            });
            
            console.log(`Updated PostgreSQL category with firebase_id: ${fbCategory.firebase_id}`);
          } else {
            // Create new record in PostgreSQL
            const newCategory = await Category.create({
              category_name: fbCategory.categoryName || '',
              category_image: fbCategory.categoryImage || '',
              category_description: fbCategory.categoryDescription || '',
              firebase_id: fbCategory.firebase_id
            });
            
            console.log(`Created new PostgreSQL category with ID: ${newCategory.category_id}`);
            
            // Update Firebase with the PostgreSQL category_id
            await db.collection('categories').doc(fbCategory.firebase_id).update({
              categoryId: newCategory.category_id
            });
          }
          syncedCount++;
        } catch (error) {
          console.error(`Error syncing Firebase category ${fbCategory.firebase_id}:`, error);
          errors.push({ firebaseId: fbCategory.firebase_id, error: error.message });
        }
      }

      console.log(`Firebase to PostgreSQL sync completed. Synced: ${syncedCount}/${firebaseCategories.length}`);
      return { 
        success: true, 
        syncedCount,
        totalCount: firebaseCategories.length,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('Sync error:', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Two-way sync: First sync PostgreSQL to Firebase, then Firebase to PostgreSQL
   */
  async syncBothWays() {
    console.log('Starting two-way synchronization...');
    
    try {
      const results = {
        postgresqlToFirebase: null,
        firebaseToPostgresql: null
      };

      // First sync PostgreSQL to Firebase
      results.postgresqlToFirebase = await this.syncPostgresToFirebase();
      
      // Then sync Firebase to PostgreSQL (for any Firebase-only records)
      results.firebaseToPostgresql = await this.syncFirebaseToPostgres();
      
      console.log('Two-way synchronization completed successfully');
      return { 
        success: true, 
        message: 'Two-way sync completed',
        results 
      };
    } catch (error) {
      console.error('Two-way sync error:', error);
      throw error;
    }
  }

  /**
   * Sync single category by ID
   */
  async syncSingleCategory(categoryId, source) {
    try {
      if (source === 'postgres') {
        // Find category in PostgreSQL
        const category = await Category.findOne({
          where: { category_id: categoryId }
        });

        if (!category) {
          throw new Error('Category not found in PostgreSQL');
        }

        // Prepare Firebase data
        const firebaseData = {
          categoryId: category.category_id,
          categoryName: category.category_name || '',
          categoryImage: category.category_image || 'Disabilities',
          categoryDescription: category.category_description || '',
          updatedAt: new Date(),
          syncedAt: new Date()
        };

        // Update or create in Firebase
        if (category.firebase_id) {
          await db.collection('categories').doc(category.firebase_id).set(firebaseData, { merge: true });
        } else {
          const docRef = await db.collection('categories').add(firebaseData);
          await category.update({ firebase_id: docRef.id });
        }

        return { success: true, message: 'Category synced to Firebase successfully' };

      } else if (source === 'firebase') {
        // Get category from Firebase
        const doc = await db.collection('categories').doc(categoryId).get();
        
        if (!doc.exists) {
          throw new Error('Category not found in Firebase');
        }

        const fbData = doc.data();
        
        // Check if exists in PostgreSQL
        let category = await Category.findOne({
          where: { firebase_id: categoryId }
        });

        if (category) {
          // Update existing
          await category.update({
            category_name: fbData.categoryName || '',
            category_image: fbData.categoryImage || '',
            category_description: fbData.categoryDescription || ''
          });
        } else {
          // Create new
          category = await Category.create({
            category_name: fbData.categoryName || '',
            category_image: fbData.categoryImage || '',
            category_description: fbData.categoryDescription || '',
            firebase_id: categoryId
          });

          // Update Firebase with the new category_id
          await db.collection('categories').doc(categoryId).update({
            categoryId: category.category_id
          });
        }

        return { success: true, message: 'Category synced to PostgreSQL successfully' };
      }

      throw new Error('Invalid source. Use "postgres" or "firebase"');
    } catch (error) {
      console.error('Single category sync error:', error);
      throw error;
    }
  }

  /**
   * Real-time listener for Firebase changes
   */
  startRealtimeSync() {
    console.log('Starting real-time Firebase listener...');
    
    const unsubscribe = db.collection('categories')
      .onSnapshot(async (snapshot) => {
        for (const change of snapshot.docChanges()) {
          const data = change.doc.data();
          const firebaseId = change.doc.id;
          
          try {
            if (change.type === 'added' || change.type === 'modified') {
              // Check if exists in PostgreSQL
              let category = await Category.findOne({
                where: { firebase_id: firebaseId }
              });
              
              if (category) {
                // Update existing
                await category.update({
                  category_name: data.categoryName || '',
                  category_image: data.categoryImage || '',
                  category_description: data.categoryDescription || ''
                });
                console.log(`Real-time update: PostgreSQL category updated for firebase_id: ${firebaseId}`);
              } else {
                // Insert new
                category = await Category.create({
                  category_name: data.categoryName || '',
                  category_image: data.categoryImage || '',
                  category_description: data.categoryDescription || '',
                  firebase_id: firebaseId
                });
                console.log(`Real-time update: New PostgreSQL category created with ID: ${category.category_id}`);
                
                // Update Firebase with the category_id
                await db.collection('categories').doc(firebaseId).update({
                  categoryId: category.category_id
                });
              }
            } else if (change.type === 'removed') {
              // Optional: Delete from PostgreSQL or mark as deleted
              const category = await Category.findOne({
                where: { firebase_id: firebaseId }
              });
              
              if (category) {
                await category.destroy();
                console.log(`Real-time update: PostgreSQL category deleted for firebase_id: ${firebaseId}`);
              }
            }
          } catch (error) {
            console.error(`Real-time sync error for ${firebaseId}:`, error);
          }
        }
      }, (error) => {
        console.error('Real-time listener error:', error);
      });
    
    return unsubscribe;
  }

  /**
   * Get sync statistics
   */
  async getSyncStats() {
    try {
      const pgCount = await Category.count();
      const pgWithFirebase = await Category.count({
        where: {
          firebase_id: {
            [require('sequelize').Op.ne]: null
          }
        }
      });

      const fbSnapshot = await db.collection('categories').get();
      const fbCount = fbSnapshot.size;

      return {
        postgresql: {
          total: pgCount,
          synced: pgWithFirebase,
          notSynced: pgCount - pgWithFirebase
        },
        firebase: {
          total: fbCount
        },
        syncStatus: pgWithFirebase === pgCount && pgCount === fbCount ? 'Fully Synced' : 'Partially Synced'
      };
    } catch (error) {
      console.error('Error getting sync stats:', error);
      throw error;
    }
  }
}

module.exports = new CategorySyncService();