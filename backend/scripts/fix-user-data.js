// This script fixes corrupted user data in the txhashDB database
const { Level } = require('level');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../log/txhashStore');

async function repairUserData() {
  console.log('Starting user data repair process...');
  console.log(`Opening database at: ${dbPath}`);

  try {
    const db = new Level(dbPath, { valueEncoding: 'json' });
    const allKeys = await db.keys().all();
    const userKeys = allKeys.filter(key => key.startsWith('user:'));
    
    console.log(`Found ${userKeys.length} user keys in database`);
    
    // Process each user key
    let repaired = 0;
    let skipped = 0;
    let failed = 0;
    
    for (const key of userKeys) {
      try {
        // Get raw value as buffer/string to examine
        const options = { valueEncoding: 'utf8' };
        const rawData = await db.get(key, options);
        
        console.log(`Processing key: ${key}`);
        console.log(`Raw data: ${rawData.substring(0, 100)}...`);
        
        let userObject;
        
        // Try to parse the data
        try {
          userObject = JSON.parse(rawData);
          console.log('Data already valid JSON, skipping repair');
          skipped++;
        } catch (parseError) {
          console.log(`JSON parse error: ${parseError.message}`);
          
          // Attempt to fix the JSON
          // Find the start of the actual JSON (look for first '{')
          const jsonStart = rawData.indexOf('{');
          if (jsonStart >= 0) {
            const correctedJson = rawData.substring(jsonStart);
            console.log(`Attempting to repair from: ${correctedJson.substring(0, 50)}...`);
            
            try {
              userObject = JSON.parse(correctedJson);
              console.log(`Successfully repaired data for key: ${key}`);
              
              // Write corrected data back to database
              await db.put(key, userObject);
              repaired++;
            } catch (repairError) {
              console.error(`Failed to repair data for key ${key}: ${repairError.message}`);
              failed++;
            }
          } else {
            console.error(`Could not find JSON data in value for key: ${key}`);
            failed++;
          }
        }
      } catch (error) {
        console.error(`Error processing key ${key}: ${error.message}`);
        failed++;
      }
    }
    
    console.log('Repair process completed:');
    console.log(`- Total user keys: ${userKeys.length}`);
    console.log(`- Repaired: ${repaired}`);
    console.log(`- Skipped (already valid): ${skipped}`);
    console.log(`- Failed: ${failed}`);
    
    await db.close();
    console.log('Database closed successfully');
    
  } catch (error) {
    console.error(`Failed to repair database: ${error.message}`);
  }
}

// Run the repair function
repairUserData().catch(error => {
  console.error('Unhandled error in repair script:', error);
});
