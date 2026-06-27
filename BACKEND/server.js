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

// 2. Set up the server & Google Client
const app = express();
app.use(cors());
app.use(express.json());

const client = new vision.ImageAnnotatorClient({
    keyFilename: './vision-key.json'
});

const upload = multer({ storage: multer.memoryStorage() });

// 3. A simple test route
app.get('/', (req, res) => {
    res.send("Backend server is running perfectly!");
});

// 4. MAIN ENDPOINT
app.post('/api/scan', upload.single('labelImage'), async (req, res) => {
  try {
    if (!req.file) {
        return res.status(400).json({ error: "No image file uploaded." });
    }

    console.log(`📸 Image received: ${req.file.originalname}. Sending Base64 to Google Vision...`);

    // 🛑 THE FIX: Convert buffer to Base64 string so Google knows exactly what it is
    const base64Image = req.file.buffer.toString('base64');
    
    const request = {
        image: { content: base64Image }
    };
    
    const [result] = await client.textDetection(request);
    console.log("Full Google Response received!");
    //console.log("Full Result Object:", JSON.stringify(result, null, 2));
    // Safety guard: Check for API errors
    if (result.error) {
        console.error("🛑 GOOGLE VISION API ERROR:", result.error.message);
        return res.status(500).json({ error: result.error.message });
    }

    // 🛑 THE FIX: Access the full text annotation directly
    const fullText = result.fullTextAnnotation;
    
    // Safety guard
    if (!fullText || !fullText.text) {
        console.log("⚠️ No text found in this image.");
        return res.json({ allIngredients: [], flaggedIngredients: [] });
    }

    const rawOcrText = fullText.text;
    const lowerCasedText = rawOcrText.toLowerCase();

    console.log("✅ OCR Complete! Text found:", rawOcrText);
    console.log("Scanning text against Firestore database...");

    // B. Fetch all harmful ingredients from your Firestore collection
    const snapshot = await db.collection('harmful_ingredients').get();
    const detectedIngredients = [];

    // C. Compare extracted text against ingredient names and their aliases
    snapshot.forEach(doc => {
      const ingredient = doc.data();
      
      // Safety guard: Skip broken rows
      if (!ingredient || !ingredient.name) return; 

      const matchName = ingredient.name.toLowerCase();
      const ingredientAliases = Array.isArray(ingredient.aliases) ? ingredient.aliases : [];
      
      const isMatched = lowerCasedText.includes(matchName) || 
                        ingredientAliases.some(alias => alias && lowerCasedText.includes(alias.toLowerCase()));

      if (isMatched) {
        detectedIngredients.push({
          name: ingredient.name,
          risk: ingredient.risk_level || "Medium",
          description: ingredient.description || "No description available."
        });
      }
    });

    // E. Send results back to React frontend
    res.json({
      allIngredients: rawOcrText.split(/\W+/).filter(word => word.length > 2),
      flaggedIngredients: detectedIngredients
    });

  } catch (error) {
    console.error("Scan processing failed:", error);
    res.status(500).json({ error: "Internal server error during processing." });
  }
});

// 5. Start server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});