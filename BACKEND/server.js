const express = require('express');
const cors = require('cors');
const multer = require('multer');

// 1. Import Google Cloud Vision
const vision = require('@google-cloud/vision');

// 2. Set up the server & Google Client
const app = express();
app.use(cors());
app.use(express.json());

// Tell the server exactly where your secret key is
const client = new vision.ImageAnnotatorClient({
    keyFilename: './vision-key.json'
});

// 3. Set up the "Mail Clerk" to catch uploaded images
const upload = multer({ dest: 'uploads/' });

// 4. A simple test route
app.get('/', (req, res) => {
    res.send("Backend server is running perfectly!");
});

// 5. The MAIN ENDPOINT: Now with real Google Vision OCR!
// Notice the word "async" before (req, res) - this tells the server to wait for Google!
app.post('/api/scan', upload.single('labelImage'), async (req, res) => {
    
    if (!req.file) {
        return res.status(400).json({ error: "No image file uploaded." });
    }
    
    console.log("Success! Image received:", req.file.originalname);

    try {
        // ---> THE MAGIC HAPPENS HERE <---
        console.log("Sending image to Google Vision...");
        
        // 6. Pass the saved image file path directly to Google
        const [result] = await client.textDetection(req.file.path);
        
        // 7. Extract the raw text from Google's response
        const rawText = result.fullTextAnnotation ? result.fullTextAnnotation.text : 'No text found';
        
        console.log("-----------------------------------------");
        console.log("GOOGLE READ THIS TEXT:\n", rawText);
        console.log("-----------------------------------------");

        // 8. Send Jibin's fake data back so the UI doesn't break, 
        // but we are now successfully extracting the REAL text!
        res.json({ 
            allIngredients: ["Water", "Glycerin", "Parabens", "Fragrance", "Sulfates"],
            flaggedIngredients: [
                { 
                    name: "Parabens", 
                    risk: "High", 
                    description: "Synthetic preservative linked to hormonal disruption." 
                },
                { 
                    name: "Sulfates", 
                    risk: "Medium", 
                    description: "Harsh cleansing agent that can strip natural oils and irritate skin." 
                }
            ]
        });
    } catch (error) {
        console.error("Error with Google Vision:", error);
        res.status(500).json({ error: "Failed to read image text." });
    }
});

// 9. Turn the server on
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});