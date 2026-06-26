// import-data-improved.js
const { Client } = require('pg');
const fs = require('fs');
const readline = require('readline');

const connectionString = "postgresql://najdah_user:c4bk0t3ppzc8WOybf5n82HOejiii9eDy@dpg-d4clrfgdl3ps73biq470-a.oregon-postgres.render.com:5432/najdah_db";

async function importData() {
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read and clean the SQL file
    const sqlContent = fs.readFileSync('./backup-plain.sql', 'utf8');
    
    // Remove problematic characters and split into statements
    const cleanedSQL = sqlContent
      .replace(/\\'/g, "''") // Fix escaped quotes
      .replace(/\\n/g, '\n') // Fix newlines
      .replace(/\\r/g, '\r') // Fix carriage returns
      .replace(/\\"/g, '"'); // Fix escaped quotes

    // Split into individual statements
    const statements = cleanedSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📦 Found ${statements.length} SQL statements to execute`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip very long data inserts for now
      if (statement.length > 10000) {
        console.log(`⏭️  Skipping long statement ${i + 1}`);
        continue;
      }

      try {
        await client.query(statement);
        successCount++;
        if (i % 10 === 0) {
          console.log(`✅ Executed ${i + 1}/${statements.length} statements`);
        }
      } catch (error) {
        errorCount++;
        console.log(`❌ Error in statement ${i + 1}:`, error.message);
        // Continue with next statement
      }
    }

    console.log(`🎉 Import completed: ${successCount} successful, ${errorCount} failed`);

  } catch (error) {
    console.error('❌ Connection or file read failed:', error.message);
  } finally {
    await client.end();
  }
}

importData();