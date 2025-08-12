const { MongoClient } = require('mongodb');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// MongoDB connection string
const MONGODB_URI = 'mongodb://127.0.0.1:27017/Think41ecommerce';
const DATABASE_NAME = 'Think41ecommerce';

async function uploadDatasets() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DATABASE_NAME);
    
    // List of datasets to upload
    const datasets = [
      { filename: 'distribution_centers.csv', collection: 'distribution_centers' },
      { filename: 'products.csv', collection: 'products' },
      { filename: 'users.csv', collection: 'users' },
      { filename: 'inventory_items.csv', collection: 'inventory_items' },
      { filename: 'orders.csv', collection: 'orders' },
      { filename: 'order_items.csv', collection: 'order_items' }
    ];
    
    for (const dataset of datasets) {
      const filePath = path.join(__dirname, '..', 'Dataset', dataset.filename);
      
      if (!fs.existsSync(filePath)) {
        console.log(`❌ File not found: ${dataset.filename}`);
        continue;
      }
      
      console.log(`📤 Uploading ${dataset.filename} to ${dataset.collection} collection...`);
      
      const collection = db.collection(dataset.collection);
      
      // Clear existing data
      await collection.deleteMany({});
      console.log(`🗑️  Cleared existing data from ${dataset.collection}`);
      
      const documents = [];
      
      // Read and parse CSV
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (row) => {
            // Convert string numbers to actual numbers where appropriate
            const processedRow = {};
            for (const [key, value] of Object.entries(row)) {
              if (value === '') {
                processedRow[key] = null;
              } else if (!isNaN(value) && value !== '') {
                processedRow[key] = Number(value);
              } else {
                processedRow[key] = value;
              }
            }
            documents.push(processedRow);
          })
          .on('end', resolve)
          .on('error', reject);
      });
      
      if (documents.length > 0) {
        const result = await collection.insertMany(documents);
        console.log(`✅ Uploaded ${result.insertedCount} documents to ${dataset.collection}`);
      } else {
        console.log(`⚠️  No documents found in ${dataset.filename}`);
      }
    }
    
    console.log('\n🎉 All datasets uploaded successfully!');
    
    // Display collection statistics
    const collections = await db.listCollections().toArray();
    console.log('\n📊 Database Statistics:');
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`  ${collection.name}: ${count} documents`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the upload script
uploadDatasets();
