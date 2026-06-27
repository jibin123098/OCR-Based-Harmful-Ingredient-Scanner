// 1. Use the new modern Firebase imports
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./firebase-key.json');

// 2. Initialize Firebase
initializeApp({
  credential: cert(serviceAccount)
});

// 3. Connect to Firestore
const db = getFirestore();

// 4. Starter dataset of harmful ingredients
const ingredientsToSeed = [
  {
    name: "Parabens",
    risk_level: "High",
    category: "Preservatives",
    description: "Disrupts hormone function and mimics estrogen. Frequently linked to reproductive issues.",
    aliases: ["methylparaben", "propylparaben", "butylparaben", "isobutylparaben"]
  },
  {
    name: "Sodium Lauryl Sulfate",
    risk_level: "Medium",
    category: "Surfactants",
    description: "Can cause severe skin and eye irritation, strip skin of natural oils, and trigger allergies.",
    aliases: ["sls", "sodium laureth sulfate", "sles", "sodium dodecyl sulfate"]
  },
  {
    name: "Phthalates",
    risk_level: "High",
    category: "Plasticizers/Fragrances",
    description: "Endocrine disruptors linked to developmental and reproductive toxicity.",
    aliases: ["dibutyl phthalate", "diethyl phthalate", "dbp", "dep", "fragrance", "parfum"]
  }
];

async function seedDatabase() {
  console.log("🔄 Seeding Firestore database...");
  
  for (const ingredient of ingredientsToSeed) {
    const docId = ingredient.name.toLowerCase().replace(/\s+/g, '-');
    await db.collection('harmful_ingredients').doc(docId).set(ingredient);
    console.log(`✅ Added: ${ingredient.name}`);
  }
  
  console.log("🎉 Seeding complete! You can close this script.");
  process.exit();
}

seedDatabase().catch(console.error);