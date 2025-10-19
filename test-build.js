// Simple test script to verify the build
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🧪 Testing FarmTech Build...');

// Check if dist folder exists
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  console.log('✅ Build directory exists');
  
  // Check for main files
  const indexHtml = path.join(distPath, 'index.html');
  const assetsDir = path.join(distPath, 'assets');
  
  if (fs.existsSync(indexHtml)) {
    console.log('✅ index.html exists');
  } else {
    console.log('❌ index.html missing');
  }
  
  if (fs.existsSync(assetsDir)) {
    console.log('✅ Assets directory exists');
    const assets = fs.readdirSync(assetsDir);
    console.log(`📦 Found ${assets.length} asset files`);
  } else {
    console.log('❌ Assets directory missing');
  }
} else {
  console.log('❌ Build directory does not exist');
}

console.log('🎉 Build test completed!');