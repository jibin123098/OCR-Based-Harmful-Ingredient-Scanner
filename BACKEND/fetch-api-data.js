const fs = require('fs');
const path = require('path');

// 1. The Enterprise 4-Source Data Array
const API_SOURCES = [
  {
    name: "Open Food Facts",
    url: "https://static.openfoodfacts.org/data/taxonomies/additives.json",
    category: "Food Additive / Dietary"
  },
  {
    name: "Open Beauty Facts",
    url: "https://static.openbeautyfacts.org/data/taxonomies/ingredients.json",
    category: "Cosmetic / Skincare"
  },
  {
    name: "Open Products Facts",
    url: "https://static.openproductsfacts.org/data/taxonomies/ingredients.json",
    category: "Household Cleaner / Detergent"
  },
  {
    name: "Open Pet Food Facts",
    url: "https://static.openpetfoodfacts.org/data/taxonomies/ingredients.json",
    category: "Pet Care / Veterinary"
  }
];

// Expanded Hazard Engine
const HAZARD_KEYWORDS = [
  'paraben', 'sulfate', 'phthalate', 'peg-', 'isothiazolinone', 
  'dye', 'color', 'sulfite', 'glutamate', 'benzoate', 'aspartame',
  'formaldehyde', 'toluene', 'siloxane', 'ethanolamine', 'triclosan',
  'bht', 'bha', 'oxybenzone'
];

async function fetchAllDatabases() {
  console.log("🌐 Initiating 4-Source Enterprise Data Aggregation...");
  const harvestedIngredients = [];

  for (const source of API_SOURCES) {
    console.log(`\n📡 Fetching from: ${source.name}...`);
    try {
      const response = await fetch(source.url);
      
      if (!response.ok) {
          console.log(`⚠️ Skipping ${source.name} (Endpoint temporarily unavailable)`);
          continue;
      }
      
      const data = await response.json();
      let sourceCount = 0;

      for (const key in data) {
        const item = data[key];
        
        if (item.name && item.name.en) {
          const englishName = item.name.en.toLowerCase();
          
          const isHazardous = HAZARD_KEYWORDS.some(keyword => englishName.includes(keyword));

          if (isHazardous) {
            const shortCode = key.replace('en:', '').toUpperCase();
            
            harvestedIngredients.push({
              name: item.name.en, 
              risk_level: "High", 
              category: source.category,
              description: `Automated flag via ${source.name}. Chemical signature tracked as ${shortCode}.`,
              aliases: [shortCode.toLowerCase(), englishName, shortCode]
            });
            sourceCount++;
          }
        }
      }
      console.log(`✅ Harvested ${sourceCount} hazardous items from ${source.name}.`);
    } catch (error) {
      console.error(`❌ Failed to fetch from ${source.name}:`, error.message);
    }
  }

  // 2. The Deduplication Engine (Prevents database bloat)
  console.log("\n🔄 Merging harvested data with local ingredients.json...");
  const filePath = path.join(__dirname, 'data', 'ingredients.json');
  
  let existingData = [];
  if (fs.existsSync(filePath)) {
    existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  
  const combinedData = [...existingData];
  let newAdditionsCount = 0;

  harvestedIngredients.forEach(newItem => {
    // We check if it exists. If it does, we skip to avoid duplicates.
    const exists = combinedData.some(item => item.name.toLowerCase() === newItem.name.toLowerCase());
    if (!exists) {
      combinedData.push(newItem);
      newAdditionsCount++;
    }
  });

  // 3. Save the final Master List
  fs.writeFileSync(filePath, JSON.stringify(combinedData, null, 2));
  
  console.log(`\n🎉 ENTERPRISE PIPELINE SUCCESS!`);
  console.log(`✅ Total distinct ingredients in local JSON: ${combinedData.length}`);
  console.log(`✅ Newly harvested across 4 databases: ${newAdditionsCount} items.`);
}

fetchAllDatabases();