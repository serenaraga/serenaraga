const fs = require('fs');
const path = require('path');

const svgContent = fs.readFileSync(path.join(__dirname, '..', 'BrandAssets', 'SerenaSVG', '4.svg'), 'utf8');

console.log("SVG loaded, length:", svgContent.length);
