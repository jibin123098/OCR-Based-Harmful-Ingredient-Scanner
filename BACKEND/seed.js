const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./firebase-key.json');
const ingredients = require('./data/ingredients.json');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function seedDatabase() {
  console.log(`🚀 Preparing to seed ${ingredients.length} ingredients...`);
  
  const BATCH_LIMIT = 490; 
  const batches = [];
  
  let currentBatch = db.batch();
  let operationCount = 0;

  ingredients.forEach((item) => {
    if (!item.name) return;

    // 1. THE SANITIZER: Strip bad characters
    let docId = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    // 2. THE TRUNCATOR: Stop Firestore from crashing on paragraph-length garbage data
    if (docId.length > 150) {
      docId = docId.substring(0, 150);
    }
    
    if (!docId) return; // Skip if empty

    const docRef = db.collection('harmful_ingredients').doc(docId);
    currentBatch.set(docRef, item);
    operationCount++;

    if (operationCount === BATCH_LIMIT) {
      batches.push(currentBatch);
      currentBatch = db.batch();
      operationCount = 0;
    }
  });

  if (operationCount > 0) {
    batches.push(currentBatch);
  }

  console.log(`📦 Data divided into ${batches.length} batches to bypass Firebase limits.`);

  try {
    for (let i = 0; i < batches.length; i++) {
      console.log(`⏳ Uploading batch ${i + 1} of ${batches.length}...`);
      await batches[i].commit();
    }
    console.log("🎉 MASSIVE SUCCESS: All ingredients are safely in Firestore!");
  } catch (error) {
    console.error("❌ Seeding Error:", error);
  } finally {
    process.exit();
  }
}

seedDatabase();