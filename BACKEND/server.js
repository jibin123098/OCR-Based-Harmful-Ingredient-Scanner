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

// 4. The MAIN ENDPOINT: This is where the frontend sends the image
app.post('/api/analyze', upload.single('image'), (req, res) => {
    // If no image was sent, return an error
    if (!req.file) {
        return res.status(400).json({ error: "No image file uploaded." });
    }
    
    console.log("Success! Image received:", req.file);

    // 5. Send fake data back to the frontend (We will add Google Vision later)
    res.json({ 
        message: "Image successfully received by the backend!",
        mockIngredients: ["Water", "Sugar", "Parabens", "Sulfates"]
    });
});

// 6. Turn the server on
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});