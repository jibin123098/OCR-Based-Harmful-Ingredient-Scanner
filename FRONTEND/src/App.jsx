import React, { useState } from 'react';
import './App.css';
import Scanner from './Scanner'; // <-- This imports your friend's code!

function App() {
  // This state controls which version of the app you are looking at
  const [showFriendCode, setShowFriendCode] = useState(false);
  
  // --- YOUR ORIGINAL STATE AND FUNCTIONS ---
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files;
    if (file) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResults(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!image) {
      setError("Please select an image first.");
      return;
    }
    setLoading(true);
    setError(null);

    setTimeout(() => {
      setResults({
        rawTextSummary: "Water, Sodium Laureth Sulfate, Parabens, Peanuts...",
        harmfulIngredients: [
          { name: "Parabens", reason: "Linked to endocrine disruption." },
          { name: "Sodium Laureth Sulfate", reason: "Can cause skin irritation." }
        ],
        allergens: ["Peanuts"]
      });
      setLoading(false);
    }, 2000);
  };

  // --- IF YOU CLICK THE BUTTON, SHOW FRIEND'S CODE ---
  if (showFriendCode) {
    return (
      <div>
        <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#333' }}>
          <button 
            onClick={() => setShowFriendCode(false)}
            style={{ padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ⬅️ Go Back to My Original Code
          </button>
        </div>
        
        {/* This renders your friend's component */}
        <Scanner /> 
      </div>
    );
  }

  // --- OTHERWISE, SHOW YOUR ORIGINAL CODE ---
  return (
    <div className="container">
      {/* Button to switch to friend's code */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button 
          onClick={() => setShowFriendCode(true)}
          style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: '#4f46e5', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 'bold' }}
        >
          Try Friend's Code Version ➡️
        </button>
      </div>

      <header>
        <h1>ShieldScan AI</h1>
        <p>Prototype: Harmful Ingredient & Allergen Detector</p>
      </header>

      <main>
        <section className="upload-card">
          <h2>Step 1: Upload Product Label</h2>
          <input type="file" accept="image/*" id="file-input" onChange={handleImageChange} hidden />
          <label htmlFor="file-input" className="btn select-btn">
            {image ? "Change Image" : "Choose Label Image"}
          </label>

          {previewUrl && (
            <div className="preview-container">
              <img src={previewUrl} alt="Preview" className="preview-img" />
              <button onClick={handleUpload} className="btn scan-btn" disabled={loading}>
                {loading ? "Analyzing..." : "Scan Ingredients"}
              </button>
            </div>
          )}
        </section>

        {error && <div className="error-message">⚠️ {error}</div>}
        {loading && <div className="loading-spinner"><p>Scanning text via OCR and analyzing with Gemini AI...</p></div>}

        {results && (
          <section className="results-card">
            <h2>Scan Analysis</h2>
            <div className="summary"><p><strong>Raw Text Extracted:</strong> "{results.rawTextSummary}"</p></div>
            <div className="ingredients-grid">
              <div className="category-box critical">
                <h3>🚫 Flagged Harmful Chemicals</h3>
                <ul>
                  {results.harmfulIngredients.map((ing, index) => (
                    <li key={index}><strong>{ing.name}</strong>: {ing.reason}</li>
                  ))}
                </ul>
              </div>
              <div className="category-box warning">
                <h3>⚠️ Potential Allergens</h3>
                <ul>
                  {results.allergens.map((allergen, index) => (
                    <li key={index}><strong>{allergen}</strong></li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;