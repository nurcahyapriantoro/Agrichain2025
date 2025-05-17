const fs = require('fs');
const path = require('path');

// Try to get the path to the lucide-react package
const nodeModulesPath = path.resolve(process.cwd(), 'node_modules');
const lucidePath = path.join(nodeModulesPath, 'lucide-react');

if (!fs.existsSync(lucidePath)) {
  console.error('lucide-react package not found in node_modules');
  process.exit(1);
}

// Check the TypeScript definition file which should have all icons
const typesFile = path.join(lucidePath, 'dist', 'lucide-react.d.ts');

if (!fs.existsSync(typesFile)) {
  console.error('Could not find lucide-react type definitions file');
  process.exit(1);
}

// Read the file to look for exported components
const fileContent = fs.readFileSync(typesFile, 'utf8');

// Look for icon declarations in the format: "export declare const IconName: ..."
const exportRegex = /export declare const (\w+):/g;
const iconNames = [];
let match;

while ((match = exportRegex.exec(fileContent)) !== null) {
  const iconName = match[1];
  if (iconName && !iconNames.includes(iconName)) {
    iconNames.push(iconName);
  }
}

console.log('Found icons:');
console.log(iconNames.sort().join('\n'));
console.log(`Total: ${iconNames.length} icons`);

// Check specifically for Cube icon
if (iconNames.includes('Cube')) {
  console.log('Cube icon is available');
} else {
  console.log('Cube icon is NOT available');
  
  // Look for similar icons
  const similarIcons = iconNames.filter(name => 
    name.toLowerCase().includes('cube') || 
    name.toLowerCase().includes('box') ||
    name.toLowerCase().includes('square') ||
    name.toLowerCase().includes('package')
  );
  
  if (similarIcons.length > 0) {
    console.log('Similar icons you might use instead:');
    console.log(similarIcons.join(', '));
  }
} 