import React, { useState, useRef } from 'react';

const Scanner = () => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // --- NEW STATES FOR FEEDBACK MODAL ---
  const [showModal, setShowModal] = useState(false);
  const [reportForm, setReportForm] = useState({ name: '', risk_level: 'Medium', category: 'General', description: '' });
  const [reportLoading, setReportLoading] = useState(false);
  const [reportMessage, setReportMessage] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setResults(null);
      setError(null);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

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
      const response = await fetch('http://localhost:5000/api/scan', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to process image. Please try again.');

      const data = await response.json();
      setResults(data); 
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // --- NEW FUNCTION: SUBMIT REPORT ---
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setReportLoading(true);
    setReportMessage(null);

    try {
      const response = await fetch('http://localhost:5000/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportForm)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setReportMessage({ type: 'success', text: "Success! Your report is under review." });
        // Close modal after 2 seconds
        setTimeout(() => {
          setShowModal(false);
          setReportMessage(null);
          setReportForm({ name: '', risk_level: 'Medium', category: 'General', description: '' });
        }, 2000);
      } else {
        setReportMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setReportMessage({ type: 'error', text: "Failed to connect to server." });
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-sans relative">
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

            <input 
              type="file" 
              accept="image/*" 
              capture="environment"
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

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-sm text-gray-500">Extracting text and identifying chemical compounds...</p>
          </div>
        )}

        {/* Results Area */}
        {results && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden transition duration-300 mb-8">
            <div className="bg-gray-900 px-6 py-4">
              <h2 className="text-lg font-bold text-white">Analysis Results</h2>
            </div>
            
            <div className="p-6 space-y-6">
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
                            (item.risk || item.risk_level) === 'High' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'
                          }`}>
                            {item.risk || item.risk_level || "Medium"} Risk
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

              {/* --- NEW: REPORT BUTTON --- */}
              <div className="pt-4 mt-4 border-t border-gray-100 text-center">
                <p className="text-sm text-gray-500 mb-3">Notice something missing or incorrect?</p>
                <button 
                  onClick={() => setShowModal(true)}
                  className="px-4 py-2 bg-white border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-indigo-500 hover:text-indigo-600 transition text-sm font-medium"
                >
                  + Report Missing Ingredient
                </button>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* --- NEW: REPORT MODAL OVERLAY --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">Report Ingredient</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
            </div>
            
            <form onSubmit={handleReportSubmit} className="p-6 space-y-4">
              {reportMessage && (
                <div className={`p-3 rounded text-sm ${reportMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {reportMessage.text}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ingredient Name *</label>
                <input 
                  required
                  type="text"
                  placeholder="e.g., Titanium Dioxide"
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={reportForm.name}
                  onChange={(e) => setReportForm({...reportForm, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level *</label>
                  <select 
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={reportForm.risk_level}
                    onChange={(e) => setReportForm({...reportForm, risk_level: e.target.value})}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input 
                    type="text"
                    placeholder="e.g., Preservative"
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={reportForm.category}
                    onChange={(e) => setReportForm({...reportForm, category: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Why is this harmful? *</label>
                <textarea 
                  required
                  rows="3"
                  placeholder="Briefly describe the health risks..."
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={reportForm.description}
                  onChange={(e) => setReportForm({...reportForm, description: e.target.value})}
                ></textarea>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={reportLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:bg-indigo-400"
                >
                  {reportLoading ? 'Submitting...' : 'Submit for Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Scanner;