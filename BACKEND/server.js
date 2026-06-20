const express = require('express');
const cors = require('cors');
const multer = require('multer');

// 1. Set up the server
const app = express();
app.use(cors());
app.use(express.json());

// 2. Set up the "Mail Clerk" to catch uploaded images
const upload = multer({ dest: 'uploads/' });

// 3. A simple test route just to prove the server is alive
app.get('/', (req, res) => {
    res.send("Backend server is running perfectly!");
});
// 4. The MAIN ENDPOINT: Updated to match Jibin's frontend exactly!
app.post('/api/scan', upload.single('labelImage'), (req, res) => {
    
    if (!req.file) {
        return res.status(400).json({ error: "No image file uploaded." });
    }
    
    console.log("Success! Image received:", req.file.originalname);

    // 5. Send fake data formatted exactly how Jibin's UI expects it
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
});

// 6. Turn the server on
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});