import React, { useState, useRef } from 'react';

const Scanner = () => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Handle image upload from file picker
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setResults(null);
      setError(null);
    }
  };

  // Trigger file input click for custom buttons
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Submit image to Node.js backend
  const handleScanSubmit = async () => {
    if (!image) {
      setError("Please capture or upload an image first.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    const formData = new FormData();
    formData.append('labelImage', image);

    try {
      // Adjust URL to match your backend port/endpoint
      const response = await fetch('http://localhost:5000/api/scan', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process image. Please try again.');
      }

      const data = await response.json();
      setResults(data); // Expecting structural format: { allIngredients: [], flaggedIngredients: [ { name, risk, description } ] }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Harmful Ingredient Scanner
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Upload or capture a product label to analyze hidden chemicals and allergens.
          </p>
        </div>

        {/* Scanner Controls */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-8">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition duration-150">
            {image ? (
              <div className="text-center">
                <img 
                  src={URL.createObjectURL(image)} 
                  alt="Product Label Preview" 
                  className="max-h-64 mx-auto rounded-lg shadow-sm mb-4"
                />
                <p className="text-sm text-gray-500 mb-2">{image.name || "Captured Image"}</p>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-sm text-gray-600">No image selected</p>
              </div>
            )}

            {/* Hidden Input supporting file upload and mobile camera trigger */}
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" // Forces mobile devices to open back camera directly
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
            />

            <div className="mt-4 flex flex-wrap gap-3 justify-center">
              <button 
                type="button" 
                onClick={triggerFileInput}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                Choose Photo / Take Picture
              </button>
              
              <button 
                type="button"
                onClick={handleScanSubmit}
                disabled={!image || loading}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  !image || loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                } focus:outline-none`}
              >
                {loading ? 'Analyzing Label...' : 'Scan Ingredients'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Results Area */}
        {loading && (
          <div className="flex flex-col items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-sm text-gray-500">Extracting text and identifying chemical compounds...</p>
          </div>
        )}

        {results && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden transition duration-300">
            <div className="bg-gray-900 px-6 py-4">
              <h2 className="text-lg font-bold text-white">Analysis Results</h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Flagged Harmful Elements */}
              <div>
                <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full mr-2"></span>
                  Flagged Concerns ({results.flaggedIngredients?.length || 0})
                </h3>
                
                {results.flaggedIngredients && results.flaggedIngredients.length > 0 ? (
                  <div className="space-y-3">
                    {results.flaggedIngredients.map((item, idx) => (
                      <div key={idx} className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-red-900 capitalize">{item.name}</h4>
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                            item.risk === 'High' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'
                          }`}>
                            {item.risk} Risk
                          </span>
                        </div>
                        <p className="text-sm text-red-700 mt-1">{item.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-green-600 font-medium p-4 bg-green-50 rounded-lg">
                    ✓ No high-risk chemicals or common allergens detected in your custom database!
                  </p>
                )}
              </div>

              <hr className="border-gray-200" />

              {/* All Extracted Ingredients */}
              <div>
                <h3 className="text-md font-semibold text-gray-800 mb-3">All Detected Ingredients</h3>
                <div className="flex flex-wrap gap-2">
                  {results.allIngredients?.map((ing, idx) => (
                    <span 
                      key={idx} 
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200 capitalize"
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Scanner;