const express = require('express');
const cors = require('cors');
const multer = require('multer');
const vision = require('@google-cloud/vision');

// 1. Initialize Firebase 
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./firebase-key.json');

initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore();
console.log("🔥 Firestore Database successfully connected!");

// ==========================================
// 🚀 IN-MEMORY CACHE ENGINE
// ==========================================
let cachedIngredients = [];

async function loadDatabaseIntoMemory() {
    console.log("⏳ Downloading Firebase dataset into fast RAM cache...");
    try {
        const snapshot = await db.collection('harmful_ingredients').get();
        cachedIngredients = []; // Clear old cache
        
        snapshot.forEach(doc => {
            cachedIngredients.push(doc.data());
        });
        
        console.log(`✅ CACHE READY: ${cachedIngredients.length} ingredients loaded into memory!`);
        console.log(`💡 Your app will now process scans instantly with ZERO extra database costs.`);
    } catch (error) {
        console.error("❌ Failed to load cache:", error);
    }
}

// Trigger the download immediately when the server starts
loadDatabaseIntoMemory();
// ==========================================

// 2. Set up the server & Google Client
const app = express();
app.use(cors());
app.use(express.json());

const client = new vision.ImageAnnotatorClient({
    keyFilename: './vision-key.json'
});

const upload = multer({ storage: multer.memoryStorage() });

// 3. MAIN ENDPOINT (Now using ultra-fast RAM Cache)
app.post('/api/scan', upload.single('labelImage'), async (req, res) => {
  try {
    if (!req.file) {
        return res.status(400).json({ error: "No image file uploaded." });
    }

    console.log(`📸 Image received. Sending Base64 to Google Vision...`);
    
    const request = {
        image: { content: req.file.buffer.toString('base64') }
    };
    
    const [result] = await client.textDetection(request);
    
    if (result.error) {
        return res.status(500).json({ error: result.error.message });
    }

    const fullText = result.fullTextAnnotation;
    if (!fullText || !fullText.text) {
        return res.json({ allIngredients: [], flaggedIngredients: [] });
    }

    const rawOcrText = fullText.text;
    const lowerCasedText = rawOcrText.toLowerCase();
    const detectedIngredients = [];

    // 🔍 SCANNING AGAINST FAST MEMORY CACHE (No database calls here!)
    cachedIngredients.forEach(ingredient => {
      if (!ingredient || !ingredient.name) return; 

      const matchName = ingredient.name.toLowerCase();
      const ingredientAliases = Array.isArray(ingredient.aliases) ? ingredient.aliases : [];
      
      let isMatched = lowerCasedText.includes(matchName);

      if (!isMatched && ingredientAliases.length > 0) {
        isMatched = ingredientAliases.some(alias => alias && lowerCasedText.includes(alias.toLowerCase()));
      }

      if (isMatched) {
        detectedIngredients.push({
          name: ingredient.name,
          risk: ingredient.risk_level || "Medium",
          category: ingredient.category || "Uncategorized",
          description: ingredient.description || "No description available."
        });
      }
    });

    console.log(`🎯 Scan Analysis Complete. Flagged ${detectedIngredients.length} items.`);

    res.json({
      allIngredients: rawOcrText.split(/\W+/).filter(word => word.length > 2),
      flaggedIngredients: detectedIngredients
    });

  } catch (error) {
    console.error("Scan processing failed:", error);
    res.status(500).json({ error: "Internal server error during processing." });
  }
});

// 4. Start server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});